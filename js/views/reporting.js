import { getCurrentLguId } from './state.js';

export async function renderReporting() {
                const container = document.getElementById('report-container');
                const printBtn = document.getElementById('btn-print-report');
                
                if (printBtn) {
                    printBtn.addEventListener('click', () => window.print());
                }
        const currentLguId = getCurrentLguId();
        const startDateInput = document.getElementById('report-start-date');
        const endDateInput = document.getElementById('report-end-date');
        const generateBtn = document.getElementById('btn-generate-report');
        
        let filterStartDate = null;
        let filterEndDate = null;

        const loadReportData = async () => {
            if (!currentLguId) {
                container.innerHTML = '<p class="text-red-500 text-center">Please select an LGU first.</p>';
                return;
            }

            container.innerHTML = '<div class="text-center py-10 text-gray-500">Loading report data...</div>';

            try {
                // Fetch Data
                    const [lgu, buildings, vehicles, rios, ppas, allMecr, allTrips, allSeu] = await Promise.all([
                window.getLguById(currentLguId),
                window.getFsbdList(),
                window.getVehicleList(),
                window.getRioList(),
                window.getPpaList(),
                window.getMecrReports(),
                window.getTripTickets(),
                window.getSeuList()
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

                    let mecr = allMecr.filter(r => bldgIds.has(r.fsbdId));
                    let rawTripTickets = allTrips.filter(r => vehIds.has(r.vehicleId));

                    // Apply Date Filters
                    if (filterStartDate || filterEndDate) {
                        const start = filterStartDate ? new Date(filterStartDate) : new Date('2000-01-01');
                        const end = filterEndDate ? new Date(filterEndDate) : new Date('2100-01-01');
                        
                        mecr = mecr.filter(r => {
                            // MECR uses reporting_year and reporting_month
                            // Assume month is 1-indexed for the Date constructor (0-11 in JS Date, so we use month - 1 if creating a full date, 
                            // but simply comparing the start of the month here is safer)
                            const rDate = new Date(r.reporting_year, r.reporting_month - 1, 1);
                            // To ensure we capture the whole month if it's within the range:
                            const rDateEnd = new Date(r.reporting_year, r.reporting_month, 0); // Last day of month
                            return rDateEnd >= start && rDate <= end;
                        });

                        rawTripTickets = rawTripTickets.filter(t => {
                            const tDate = new Date(t.date);
                            return tDate >= start && tDate <= end;
                        });
                    }

                    const mfcrMap = {};
                    rawTripTickets.forEach(t => {
                        const [yyyy, mm] = t.date.split('-');
                        const year = Number(yyyy);
                        const month = Number(mm);
                        const key = `${t.vehicleId}_${year}_${month}`;
                        if (!mfcrMap[key]) {
                            mfcrMap[key] = {
                                vehicleId: t.vehicleId,
                                reporting_year: year,
                                reporting_month: month,
                                fuel_consumed_liters: 0,
                                cost_php: 0
                            };
                        }
                        mfcrMap[key].fuel_consumed_liters += Number(t.fuelLiters) || 0;
                        mfcrMap[key].cost_php += Number(t.fuelCost) || 0;
                    });
                    const mfcr = Object.values(mfcrMap);
                    const lguSeus = allSeu.filter(s => bldgIds.has(s.fsbdId) || vehIds.has(s.vehicleId));

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
                    const todayStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
                    let periodCoveredStr = 'All Time';
                    if (filterStartDate && filterEndDate) {
                        periodCoveredStr = `${new Date(filterStartDate).toLocaleDateString('en-PH')} to ${new Date(filterEndDate).toLocaleDateString('en-PH')}`;
                    } else if (filterStartDate) {
                        periodCoveredStr = `From ${new Date(filterStartDate).toLocaleDateString('en-PH')}`;
                    } else if (filterEndDate) {
                        periodCoveredStr = `Until ${new Date(filterEndDate).toLocaleDateString('en-PH')}`;
                    }

                    // --- CHART DATA PREPARATION ---
                    const chartColors = [
                        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
                        '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
                        '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
                    ];

                    const aggregateForCharts = (items, getConsumption, getName, isPie = false) => {
                        let total = 0;
                        const itemConsumptions = items.map(item => {
                            const cons = getConsumption(item);
                            total += cons;
                            return { item, cons, name: getName(item) };
                        });

                        // Sort descending
                        itemConsumptions.sort((a, b) => b.cons - a.cons);

                        const threshold = total * 0.05; // 5%
                        const majorItems = [];
                        let otherCons = 0;
                        const otherItemsList = [];

                        itemConsumptions.forEach(ic => {
                            if (ic.cons >= threshold || majorItems.length < 5) {
                                // Keep at least top 5 if possible, or if it meets 5% threshold
                                majorItems.push(ic);
                            } else {
                                otherCons += ic.cons;
                                otherItemsList.push(ic.item);
                            }
                        });

                        const labels = majorItems.map(ic => ic.name);
                        const data = majorItems.map(ic => ic.cons);
                        let finalItems = majorItems.map(ic => ic.item);

                        if (otherCons > 0) {
                            labels.push('Others');
                            data.push(otherCons);
                            finalItems.push({ isOthers: true, groupedItems: otherItemsList });
                        }

                        return { labels, data, finalItems };
                    };

                    // 1. Shares (Pie Charts)
                    const elecShareRaw = aggregateForCharts(
                        lguBuildings, 
                        b => mecr.filter(r => r.fsbdId === b.id).reduce((sum, r) => sum + (Number(r.electricity_consumption_kwh)||0), 0),
                        b => b.name,
                        true
                    );
                    const elecShareLabels = elecShareRaw.labels;
                    const elecShareData = elecShareRaw.data;
                    const topBuildings = elecShareRaw.finalItems;

                    const fuelShareRaw = aggregateForCharts(
                        lguVehicles,
                        v => mfcr.filter(r => r.vehicleId === v.id).reduce((sum, r) => sum + (Number(r.fuel_consumed_liters)||0), 0),
                        v => v.plate_number,
                        true
                    );
                    const fuelShareLabels = fuelShareRaw.labels;
                    const fuelShareData = fuelShareRaw.data;
                    const topVehicles = fuelShareRaw.finalItems;

                    // 2. Trends (Stacked Bar)
                    const getPeriod = (r) => `${r.reporting_year}-${String(r.reporting_month).padStart(2, '0')}`;
                    
                    // Electricity Trends
                    const elecPeriods = [...new Set(mecr.map(getPeriod))].sort();
                    const elecTrendDatasets = topBuildings.map((b, i) => {
                        return {
                            label: b.isOthers ? 'Others' : b.name,
                            data: elecPeriods.map(p => {
                                if (b.isOthers) {
                                    return b.groupedItems.reduce((sum, groupedAsset) => {
                                        const match = mecr.find(r => r.fsbdId === groupedAsset.id && getPeriod(r) === p);
                                        return sum + (match ? (Number(match.electricity_consumption_kwh)||0) : 0);
                                    }, 0);
                                } else {
                                    const match = mecr.find(r => r.fsbdId === b.id && getPeriod(r) === p);
                                    return match ? (Number(match.electricity_consumption_kwh)||0) : 0;
                                }
                            }),
                            backgroundColor: chartColors[i % chartColors.length]
                        };
                    });

                    // Fuel Trends
                    const fuelPeriods = [...new Set(mfcr.map(getPeriod))].sort();
                    const fuelTrendDatasets = topVehicles.map((v, i) => {
                        return {
                            label: v.isOthers ? 'Others' : v.plate_number,
                            data: fuelPeriods.map(p => {
                                if (v.isOthers) {
                                    return v.groupedItems.reduce((sum, groupedAsset) => {
                                        const match = mfcr.find(r => r.vehicleId === groupedAsset.id && getPeriod(r) === p);
                                        return sum + (match ? (Number(match.fuel_consumed_liters)||0) : 0);
                                    }, 0);
                                } else {
                                    const match = mfcr.find(r => r.vehicleId === v.id && getPeriod(r) === p);
                                    return match ? (Number(match.fuel_consumed_liters)||0) : 0;
                                }
                            }),
                            backgroundColor: chartColors[i % chartColors.length]
                        };
                    });

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
                        const pieOptions = { ...commonOptions, plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } } };
                        const barOptions = { ...commonOptions, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10, font: { size: 10 } } } }, scales: { x: { stacked: true }, y: { stacked: true } } };
                        
                        new Chart(document.getElementById('chart-elec-share'), { type: 'pie', data: { labels: elecShareLabels, datasets: [{ data: elecShareData, backgroundColor: chartColors }] }, options: pieOptions });
                        new Chart(document.getElementById('chart-fuel-share'), { type: 'pie', data: { labels: fuelShareLabels, datasets: [{ data: fuelShareData, backgroundColor: chartColors }] }, options: pieOptions });
                        
                        new Chart(document.getElementById('chart-elec-trend'), { type: 'bar', data: { labels: elecPeriods, datasets: elecTrendDatasets }, options: barOptions });
                        new Chart(document.getElementById('chart-fuel-trend'), { type: 'bar', data: { labels: fuelPeriods, datasets: fuelTrendDatasets }, options: barOptions });

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

                                <div class="mt-auto mb-20 text-center">
                                    <p class="text-sm text-gray-500 uppercase tracking-widest mb-1">Period Covered</p>
                                    <p class="text-xl font-bold mb-6">${periodCoveredStr}</p>
                                    
                                    <p class="text-xs text-gray-400">Generated on</p>
                                    <p class="text-md text-gray-600">${todayStr}</p>
                                </div>
                            </div>

                            <!-- Executive Summary -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <h3 class="text-2xl font-bold uppercase border-b-2 border-gray-800 mb-2 pb-2">1. Executive Summary</h3>
                                <p class="text-md text-gray-600 mb-8 italic">This section provides a high-level overview of the total energy consumption recorded for the specified period.</p>
                                
                                <div class="grid grid-cols-2 gap-6 text-md mb-8">
                                    <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                        <p class="text-sm text-gray-500 uppercase tracking-wider mb-2">LGU Profile</p>
                                        <p class="mb-1"><span class="font-bold text-gray-800">Region:</span> ${lgu.region || '-'}</p>
                                        <p><span class="font-bold text-gray-800">Province:</span> ${lgu.province || '-'}</p>
                                    </div>
                                    <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                        <p class="text-sm text-gray-500 uppercase tracking-wider mb-2">Contact Info</p>
                                        <p class="mb-1"><span class="font-bold text-gray-800">Head of LGU:</span> ${lgu.head_of_lgu || '-'}</p>
                                        <p><span class="font-bold text-gray-800">Email:</span> ${lgu.email || '-'}</p>
                                    </div>
                                </div>
                                <div class="grid grid-cols-2 gap-6">
                                    <div class="bg-indigo-50 p-8 rounded-lg border border-indigo-100 flex flex-col justify-center items-center text-center">
                                        <p class="text-sm text-indigo-800 uppercase tracking-wider mb-2 font-bold">Total Electricity Recorded</p>
                                        <p class="text-4xl font-extrabold text-indigo-600">${totalElectricity.toLocaleString()}</p>
                                        <p class="text-md text-indigo-500 mt-1">kWh</p>
                                    </div>
                                    <div class="bg-teal-50 p-8 rounded-lg border border-teal-100 flex flex-col justify-center items-center text-center">
                                        <p class="text-sm text-teal-800 uppercase tracking-wider mb-2 font-bold">Total Fuel Recorded</p>
                                        <p class="text-4xl font-extrabold text-teal-600">${totalFuel.toLocaleString()}</p>
                                        <p class="text-md text-teal-500 mt-1">Liters</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Asset Inventory -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <h3 class="text-2xl font-bold uppercase border-b-2 border-gray-800 mb-2 pb-2">2. Asset Inventory</h3>
                                <p class="text-md text-gray-600 mb-8 italic">A summary of the registered government-owned buildings and vehicle fleet covered by this report.</p>
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
                                            ${lguVehicles.slice(0, 5).map(v => {
                                                const vLabel = [v.make, v.model].filter(m => m && m.toLowerCase() !== 'make' && m.toLowerCase() !== 'model').join(' ');
                                                return `<li>${v.plate_number} <span class="text-xs text-gray-500">${vLabel ? `(${vLabel})` : ''}</span></li>`;
                                            }).join('')}
                                            ${lguVehicles.length > 5 ? `<li class="italic text-gray-500">...and ${lguVehicles.length - 5} more</li>` : ''}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Consumption Analysis - Charts -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <h3 class="text-2xl font-bold uppercase border-b-2 border-gray-800 mb-2 pb-2">3. Consumption Analysis</h3>
                                <p class="text-md text-gray-600 mb-8 italic">Detailed trends and distribution of electricity and fuel usage across all monitored assets.</p>
                                
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
                            </div>

                            <!-- Consumption Analysis - Electricity Detail -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <h4 class="font-bold text-xl text-indigo-800 mb-2 border-b pb-2">3.1 Detailed Electricity Reports</h4>
                                <p class="text-sm text-gray-600 mb-6 italic">Breakdown of electricity consumption (kWh) by building across the reporting period.</p>
                                ${lguBuildings.map(b => {
                                    const reports = mecrByBuilding[b.id] || [];
                                    if (reports.length === 0) return '';
                                    // Sort by date
                                    reports.sort((x, y) => (x.reporting_year - y.reporting_year) || (x.reporting_month - y.reporting_month));
                                    
                                    const totalKwh = reports.reduce((s,r) => s + r.electricity_consumption_kwh, 0);
                                    const avgKwh = totalKwh / reports.length;
                                    const maxKwh = Math.max(...reports.map(r => r.electricity_consumption_kwh));
                                    const minKwh = Math.min(...reports.map(r => r.electricity_consumption_kwh));

                                    // 3-Month Moving Average Forecast
                                    const recentKwh = reports.slice(-3);
                                    const forecastKwh = recentKwh.length > 0 ? (recentKwh.reduce((s,r) => s + r.electricity_consumption_kwh, 0) / recentKwh.length) : 0;

                                    return `
                                        <div class="mb-6 break-inside-avoid">
                                            <p class="font-bold text-sm mb-1">${b.name} <span class="font-normal text-gray-500">(${b.fsbd_type})</span></p>
                                            <div class="overflow-x-auto">
                                                <table class="w-full text-xs text-left border border-gray-200">
                                                    <thead class="bg-gray-50">
                                                        <tr>
                                                            <th class="p-1 border text-left min-w-[80px]">Metric</th>
                                                            ${reports.map(r => `<th class="p-1 border text-center whitespace-nowrap">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</th>`).join('')}
                                                            <th class="p-1 border text-center font-bold bg-gray-200">Total</th>
                                                            <th class="p-1 border text-center font-bold bg-gray-200">Avg/Mo</th>
                                                            <th class="p-1 border text-center font-bold bg-gray-200">High</th>
                                                            <th class="p-1 border text-center font-bold bg-gray-200">Low</th>
                                                            <th class="p-1 border text-center font-bold bg-blue-100 text-blue-800" title="3-Month Moving Average">Forecast ➔</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td class="p-1 border font-bold text-gray-700 bg-gray-50">Usage (kWh)</td>
                                                            ${reports.map(r => `<td class="p-1 border text-center">${r.electricity_consumption_kwh.toLocaleString()}</td>`).join('')}
                                                            <td class="p-1 border text-center font-bold bg-indigo-50 text-indigo-800">${totalKwh.toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-gray-700 bg-gray-50">${Math.round(avgKwh).toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-red-600 bg-red-50">${maxKwh.toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-green-600 bg-green-50">${minKwh.toLocaleString()}</td>
                                                            <td class="p-1 border text-center font-bold text-blue-700 bg-blue-50">${Math.round(forecastKwh).toLocaleString()}</td>
                                                        </tr>
                                                        <tr>
                                                            <td class="p-1 border font-bold text-gray-700 bg-gray-50">MoM Trend</td>
                                                            ${reports.map((r, i) => {
                                                                if (i === 0) return `<td class="p-1 border text-center text-gray-400">-</td>`;
                                                                const prev = reports[i-1].electricity_consumption_kwh;
                                                                const curr = r.electricity_consumption_kwh;
                                                                if (prev === 0) return `<td class="p-1 border text-center text-gray-400">-</td>`;
                                                                const pct = ((curr - prev) / prev) * 100;
                                                                const color = pct > 0 ? 'text-red-600' : (pct < 0 ? 'text-green-600' : 'text-gray-500');
                                                                const sign = pct > 0 ? '▲ +' : (pct < 0 ? '▼ ' : '');
                                                                return `<td class="p-1 border text-center font-bold ${color}">${sign}${pct.toFixed(1)}%</td>`;
                                                            }).join('')}
                                                            <td class="p-1 border bg-gray-100" colspan="5"></td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    `;
                                }).join('') || '<p class="text-md italic text-gray-500 bg-gray-50 p-4 rounded text-center border">No electricity reports available for this period.</p>'}
                            </div>

                            <!-- Consumption Analysis - Fuel Detail -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <h4 class="font-bold text-xl text-teal-800 mb-2 border-b pb-2">3.2 Detailed Fuel Reports</h4>
                                <p class="text-sm text-gray-600 mb-6 italic">Breakdown of fuel consumption (Liters) by vehicle across the reporting period.</p>
                                ${lguVehicles.map(v => {
                                    const reports = mfcrByVehicle[v.id] || [];
                                    if (reports.length === 0) return '';
                                    reports.sort((x, y) => (x.reporting_year - y.reporting_year) || (x.reporting_month - y.reporting_month));
                                    
                                    const totalLiters = reports.reduce((s,r) => s + r.fuel_consumed_liters, 0);
                                    const avgLiters = totalLiters / reports.length;
                                    const maxLiters = Math.max(...reports.map(r => r.fuel_consumed_liters));
                                    const minLiters = Math.min(...reports.map(r => r.fuel_consumed_liters));
                                    
                                    const totalCost = reports.reduce((s,r) => s + (r.cost_php || 0), 0);
                                    const avgCost = totalCost / reports.length;
                                    const maxCost = Math.max(...reports.map(r => (r.cost_php || 0)));
                                    const minCost = Math.min(...reports.map(r => (r.cost_php || 0)));

                                    // Forecasts
                                    const recentLiters = reports.slice(-3);
                                    const forecastLiters = recentLiters.length > 0 ? (recentLiters.reduce((s,r) => s + r.fuel_consumed_liters, 0) / recentLiters.length) : 0;
                                    const forecastCost = recentLiters.length > 0 ? (recentLiters.reduce((s,r) => s + (r.cost_php || 0), 0) / recentLiters.length) : 0;

                                    const vLabel = [v.make, v.model].filter(m => m && m.toLowerCase() !== 'make' && m.toLowerCase() !== 'model').join(' ');

                                    return `
                                        <div class="mb-6 break-inside-avoid">
                                            <p class="font-bold text-sm mb-1">${v.plate_number} <span class="font-normal text-gray-500">${vLabel ? `(${vLabel})` : ''}</span></p>
                                            <div class="overflow-x-auto">
                                                <table class="w-full text-xs text-left border border-gray-200">
                                                    <thead class="bg-gray-50">
                                                        <tr>
                                                            <th class="p-1 border text-left min-w-[80px]">Metric</th>
                                                            ${reports.map(r => `<th class="p-1 border text-center whitespace-nowrap">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</th>`).join('')}
                                                            <th class="p-1 border text-center font-bold bg-gray-200">Total</th>
                                                            <th class="p-1 border text-center font-bold bg-gray-200">Avg/Mo</th>
                                                            <th class="p-1 border text-center font-bold bg-gray-200">High</th>
                                                            <th class="p-1 border text-center font-bold bg-gray-200">Low</th>
                                                            <th class="p-1 border text-center font-bold bg-blue-100 text-blue-800" title="3-Month Moving Average">Forecast ➔</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td class="p-1 border font-bold text-gray-700 bg-gray-50">Volume (L)</td>
                                                            ${reports.map(r => `<td class="p-1 border text-center">${r.fuel_consumed_liters.toLocaleString()}</td>`).join('')}
                                                            <td class="p-1 border text-center font-bold bg-teal-50 text-teal-800">${totalLiters.toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-gray-700 bg-gray-50">${Math.round(avgLiters).toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-red-600 bg-red-50">${maxLiters.toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-green-600 bg-green-50">${minLiters.toLocaleString()}</td>
                                                            <td class="p-1 border text-center font-bold text-blue-700 bg-blue-50">${Math.round(forecastLiters).toLocaleString()}</td>
                                                        </tr>
                                                        <tr>
                                                            <td class="p-1 border font-bold text-gray-700 bg-gray-50">MoM Trend (Vol)</td>
                                                            ${reports.map((r, i) => {
                                                                if (i === 0) return `<td class="p-1 border text-center text-gray-400">-</td>`;
                                                                const prev = reports[i-1].fuel_consumed_liters;
                                                                const curr = r.fuel_consumed_liters;
                                                                if (prev === 0) return `<td class="p-1 border text-center text-gray-400">-</td>`;
                                                                const pct = ((curr - prev) / prev) * 100;
                                                                const color = pct > 0 ? 'text-red-600' : (pct < 0 ? 'text-green-600' : 'text-gray-500');
                                                                const sign = pct > 0 ? '▲ +' : (pct < 0 ? '▼ ' : '');
                                                                return `<td class="p-1 border text-center font-bold ${color}">${sign}${pct.toFixed(1)}%</td>`;
                                                            }).join('')}
                                                            <td class="p-1 border bg-gray-100" colspan="5"></td>
                                                        </tr>
                                                        <tr>
                                                            <td class="p-1 border font-bold text-gray-700 bg-gray-50">Cost (PHP)</td>
                                                            ${reports.map(r => `<td class="p-1 border text-center">₱${(r.cost_php || 0).toLocaleString()}</td>`).join('')}
                                                            <td class="p-1 border text-center font-bold bg-teal-50 text-teal-800">₱${Math.round(totalCost).toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-gray-700 bg-gray-50">₱${Math.round(avgCost).toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-red-600 bg-red-50">₱${Math.round(maxCost).toLocaleString()}</td>
                                                            <td class="p-1 border text-center text-green-600 bg-green-50">₱${Math.round(minCost).toLocaleString()}</td>
                                                            <td class="p-1 border text-center font-bold text-blue-700 bg-blue-50">₱${Math.round(forecastCost).toLocaleString()}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    `;
                                }).join('') || '<p class="text-md italic text-gray-500 bg-gray-50 p-4 rounded text-center border">No fuel reports available for this period.</p>'}
                            </div>

                            <!-- SEU Findings -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <h3 class="text-2xl font-bold uppercase border-b-2 border-gray-800 mb-2 pb-2">4. Significant Energy Use (SEU)</h3>
                                <p class="text-md text-gray-600 mb-8 italic">Identification of assets or equipment that account for a substantial portion of total energy consumption, prioritizing areas for efficiency improvements.</p>
                                
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

                            <!-- Recommendations & Projects - Charts -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <h3 class="text-2xl font-bold uppercase border-b-2 border-gray-800 mb-2 pb-2">5. Action Plan</h3>
                                <p class="text-md text-gray-600 mb-8 italic">Recommended Improvement Opportunities (RIOs) and Proposed Project Activities (PPAs) designed to address identified SEUs and achieve compliance targets.</p>
                                
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
                            </div>

                            <!-- Recommendations & Projects - Lists -->
                            <div class="mb-12 pt-8 break-after-page" style="page-break-after: always;">
                                <div class="mb-10">
                                    <h4 class="font-bold text-xl text-gray-800 mb-2 border-b pb-2">5.1 Recommendations (RIOs) List</h4>
                                    <p class="text-sm text-gray-600 mb-6 italic">Detailed list of identified efficiency opportunities and their projected impact.</p>
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
                                    <h4 class="font-bold text-xl text-gray-800 mb-2 border-b pb-2">5.2 Projects (PPAs) List</h4>
                                    <p class="text-sm text-gray-600 mb-6 italic">Tracking of ongoing and completed projects aimed at energy conservation.</p>
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
                            <div class="flex flex-col justify-center items-center h-[50vh] text-center">
                                <h3 class="text-2xl font-bold uppercase mb-16 tracking-wider">Approval & Sign-off</h3>
                                <div class="grid grid-cols-2 gap-24 w-full">
                                    <div class="text-center">
                                        <div class="border-b-2 border-gray-800 mb-4 h-12"></div>
                                        <p class="font-bold text-lg text-gray-900">Prepared By</p>
                                        <p class="text-sm text-gray-500 uppercase tracking-wider mt-1">EEC Officer</p>
                                    </div>
                                    <div class="text-center">
                                        <div class="border-b-2 border-gray-800 mb-4 h-12"></div>
                                        <p class="font-bold text-lg text-gray-900">Approved By</p>
                                        <p class="text-sm text-gray-500 uppercase tracking-wider mt-1">Local Chief Executive</p>
                                    </div>
                                </div>
                                <p class="mt-24 text-sm text-gray-400">End of Report</p>
                            </div>
                        </div>
                    `;

                    // Initialize Charts
                    initCharts();

                } catch (error) {
                    console.error("Error generating report:", error);
                    container.innerHTML = '<p class="text-red-500 text-center">Error loading report data.</p>';
                }
            }; // End loadReportData

            // Initial load
            await loadReportData();

            // Handle Filter Button
            if (generateBtn) {
                generateBtn.addEventListener('click', async () => {
                    filterStartDate = startDateInput.value;
                    filterEndDate = endDateInput.value;
                    await loadReportData();
                });
            }
        }