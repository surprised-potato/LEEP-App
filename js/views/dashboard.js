import { getCurrentLguId, getCurrentLoadId } from './state.js';

export async function renderDashboard(loadId) {
                if (!window.db) {
                    console.error("Firestore is not initialized.");
                    return;
                }

                try {
            let [buildings, vehicles, rios, ppas, mecrResults, mfcrResults] = await Promise.all([
                window.getFsbdList(),
                window.getVehicleList(),
                window.getRioList(),
                window.getPpaList(),
                window.db.collection('mecr_reports').get().catch(e => { console.error(e); return { docs: [] }; }),
                window.db.collection('mfcr_reports').get().catch(e => { console.error(e); return { docs: [] }; }),
                    ]);
                    
                    // Check if this render is still valid for the current view
        if (loadId && loadId !== getCurrentLoadId()) return;

                    let mecrReports = mecrResults.docs.map(doc => doc.data());
                    let mfcrReports = mfcrResults.docs.map(doc => doc.data());

                    // Filter Data by LGU
            const currentLguId = getCurrentLguId();
                    if (currentLguId) {
                        buildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
                        vehicles = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
                        
                        const allowedBldgIds = new Set(buildings.map(b => b.id));
                        const allowedVehicleIds = new Set(vehicles.map(v => v.id));

                        rios = rios.filter(r => allowedBldgIds.has(r.fsbdId) || allowedVehicleIds.has(r.vehicleId));
                        
                        mecrReports = mecrReports.filter(r => allowedBldgIds.has(r.fsbdId));
                        mfcrReports = mfcrReports.filter(r => allowedVehicleIds.has(r.vehicleId));

                        // Filter PPAs based on filtered RIOs
                        const allowedRioIds = new Set(rios.map(r => r.id));
                        ppas = ppas.filter(ppa => ppa.relatedRioIds && ppa.relatedRioIds.some(id => allowedRioIds.has(id)));
                    }

                    // Calculate additional KPIs
                    const totalElectricity = mecrReports.reduce((sum, r) => sum + (Number(r.electricity_consumption_kwh) || 0), 0);
                    const totalFuel = mfcrReports.reduce((sum, r) => sum + (Number(r.fuel_consumed_liters) || 0), 0);
                    const totalSavings = rios.reduce((sum, r) => sum + (Number(r.estimated_savings_php) || 0), 0);
                    const totalInvestment = ppas.reduce((sum, p) => sum + (Number(p.actual_cost_php) || Number(p.estimated_cost_php) || 0), 0);

                    // Render Stats Helper
                    const setSafeText = (id, text) => {
                        const el = document.getElementById(id);
                        if (el) el.textContent = text;
                    };

                    setSafeText('stats-total-buildings', buildings.length);
                    setSafeText('stats-total-vehicles', vehicles.length);
                    setSafeText('stats-high-rios', rios.filter(r => r.priority === 'High').length);
                    setSafeText('stats-ongoing-ppas', ppas.filter(p => p.status === 'Ongoing').length);

                    // Render New KPIs
                    setSafeText('stats-total-electricity', totalElectricity.toLocaleString());
                    setSafeText('stats-total-fuel', totalFuel.toLocaleString());
                    setSafeText('stats-total-savings', '₱' + totalSavings.toLocaleString());
                    setSafeText('stats-total-investment', '₱' + totalInvestment.toLocaleString());
                    
                    // Render Recent Consumption Table
                    const buildingMap = buildings.reduce((acc, b) => ({...acc, [b.id]: b.name}), {});
                    const vehicleMap = vehicles.reduce((acc, v) => ({...acc, [v.id]: v.plate_number}), {});

                    const allReports = [
                        ...mecrReports.map(r => ({
                            date: `${r.reporting_year}-${String(r.reporting_month).padStart(2, '0')}`,
                            year: r.reporting_year,
                            month: r.reporting_month,
                            type: 'Electricity',
                            asset: buildingMap[r.fsbdId] || 'Unknown Building',
                            amount: `${Number(r.electricity_consumption_kwh).toLocaleString()} kWh`,
                            colorClass: 'text-indigo-900 bg-indigo-200'
                        })),
                        ...mfcrReports.map(r => ({
                            date: `${r.reporting_year}-${String(r.reporting_month).padStart(2, '0')}`,
                            year: r.reporting_year,
                            month: r.reporting_month,
                            type: 'Fuel',
                            asset: vehicleMap[r.vehicleId] || 'Unknown Vehicle',
                            amount: `${Number(r.fuel_consumed_liters).toLocaleString()} L`,
                            colorClass: 'text-teal-900 bg-teal-200'
                        }))
                    ];

                    // Sort by date descending
                    allReports.sort((a, b) => (b.year - a.year) || (b.month - a.month));

                    const recentActivity = allReports.slice(0, 5);
                    const tableBody = document.getElementById('dashboard-recent-consumption-body');
                    
                    if (tableBody) {
                        tableBody.innerHTML = recentActivity.length > 0 ? recentActivity.map(r => `
                            <tr>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.date}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.asset}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span class="relative inline-block px-3 py-1 font-semibold ${r.colorClass.split(' ')[0]} leading-tight">
                                        <span aria-hidden class="absolute inset-0 ${r.colorClass.split(' ')[1]} opacity-50 rounded-full"></span>
                                        <span class="relative">${r.type}</span>
                                    </span>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.amount}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">No recent reports found.</td></tr>';
                    }

                } catch (error) {
                    console.error("Error rendering dashboard:", error);
                }
}