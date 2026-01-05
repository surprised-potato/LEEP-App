import { getCurrentLguId, checkPermission } from './state.js';
import { openAssetDetailsModal } from './ui.js';

export async function renderRioList() {
                const tableBody = document.getElementById('rio-table-body');
                if (!tableBody) return;

        let [rios, buildings, vehicles] = await Promise.all([window.getRioList(), window.getFsbdList(), window.getVehicleList()]);

        const canWrite = checkPermission('rios', 'write');
        const addBtn = document.getElementById('btn-add-rio');
        if (addBtn) {
            addBtn.classList.toggle('hidden', !canWrite);
        }
                
                // Filter Assets by LGU
        const currentLguId = getCurrentLguId();
                if (currentLguId) {
                    buildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
                    vehicles = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
                }

                const allowedBuildingIds = new Set(buildings.map(b => b.id));
                const allowedVehicleIds = new Set(vehicles.map(v => v.id));

                // Filter RIOs that belong to visible assets
                rios = rios.filter(r => allowedBuildingIds.has(r.fsbdId) || allowedVehicleIds.has(r.vehicleId));
                
                const assetMap = {};
                buildings.forEach(b => assetMap[b.id] = `Building: ${b.name}`);
                vehicles.forEach(v => assetMap[v.id] = `Vehicle: ${v.plate_number}`);

                if (rios.length > 0) {
                    tableBody.innerHTML = rios.map(rio => {
                        const cost = Number(rio.estimated_cost_php) || 0;
                        const savings = Number(rio.estimated_savings_php) || 0;
                        const roi = savings > 0 ? (cost / (savings * 12)).toFixed(2) : '-';

                        return `
                            <tr>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${rio.proposed_action}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${assetMap[rio.fsbdId || rio.vehicleId] || 'N/A'}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${rio.priority}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${rio.status}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm font-mono">${roi}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    ${canWrite ? `
                                        <a href="#/rios/edit/${rio.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                                    ` : '<span class="text-gray-400 italic text-xs">Read Only</span>'}
                                </td>
                            </tr>
                        `;
                    }).join('');
                } else {
                    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No recommendations found.</td></tr>';
                }
}

export async function initRioForm(docId = null) {
                // Ensure docId is a string (handle loadContent passing a number)
                if (typeof docId !== 'string') docId = null;

                const form = document.getElementById('rio-form');
                if (!form) return;

                const idField = document.getElementById('rio-id');
                const actionField = document.getElementById('proposed_action');
                const assetTypeField = document.getElementById('assetType');
                const assetIdField = document.getElementById('assetId');
                const priorityField = document.getElementById('priority');
                const statusField = document.getElementById('status');
                const costField = document.getElementById('estimated_cost_php');
                const savingsField = document.getElementById('estimated_savings_php');
                const roiYearsField = document.getElementById('roi_years');
                const notesField = document.getElementById('notes');
                const selectedSeusContainer = document.getElementById('selected-seus-container');

                // Helper to calculate ROI years
                const calculateROI = () => {
                    const cost = Number(costField.value) || 0;
                    const savings = Number(savingsField.value) || 0;
                    if (savings > 0) {
                        roiYearsField.value = (cost / (savings * 12)).toFixed(2);
                    } else {
                        roiYearsField.value = '-';
                    }
                };

                // Fetch SEUs for dropdown
        const allSeus = await window.getSeuList();
                let selectedSeuIds = new Set();

                // Helper to render selected SEUs in the form
                const renderSelectedSeus = () => {
                    selectedSeusContainer.innerHTML = '';
                    if (selectedSeuIds.size === 0) {
                        selectedSeusContainer.innerHTML = '<p class="text-gray-400 text-xs italic p-1">Select SEUs from the Reference Data panel.</p>';
                        return;
                    }
                    selectedSeuIds.forEach(id => {
                        const seu = allSeus.find(s => s.id === id);
                        if (!seu) return;
                        const div = document.createElement('div');
                        div.className = 'flex justify-between items-center bg-white border p-2 rounded shadow-sm mb-2';
                        div.innerHTML = `<div class="text-sm">
                            <div class="font-bold text-xs text-gray-500">${seu.energy_use_category}</div>
                            ${seu.finding_description}
                        </div>
                        <button type="button" class="text-red-500 hover:text-red-700 text-xs font-bold btn-remove-seu px-2" data-id="${id}">&times;</button>`;
                        selectedSeusContainer.appendChild(div);
                    });
                    
                    selectedSeusContainer.querySelectorAll('.btn-remove-seu').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            selectedSeuIds.delete(e.target.dataset.id);
                            renderSelectedSeus();
                            updateContext(); // Refresh context to show "Add" button again
                        });
                    });
                };

                // Placeholder for context updater, defined after refContainer creation
                let updateContext = () => {};

                assetIdField.addEventListener('change', () => updateContext());

                costField.addEventListener('input', calculateROI);
                savingsField.addEventListener('input', calculateROI);

                assetTypeField.addEventListener('change', async () => {
                    const type = assetTypeField.value;
                    assetIdField.innerHTML = '<option value="">Loading...</option>';
                    assetIdField.disabled = true;
                    const currentLguId = getCurrentLguId();
                    if (type === 'building') {
                const buildings = await window.getFsbdList();
                        const filtered = currentLguId ? buildings.filter(b => b.lguId === currentLguId || !b.lguId) : buildings;
                        assetIdField.innerHTML = filtered.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
                        assetIdField.disabled = false;
                        if (filtered.length > 0) assetIdField.value = filtered[0].id;
                    } else if (type === 'vehicle') {
                const vehicles = await window.getVehicleList();
                        const filtered = currentLguId ? vehicles.filter(v => v.lguId === currentLguId || !v.lguId) : vehicles;
                        assetIdField.innerHTML = filtered.map(v => `<option value="${v.id}">${v.plate_number}</option>`).join('');
                        assetIdField.disabled = false;
                        if (filtered.length > 0) assetIdField.value = filtered[0].id;
                    } else {
                        assetIdField.innerHTML = '<option>Please select an asset type first</option>';
                    }
                    updateContext();
                });

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = {
                        proposed_action: actionField.value,
                        priority: priorityField.value,
                        status: statusField.value,
                        estimated_cost_php: Number(costField.value) || null,
                        estimated_savings_php: Number(savingsField.value) || null,
                        fsbdId: assetTypeField.value === 'building' ? assetIdField.value : null,
                        vehicleId: assetTypeField.value === 'vehicle' ? assetIdField.value : null,
                        seuFindingIds: Array.from(selectedSeuIds),
                        notes: notesField.value
                    };

                    const id = idField.value;
                    let success = false;
                    if (id) {
                success = await window.updateRio(id, formData);
                    } else {
                success = await window.createRio(formData);
                    }

                    if (success) {
                        location.hash = '#/rios';
                    } else {
                        alert('Error saving recommendation.');
                    }
                });

                // Inject Asset Summary to help identify RIOs
                // Create a grid layout: Form on left, Reference Data on right
                const formCard = form.closest('.bg-white') || form.parentElement;
                
                // Ensure form card fills the grid cell and matches height
                formCard.classList.remove('max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'mx-auto');
                formCard.classList.add('w-full', 'h-full');
                
                // Also remove constraints from the parent container if it exists (e.g. the view wrapper)
                if (formCard.parentElement && formCard.parentElement.id !== 'app-content') {
                    formCard.parentElement.classList.remove('max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'mx-auto');
                    formCard.parentElement.classList.add('w-full');
                }

                // Create grid wrapper
                const gridWrapper = document.createElement('div');
                gridWrapper.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 w-full';
                
                // Insert wrapper before formCard
                if (formCard.parentNode) {
                    formCard.parentNode.insertBefore(gridWrapper, formCard);
                    gridWrapper.appendChild(formCard);
                    
                    // Create Reference Data Container
                    const refContainer = document.createElement('div');
                    gridWrapper.appendChild(refContainer);
                    
                    // Define updateContext now that refContainer exists
                    updateContext = () => {
                        renderRioContext(refContainer, assetIdField.value, assetTypeField.value, (seuId) => {
                            if (!selectedSeuIds.has(seuId)) {
                                selectedSeuIds.add(seuId);
                                renderSelectedSeus();
                                updateContext();
                            }
                        }, selectedSeuIds);
                    };

                    // Handle Data Loading (Edit Mode vs Create Mode)
                    if (docId) {
                        // EDIT MODE
                const data = await window.getRioById(docId);
                        if (data) {
                            idField.value = data.id;
                            actionField.value = data.proposed_action || '';
                            priorityField.value = data.priority || 'Medium';
                            statusField.value = data.status || 'Identified';
                            costField.value = data.estimated_cost_php || '';
                            savingsField.value = data.estimated_savings_php || '';
                            notesField.value = data.notes || '';
                            
                            const assetType = data.fsbdId ? 'building' : 'vehicle';
                            assetTypeField.value = assetType;
                            
                            // Manually populate assets to ensure await finishes before setting value
                            assetIdField.innerHTML = '<option value="">Loading...</option>';
                            assetIdField.disabled = true;
                            
                            let assets = [];
                            if (assetType === 'building') {
                        assets = await window.getFsbdList();
                            } else {
                        assets = await window.getVehicleList();
                            }
                            
                    const currentLguId = getCurrentLguId();
                    if (currentLguId) {
                                assets = assets.filter(a => a.lguId === currentLguId || !a.lguId);
                            }
                            
                            assetIdField.innerHTML = assets.map(a => `<option value="${a.id}">${a.name || a.plate_number}</option>`).join('');
                            assetIdField.disabled = false;
                            assetIdField.value = data.fsbdId || data.vehicleId || '';

                            if (data.seuFindingIds) {
                                data.seuFindingIds.forEach(id => selectedSeuIds.add(id));
                                renderSelectedSeus();
                            }

                            calculateROI();
                        }
                    }
                    
                    // Initial Render of Context
                    updateContext();
                }
}

export async function renderRioContext(container, assetId = null, assetType = null, onAddSeu = null, selectedSeuIds = new Set()) {
    container.innerHTML = '<div class="bg-white shadow rounded-lg p-6"><div class="text-center py-4 text-gray-500">Loading context data...</div></div>';
    
    try {
        if (!window.db) return;

        const [buildings, vehicles, madeList, mecrSnap, mfcrSnap, seuList] = await Promise.all([
            window.getFsbdList(),
            window.getVehicleList(),
            window.getMadeList(),
            window.db.collection('mecr_reports').get(),
            window.db.collection('mfcr_reports').get(),
            window.getSeuList()
        ]);

        // Filter by LGU
        let filteredBuildings = buildings;
        let filteredVehicles = vehicles;
        
        const currentLguId = getCurrentLguId();
        if (currentLguId) {
            filteredBuildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
            filteredVehicles = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
        }

        const bldgIds = new Set(filteredBuildings.map(b => b.id));
        const vehIds = new Set(filteredVehicles.map(v => v.id));

        const filteredMade = madeList.filter(m => bldgIds.has(m.fsbdId));
        
        const mecr = mecrSnap.docs.map(d => d.data()).filter(r => bldgIds.has(r.fsbdId));
        const mfcr = mfcrSnap.docs.map(d => d.data()).filter(r => vehIds.has(r.vehicleId));

        // Helper to calculate stats
        const calcStats = (reports, key) => {
            if (!reports.length) return { avg: 0, mom: 0, yoy: 0, peak: 0 };
            
            // Sort by date
            const sorted = [...reports].sort((a, b) => (a.reporting_year - b.reporting_year) || (a.reporting_month - b.reporting_month));
            const vals = sorted.map(r => Number(r[key]) || 0);
            
            // Avg & Peak
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            const peak = Math.max(...vals);
            
            // MoM (Month-over-Month)
            let momSum = 0, momCnt = 0;
            for (let i = 1; i < vals.length; i++) {
                if (vals[i-1] > 0) { momSum += (vals[i] - vals[i-1]) / vals[i-1]; momCnt++; }
            }
            
            // YoY (Year-over-Year)
            const byYear = {};
            sorted.forEach(r => byYear[r.reporting_year] = (byYear[r.reporting_year] || 0) + (Number(r[key]) || 0));
            const years = Object.keys(byYear).sort();
            let yoySum = 0, yoyCnt = 0;
            for (let i = 1; i < years.length; i++) {
                const prev = byYear[years[i-1]];
                const curr = byYear[years[i]];
                if (prev > 0) { yoySum += (curr - prev) / prev; yoyCnt++; }
            }
            
            return { avg, peak, mom: momCnt ? (momSum / momCnt) * 100 : 0, yoy: yoyCnt ? (yoySum / yoyCnt) * 100 : 0 };
        };

        const bldgStats = filteredBuildings.map(b => {
            const stats = calcStats(mecr.filter(r => r.fsbdId === b.id), 'electricity_consumption_kwh');
            return { id: b.id, name: b.name, ...stats };
        }).sort((a, b) => b.avg - a.avg).slice(0, 3);

        const vehStats = filteredVehicles.map(v => {
            const stats = calcStats(mfcr.filter(r => r.vehicleId === v.id), 'fuel_consumed_liters');
            return { id: v.id, plate: v.plate_number, ...stats };
        }).sort((a, b) => b.avg - a.avg).slice(0, 3);

        const renderTable = (items, nameKey, unit, type) => `
            <div class="overflow-x-auto">
                <table class="min-w-full text-xs">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            <th class="py-2 text-left text-gray-600">Asset</th>
                            <th class="py-2 text-right text-gray-600">Avg (${unit})</th>
                            <th class="py-2 text-right text-gray-600">Peak</th>
                            <th class="py-2 text-right text-gray-600">MoM%</th>
                            <th class="py-2 text-right text-gray-600">YoY%</th>
                            <th class="py-2 text-center text-gray-600">View Details</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${items.map(i => `<tr><td class="py-2 font-medium text-gray-800">${i[nameKey]}</td><td class="py-2 text-right text-gray-600">${i.avg.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td class="py-2 text-right text-gray-600">${i.peak.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td class="py-2 text-right ${i.mom>0?'text-red-500':'text-green-500'}">${i.mom.toFixed(1)}%</td><td class="py-2 text-right ${i.yoy>0?'text-red-500':'text-green-500'}">${i.yoy.toFixed(1)}%</td><td class="py-2 text-center"><button class="text-blue-600 hover:text-blue-800 btn-details" data-id="${i.id}" data-type="${type}" title="View Details"><svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></button></td></tr>`).join('') || '<tr><td colspan="6" class="py-2 text-center text-gray-500">No data</td></tr>'}
                    </tbody>
                </table>
            </div>`;

        // Render as a single card for the column
        container.className = 'bg-white shadow rounded-lg p-6 border-t-4 border-blue-500 h-full flex flex-col gap-6';
        
        let html = `
            <h3 class="text-lg font-bold text-gray-800 mb-4">Reference Data</h3>
            <div class="space-y-6">`;

        if (filteredBuildings.length > 0) {
            html += `<div>
                <h4 class="font-semibold text-gray-700 mb-2">Top Energy Consuming Buildings</h4>
                ${renderTable(bldgStats, 'name', 'kWh', 'building')}
            </div>`;
        }

        if (filteredVehicles.length > 0) {
            html += `<div>
                <h4 class="font-semibold text-gray-700 mb-2">Top Fuel Consuming Vehicles</h4>
                ${renderTable(vehStats, 'plate', 'L', 'vehicle')}
            </div>`;
        }

        if (filteredMade.length > 0) {
            html += `<div class="pt-4 border-t border-gray-200">
                <h4 class="font-semibold text-gray-700 mb-2">Equipment Categories</h4>
                <div class="flex flex-wrap gap-2">
                    ${[...new Set(filteredMade.map(m => m.energy_use_category))].map(c => `<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">${c}</span>`).join('') || '<span class="text-sm text-gray-500">No equipment recorded</span>'}
                </div>
            </div>`;
        }

        // SEU Section
        html += `<div class="pt-4 border-t border-gray-200 flex-1 flex flex-col min-h-0">
            <h4 class="font-semibold text-gray-700 mb-2">Identified SEUs</h4>
            <div class="space-y-2 overflow-y-auto pr-1 max-h-60">`;

        if (assetId) {
            const assetSeus = seuList.filter(s => (assetType === 'building' && s.fsbdId === assetId) || (assetType === 'vehicle' && s.vehicleId === assetId));
            
            if (assetSeus.length > 0) {
                html += assetSeus.map(s => {
                    const isSelected = selectedSeuIds.has(s.id);
                    return `
                    <div class="border rounded p-3 bg-gray-50 flex justify-between items-start">
                        <div>
                            <span class="text-xs font-bold text-indigo-600 block">${s.energy_use_category}</span>
                            <p class="text-sm text-gray-800">${s.finding_description}</p>
                            <p class="text-xs text-gray-500 mt-1">Method: ${s.identification_method}</p>
                        </div>
                        ${isSelected 
                            ? '<span class="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Added</span>'
                            : `<button type="button" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded btn-add-ref-seu" data-id="${s.id}">Add</button>`
                        }
                    </div>
                    `;
                }).join('');
            } else {
                html += '<p class="text-sm text-gray-500 italic">No SEUs identified for this asset.</p>';
            }
        } else {
            html += '<p class="text-sm text-gray-500 italic">Select an asset to view SEUs.</p>';
        }

        html += `</div>
            <div class="mt-2">
                <p class="text-xs text-gray-500">Tip: Go to "SEU Identification" to add more findings.</p>
            </div>
        </div>`;
        container.innerHTML = html;

        // Add event listeners for details buttons
        container.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                
                if (type === 'building') {
                    const asset = filteredBuildings.find(b => b.id === id);
                    const reports = mecr.filter(r => r.fsbdId === id);
                    const assetMade = filteredMade.filter(m => m.fsbdId === id);
                    openAssetDetailsModal(asset.name, reports, 'electricity_consumption_kwh', 'kWh', assetMade);
                } else {
                    const asset = filteredVehicles.find(v => v.id === id);
                    const reports = mfcr.filter(r => r.vehicleId === id);
                    openAssetDetailsModal(asset.plate_number, reports, 'fuel_consumed_liters', 'L');
                }
            });
        });

        // Add event listeners for SEU buttons
        container.querySelectorAll('.btn-add-ref-seu').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (onAddSeu) onAddSeu(e.target.dataset.id);
            });
        });
    } catch (error) {
        console.error("Error rendering RIO context:", error);
        container.innerHTML = '<div class="text-red-500">Failed to load context data.</div>';
    }
}