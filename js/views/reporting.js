import { getCurrentLguId } from './state.js';

export async function renderReporting() {
                const container = document.getElementById('report-container');
                const printBtn = document.getElementById('btn-print-report');
                
                if (printBtn) {
                    printBtn.addEventListener('click', () => window.print());
                }
        const currentLguId = getCurrentLguId();

                if (!currentLguId) {
                    container.innerHTML = '<p class="text-red-500 text-center">Please select an LGU first.</p>';
                    return;
                }

                try {
                    // Fetch Data
                    const [lgu, buildings, vehicles, rios, ppas, mecrSnap, mfcrSnap, seuSnap] = await Promise.all([
                window.getLguById(currentLguId),
                window.getFsbdList(),
                window.getVehicleList(),
                window.getRioList(),
                window.getPpaList(),
                        window.db.collection('mecr_reports').get(),
                        window.db.collection('mfcr_reports').get(),
                        window.db.collection('seu_findings').get()
                    ]);

                    // Filter Data
                    const lguBuildings = buildings.filter(b => b.lguId === currentLguId);
                    const lguVehicles = vehicles.filter(v => v.lguId === currentLguId);
                    
                    const bldgIds = new Set(lguBuildings.map(b => b.id));
                    const vehIds = new Set(lguVehicles.map(v => v.id));

                    const lguRios = rios.filter(r => bldgIds.has(r.fsbdId) || vehIds.has(r.vehicleId));
                    
                    // Filter PPAs based on RIOs
                    const rioIds = new Set(lguRios.map(r => r.id));
                    const lguPpas = ppas.filter(p => p.relatedRioIds && p.relatedRioIds.some(id => rioIds.has(id)));

                    const mecr = mecrSnap.docs.map(d => d.data()).filter(r => bldgIds.has(r.fsbdId));
                    const mfcr = mfcrSnap.docs.map(d => d.data()).filter(r => vehIds.has(r.vehicleId));
                    const lguSeus = seuSnap.docs.map(d => d.data()).filter(s => bldgIds.has(s.fsbdId) || vehIds.has(s.vehicleId));

                    // Calculations
                    const totalElectricity = mecr.reduce((sum, r) => sum + (Number(r.electricity_consumption_kwh) || 0), 0);
                    const totalFuel = mfcr.reduce((sum, r) => sum + (Number(r.fuel_consumed_liters) || 0), 0);
                    
                    // Group Consumption by Asset for Drilldown
                    const mecrByBuilding = {};
                    mecr.forEach(r => {
                        if (!mecrByBuilding[r.fsbdId]) mecrByBuilding[r.fsbdId] = [];
                        mecrByBuilding[r.fsbdId].push(r);
                    });

                    const mfcrByVehicle = {};
                    mfcr.forEach(r => {
                        if (!mfcrByVehicle[r.vehicleId]) mfcrByVehicle[r.vehicleId] = [];
                        mfcrByVehicle[r.vehicleId].push(r);
                    });

                    // Date formatting
                    const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

                    // --- CHART DATA PREPARATION ---
                    const chartColors = [
                        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
                        '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
                    ];

                    // 1. Shares (Pie Charts)
                    const elecShareLabels = lguBuildings.map(b => b.name);
                    const elecShareData = lguBuildings.map(b => {
                        return mecr.filter(r => r.fsbdId === b.id).reduce((sum, r) => sum + (Number(r.electricity_consumption_kwh)||0), 0);
                    });

                    const fuelShareLabels = lguVehicles.map(v => v.plate_number);
                    const fuelShareData = lguVehicles.map(v => {
                        return mfcr.filter(r => r.vehicleId === v.id).reduce((sum, r) => sum + (Number(r.fuel_consumed_liters)||0), 0);
                    });

                    // 2. Trends (Stacked Bar)
                    const getPeriod = (r) => `${r.reporting_year}-${String(r.reporting_month).padStart(2, '0')}`;
                    
                    // Electricity Trends
                    const elecPeriods = [...new Set(mecr.map(getPeriod))].sort();
                    const elecTrendDatasets = lguBuildings.map((b, i) => ({
                        label: b.name,
                        data: elecPeriods.map(p => {
                            const match = mecr.find(r => r.fsbdId === b.id && getPeriod(r) === p);
                            return match ? (Number(match.electricity_consumption_kwh)||0) : 0;
                        }),
                        backgroundColor: chartColors[i % chartColors.length]
                    }));

                    // Fuel Trends
                    const fuelPeriods = [...new Set(mfcr.map(getPeriod))].sort();
                    const fuelTrendDatasets = lguVehicles.map((v, i) => ({
                        label: v.plate_number,
                        data: fuelPeriods.map(p => {
                            const match = mfcr.find(r => r.vehicleId === v.id && getPeriod(r) === p);
                            return match ? (Number(match.fuel_consumed_liters)||0) : 0;
                        }),
                        backgroundColor: chartColors[i % chartColors.length]
                    }));

                    // 3. Statuses (Doughnut/Bar)
                    const rioStatuses = ['Identified', 'Planned', 'In Progress', 'Completed', 'Implemented'];
                    const rioStatusData = rioStatuses.map(s => lguRios.filter(r => r.status === s).length);
                    
                    const ppaStatuses = ['Planned', 'Ongoing', 'Completed'];
                    const ppaStatusData = ppaStatuses.map(s => lguPpas.filter(p => p.status === s).length);

                    // 4. Financials (Bar Charts)
                    const rioPriorities = ['High', 'Medium', 'Low'];
                    const rioCostByPriority = rioPriorities.map(p => lguRios.filter(r => r.priority === p).reduce((sum, r) => sum + (r.estimated_cost_php || 0), 0));
                    const rioSavingsByPriority = rioPriorities.map(p => lguRios.filter(r => r.priority === p).reduce((sum, r) => sum + (r.estimated_savings_php || 0), 0));

                    const ppaEstCostByStatus = ppaStatuses.map(s => lguPpas.filter(p => p.status === s).reduce((sum, p) => sum + (p.estimated_cost_php || 0), 0));
                    const ppaActualCostByStatus = ppaStatuses.map(s => lguPpas.filter(p => p.status === s).reduce((sum, p) => sum + (p.actual_cost_php || 0), 0));

                    // 5. SEU Distribution
                    const seuCategories = {};
                    lguSeus.forEach(s => {
                        const cat = s.energy_use_category || 'Uncategorized';
                        seuCategories[cat] = (seuCategories[cat] || 0) + 1;
                    });
                    const seuLabels = Object.keys(seuCategories);
                    const seuData = Object.values(seuCategories);

                    // Helper to render charts after HTML injection
                    const initCharts = () => {
                        const commonOptions = { animation: false, responsive: true, maintainAspectRatio: false };
                        
                        new Chart(document.getElementById('chart-elec-share'), { type: 'pie', data: { labels: elecShareLabels, datasets: [{ data: elecShareData, backgroundColor: chartColors }] }, options: commonOptions });
                        new Chart(document.getElementById('chart-fuel-share'), { type: 'pie', data: { labels: fuelShareLabels, datasets: [{ data: fuelShareData, backgroundColor: chartColors }] }, options: commonOptions });
                        
                        new Chart(document.getElementById('chart-elec-trend'), { type: 'bar', data: { labels: elecPeriods, datasets: elecTrendDatasets }, options: { ...commonOptions, scales: { x: { stacked: true }, y: { stacked: true } } } });
                        new Chart(document.getElementById('chart-fuel-trend'), { type: 'bar', data: { labels: fuelPeriods, datasets: fuelTrendDatasets }, options: { ...commonOptions, scales: { x: { stacked: true }, y: { stacked: true } } } });

                        new Chart(document.getElementById('chart-rio-status'), { type: 'doughnut', data: { labels: rioStatuses, datasets: [{ data: rioStatusData, backgroundColor: ['#9CA3AF', '#FCD34D', '#60A5FA', '#34D399', '#10B981'] }] }, options: commonOptions });
                        new Chart(document.getElementById('chart-ppa-status'), { type: 'doughnut', data: { labels: ppaStatuses, datasets: [{ data: ppaStatusData, backgroundColor: ['#FCD34D', '#60A5FA', '#10B981'] }] }, options: commonOptions });
                        
                        // Financial Charts
                        new Chart(document.getElementById('chart-rio-finance'), { type: 'bar', data: { labels: rioPriorities, datasets: [{ label: 'Est. Cost', data: rioCostByPriority, backgroundColor: '#EF4444' }, { label: 'Est. Savings', data: rioSavingsByPriority, backgroundColor: '#10B981' }] }, options: commonOptions });
                        new Chart(document.getElementById('chart-ppa-finance'), { type: 'bar', data: { labels: ppaStatuses, datasets: [{ label: 'Est. Cost', data: ppaEstCostByStatus, backgroundColor: '#F59E0B' }, { label: 'Actual Cost', data: ppaActualCostByStatus, backgroundColor: '#3B82F6' }] }, options: commonOptions });
                        
                        // SEU Chart
                        new Chart(document.getElementById('chart-seu-dist'), { type: 'pie', data: { labels: seuLabels, datasets: [{ data: seuData, backgroundColor: chartColors }] }, options: commonOptions });
                    };

                    // HTML Generation
                    container.innerHTML = `
                        <div class="max-w-4xl mx-auto font-serif text-gray-900">
                            <!-- COVER PAGE -->
                            <div class="flex flex-col justify-center items-center min-h-[90vh] text-center break-after-page" style="page-break-after: always;">
                                <div class="mb-12 pt-20">
                                    <h1 class="text-4xl font-bold uppercase tracking-widest mb-4">Compliance Report</h1>
                                    <h2 class="text-2xl font-semibold text-gray-700">Energy Efficiency & Conservation Act (RA 11285)</h2>
                                </div>
                                
                                <div class="mb-16 flex-grow flex flex-col justify-center">
                                    <h3 class="text-5xl font-bold text-blue-900 mb-4">${lgu.name || 'LGU Name'}</h3>
                                    <p class="text-xl text-gray-600">${lgu.region || ''}, ${lgu.province || ''}</p>
                                </div>

                                <div class="mt-auto mb-20">
                                    <p class="text-lg text-gray-500">Generated on</p>
                                    <p class="text-2xl font-bold">${dateStr}</p>
                                </div>
                            </div>

                            <!-- Executive Summary -->
                            <div class="mb-8 pt-8">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">1. Executive Summary</h3>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p><span class="font-semibold">Region:</span> ${lgu.region || '-'}</p>
                                        <p><span class="font-semibold">Province:</span> ${lgu.province || '-'}</p>
                                    </div>
                                    <div class="text-right">
                                        <p><span class="font-semibold">Head of LGU:</span> ${lgu.head_of_lgu || '-'}</p>
                                        <p><span class="font-semibold">Contact:</span> ${lgu.email || '-'}</p>
                                    </div>
                                </div>
                                <div class="mt-6 grid grid-cols-2 gap-4">
                                    <div class="bg-gray-50 p-4 rounded border">
                                        <p class="text-xs text-gray-500 uppercase">Total Electricity Recorded</p>
                                        <p class="text-xl font-bold text-indigo-700">${totalElectricity.toLocaleString()} kWh</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded border">
                                        <p class="text-xs text-gray-500 uppercase">Total Fuel Recorded</p>
                                        <p class="text-xl font-bold text-teal-700">${totalFuel.toLocaleString()} Liters</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Asset Inventory -->
                            <div class="mb-8">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">2. Asset Inventory</h3>
                                <p class="text-sm text-gray-600 mb-4">Summary of registered government-owned assets.</p>
                                <div class="grid grid-cols-2 gap-8">
                                    <div>
                                        <h4 class="font-bold text-sm mb-2">Buildings (${lguBuildings.length})</h4>
                                        <ul class="list-disc list-inside text-sm text-gray-700">
                                            ${lguBuildings.slice(0, 5).map(b => `<li>${b.name} <span class="text-xs text-gray-500">(${b.fsbd_type})</span></li>`).join('')}
                                            ${lguBuildings.length > 5 ? `<li class="italic text-gray-500">...and ${lguBuildings.length - 5} more</li>` : ''}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-sm mb-2">Vehicles (${lguVehicles.length})</h4>
                                        <ul class="list-disc list-inside text-sm text-gray-700">
                                            ${lguVehicles.slice(0, 5).map(v => `<li>${v.plate_number} <span class="text-xs text-gray-500">(${v.model})</span></li>`).join('')}
                                            ${lguVehicles.length > 5 ? `<li class="italic text-gray-500">...and ${lguVehicles.length - 5} more</li>` : ''}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Consumption Analysis -->
                            <div class="mb-8 break-before-page" style="page-break-before: always;">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">3. Consumption Analysis</h3>
                                
                                <!-- Charts Row 1: Shares -->
                                <div class="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">Electricity Share by Building</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-elec-share"></canvas></div>
                                    </div>
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">Fuel Share by Vehicle</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-fuel-share"></canvas></div>
                                    </div>
                                </div>

                                <!-- Charts Row 2: Trends -->
                                <div class="mb-8 break-inside-avoid">
                                    <h4 class="font-bold text-sm text-center mb-2">Electricity Consumption Trend (Stacked)</h4>
                                    <div class="relative h-80 w-full"><canvas id="chart-elec-trend"></canvas></div>
                                </div>

                                <div class="mb-8 break-inside-avoid">
                                    <h4 class="font-bold text-sm text-center mb-2">Fuel Consumption Trend (Stacked)</h4>
                                    <div class="relative h-80 w-full"><canvas id="chart-fuel-trend"></canvas></div>
                                </div>
                                
                                <h4 class="font-bold text-md text-indigo-800 mb-3 mt-6 border-t pt-4">3.1 Detailed Electricity Reports</h4>
                                ${lguBuildings.map(b => {
                                    const reports = mecrByBuilding[b.id] || [];
                                    if (reports.length === 0) return '';
                                    // Sort by date
                                    reports.sort((x, y) => (x.reporting_year - y.reporting_year) || (x.reporting_month - y.reporting_month));
                                    return `
                                        <div class="mb-6 break-inside-avoid">
                                            <p class="font-bold text-sm mb-1">${b.name} <span class="font-normal text-gray-500">(${b.fsbd_type})</span></p>
                                            <table class="w-full text-xs text-left border border-gray-200">
                                                <thead class="bg-gray-50">
                                                    <tr>
                                                        ${reports.map(r => `<th class="p-1 border text-center">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</th>`).join('')}
                                                        <th class="p-1 border text-center font-bold">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        ${reports.map(r => `<td class="p-1 border text-center">${r.electricity_consumption_kwh.toLocaleString()}</td>`).join('')}
                                                        <td class="p-1 border text-center font-bold">${reports.reduce((s,r)=>s+r.electricity_consumption_kwh,0).toLocaleString()} kWh</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    `;
                                }).join('') || '<p class="text-sm italic text-gray-500">No electricity reports available.</p>'}

                                <h4 class="font-bold text-md text-teal-800 mb-3 mt-8">3.2 Detailed Fuel Reports</h4>
                                ${lguVehicles.map(v => {
                                    const reports = mfcrByVehicle[v.id] || [];
                                    if (reports.length === 0) return '';
                                    reports.sort((x, y) => (x.reporting_year - y.reporting_year) || (x.reporting_month - y.reporting_month));
                                    return `
                                        <div class="mb-6 break-inside-avoid">
                                            <p class="font-bold text-sm mb-1">${v.plate_number} <span class="font-normal text-gray-500">(${v.make} ${v.model})</span></p>
                                            <table class="w-full text-xs text-left border border-gray-200">
                                                <thead class="bg-gray-50">
                                                    <tr>
                                                        ${reports.map(r => `<th class="p-1 border text-center">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</th>`).join('')}
                                                        <th class="p-1 border text-center font-bold">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        ${reports.map(r => `<td class="p-1 border text-center">${r.fuel_consumed_liters.toLocaleString()}</td>`).join('')}
                                                        <td class="p-1 border text-center font-bold">${reports.reduce((s,r)=>s+r.fuel_consumed_liters,0).toLocaleString()} L</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    `;
                                }).join('') || '<p class="text-sm italic text-gray-500">No fuel reports available.</p>'}
                            </div>

                            <!-- SEU Findings -->
                            <div class="mb-8 break-before-page" style="page-break-before: always;">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">4. Significant Energy Use (SEU)</h3>
                                
                                <!-- SEU Chart -->
                                <div class="mb-8 break-inside-avoid flex flex-col items-center">
                                    <h4 class="font-bold text-sm text-center mb-2">SEU Distribution by Category</h4>
                                    <div class="relative h-64 w-full max-w-md"><canvas id="chart-seu-dist"></canvas></div>
                                </div>

                                <p class="text-sm text-gray-600 mb-4">Identified areas of significant energy consumption.</p>
                                <table class="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr class="border-b border-gray-400">
                                            <th class="py-1">Asset</th>
                                            <th class="py-1">Category</th>
                                            <th class="py-1">Description</th>
                                            <th class="py-1">Method</th>
                                            <th class="py-1">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${lguSeus.map(s => {
                                            const asset = s.fsbdId ? lguBuildings.find(b => b.id === s.fsbdId) : lguVehicles.find(v => v.id === s.vehicleId);
                                            const assetName = asset ? (asset.name || asset.plate_number) : 'Unknown Asset';
                                            return `
                                            <tr class="border-b border-gray-200">
                                                <td class="py-1 font-medium">${assetName}</td>
                                                <td class="py-1">${s.energy_use_category || '-'}</td>
                                                <td class="py-1">${s.finding_description || '-'}</td>
                                                <td class="py-1">${s.identification_method || '-'}</td>
                                                <td class="py-1 text-xs">${s.status || '-'}</td>
                                            </tr>
                                            `;
                                        }).join('') || '<tr><td colspan="5" class="italic text-gray-500 py-1">No SEU findings recorded.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Recommendations & Projects -->
                            <div class="mb-8 break-before-page" style="page-break-before: always;">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">5. Action Plan</h3>
                                
                                <!-- Charts: Status Overview -->
                                <div class="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">RIO Status Distribution</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-rio-status"></canvas></div>
                                    </div>
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">PPA Status Distribution</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-ppa-status"></canvas></div>
                                    </div>
                                </div>

                                <!-- Charts: Financial Overview -->
                                <div class="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">RIO Financial Impact (by Priority)</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-rio-finance"></canvas></div>
                                    </div>
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">PPA Budget Performance (by Status)</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-ppa-finance"></canvas></div>
                                    </div>
                                </div>

                                <div class="mb-6">
                                    <h4 class="font-bold text-sm mb-2">5.1 Recommendations List</h4>
                                    <table class="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr class="border-b border-gray-400">
                                                <th class="py-1">Action</th>
                                                <th class="py-1">Priority</th>
                                                <th class="py-1">Status</th>
                                                <th class="py-1 text-right">Est. Cost</th>
                                                <th class="py-1 text-right">Est. Savings</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${lguRios.map(r => `
                                                <tr class="border-b border-gray-200">
                                                    <td class="py-1">${r.proposed_action}</td>
                                                    <td class="py-1"><span class="text-xs px-2 py-0.5 rounded ${r.priority==='High'?'bg-red-100':(r.priority==='Medium'?'bg-yellow-100':'bg-blue-100')}">${r.priority}</span></td>
                                                    <td class="py-1 text-xs">${r.status}</td>
                                                    <td class="py-1 text-right">₱${(r.estimated_cost_php||0).toLocaleString()}</td>
                                                    <td class="py-1 text-right">₱${(r.estimated_savings_php||0).toLocaleString()}</td>
                                                </tr>
                                            `).join('') || '<tr><td colspan="5" class="italic text-gray-500 py-1">No recommendations recorded.</td></tr>'}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h4 class="font-bold text-sm mb-2">5.2 Projects List</h4>
                                    <table class="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr class="border-b border-gray-400">
                                                <th class="py-1">Project Name</th>
                                                <th class="py-1">Status</th>
                                                <th class="py-1 text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${lguPpas.map(p => `
                                                <tr class="border-b border-gray-200">
                                                    <td class="py-1">${p.project_name}</td>
                                                    <td class="py-1 text-xs">${p.status}</td>
                                                    <td class="py-1 text-right">₱${(p.actual_cost_php || p.estimated_cost_php || 0).toLocaleString()}</td>
                                                </tr>
                                            `).join('') || '<tr><td colspan="3" class="italic text-gray-500 py-1">No projects recorded.</td></tr>'}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Sign Off -->
                            <div class="mt-16 pt-8 border-t border-gray-800 break-inside-avoid">
                                <div class="grid grid-cols-2 gap-16">
                                    <div class="text-center">
                                        <div class="border-b border-black mb-2 h-8"></div>
                                        <p class="font-bold text-sm">Prepared By</p>
                                        <p class="text-xs text-gray-500">EEC Officer</p>
                                    </div>
                                    <div class="text-center">
                                        <div class="border-b border-black mb-2 h-8"></div>
                                        <p class="font-bold text-sm">Approved By</p>
                                        <p class="text-xs text-gray-500">Local Chief Executive</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    // Initialize Charts
                    initCharts();

                } catch (error) {
                    console.error("Error generating report:", error);
                    container.innerHTML = '<p class="text-red-500 text-center">Error loading report data.</p>';
                }
            }