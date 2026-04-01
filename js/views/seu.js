import { getCurrentOrganizationId, checkPermission } from './state.js';
import { openFormModal } from './ui.js';

export async function renderSeuPage() {
                const seuTableBody = document.getElementById('seu-table-body');
                const equipTableBody = document.getElementById('analysis-equipment-body');
                const vehicleTableBody = document.getElementById('analysis-vehicle-body');
        const currentOrganizationId = getCurrentOrganizationId();
                if (!currentOrganizationId) {
                    seuTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Please select an Organization first.</td></tr>';
                    return;
                }

                const canWrite = checkPermission('seu', 'write');
                const createBtn = document.getElementById('btn-create-seu');
                if (createBtn) {
                    createBtn.classList.toggle('hidden', !canWrite);
                }

                try {
                    const [organizationSeus, buildings, vehicles, madeList, mfcrSnap, mecrSnap, ttSnap] = await Promise.all([
                window.getSeuList(),
                window.getFsbdList(),
                window.getVehicleList(),
                window.getMadeList(),
                        window.db.collection('mfcr_reports').get(),
                        window.db.collection('mecr_reports').get(),
                        window.db.collection('trip_tickets').get()
                    ]);

                    // Filter by Organization
                    const organizationBuildings = buildings.filter(b => b.organizationId === currentOrganizationId);
                    const organizationVehicles = vehicles.filter(v => v.organizationId === currentOrganizationId);
                    const bldgIds = new Set(organizationBuildings.map(b => b.id));
                    const vehIds = new Set(organizationVehicles.map(v => v.id));

                    // Filter SEUs
                    const filteredSeus = organizationSeus.filter(s => bldgIds.has(s.fsbdId) || vehIds.has(s.vehicleId));

                    // Render Registered SEUs
                    if (filteredSeus.length > 0) {
                        seuTableBody.innerHTML = filteredSeus.map(s => {
                            const assetName = s.fsbdId ? (organizationBuildings.find(b => b.id === s.fsbdId)?.name || 'Unknown Bldg') : (organizationVehicles.find(v => v.id === s.vehicleId)?.plate_number || 'Unknown Vehicle');
                            return `
                                <tr>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium">${assetName}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${s.energy_use_category || '-'}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${s.finding_description}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${s.identification_method}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        ${canWrite ? `
                                            <button class="text-red-600 hover:text-red-900 btn-delete-seu" data-id="${s.id}">Delete</button>
                                        ` : '<span class="text-gray-400 italic text-xs">Read Only</span>'}
                                    </td>
                                </tr>
                            `;
                        }).join('');

                        // Attach delete listeners
                        document.querySelectorAll('.btn-delete-seu').forEach(btn => {
                            btn.addEventListener('click', async (e) => {
                                if (confirm('Delete this SEU finding?')) {
                            await window.deleteSeu(e.target.dataset.id);
                                    renderSeuPage(); // Reload
                                }
                            });
                        });
                    } else {
                        seuTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No SEU findings recorded yet.</td></tr>';
                    }

                    // --- Top Consumers Chart ---
                    const mecr = mecrSnap.docs.map(d => d.data()).filter(r => bldgIds.has(r.fsbdId));
                    const mfcr = mfcrSnap.docs.map(d => d.data()).filter(r => vehIds.has(r.vehicleId));
                    const tts = ttSnap.docs.map(d => d.data()).filter(r => vehIds.has(r.vehicleId));

                    // Normalize fuel reports (merge legacy monthly with new trip tickets)
                    const fuelReports = [
                        ...mfcr,
                        ...tts.map(t => ({
                            vehicleId: t.vehicleId,
                            fuel_consumed_liters: Number(t.fuelLiters) || 0,
                            cost_php: Number(t.fuelCost) || 0,
                            type: 'TripTicket'
                        }))
                    ];

                    const assetCosts = [];
                    organizationBuildings.forEach(b => {
                        const cost = mecr.filter(r => r.fsbdId === b.id).reduce((sum, r) => sum + (Number(r.cost_php) || 0), 0);
                        if(cost > 0) assetCosts.push({ name: b.name, cost, type: 'Building' });
                    });
                    organizationVehicles.forEach(v => {
                        const cost = fuelReports.filter(r => r.vehicleId === v.id).reduce((sum, r) => sum + (Number(r.cost_php) || 0), 0);
                        if(cost > 0) assetCosts.push({ name: v.plate_number, cost, type: 'Vehicle' });
                    });

                    assetCosts.sort((a, b) => b.cost - a.cost);
                    const topConsumers = assetCosts.slice(0, 10);

                    const ctx = document.getElementById('chart-top-consumers');
                    if (ctx) {
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: topConsumers.map(c => c.name),
                                datasets: [{
                                    label: 'Total Energy Cost (PHP)',
                                    data: topConsumers.map(c => c.cost),
                                    backgroundColor: topConsumers.map(c => c.type === 'Building' ? '#4F46E5' : '#0D9488')
                                }]
                            },
                            options: { responsive: true, maintainAspectRatio: false }
                        });
                    }

                    // --- Equipment Analysis (Calculated) ---
                    const organizationMade = madeList.filter(m => bldgIds.has(m.fsbdId));
                    const calculatedMade = organizationMade.map(m => ({
                        ...m,
                        est_monthly_kwh: (m.power_rating_kw || 0) * (m.time_of_use_hours_per_day || 0) * 30 // Assuming 30 days
                    })).sort((a, b) => b.est_monthly_kwh - a.est_monthly_kwh).slice(0, 10); // Top 10

                    equipTableBody.innerHTML = calculatedMade.map(m => {
                        const bldg = organizationBuildings.find(b => b.id === m.fsbdId);
                        return `
                            <tr>
                                <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm">
                                    <div class="font-bold text-gray-800">${m.description_of_equipment}</div>
                                    <div class="text-xs text-gray-500">${bldg ? bldg.name : 'Unknown'} - ${m.location}</div>
                                </td>
                                <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-right font-mono">${m.est_monthly_kwh.toLocaleString()} kWh</td>
                                ${canWrite ? `
                                    <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-center">
                                        <button class="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded text-xs font-bold btn-add-seu-equip" data-id="${m.id}">Identify</button>
                                    </td>
                                ` : '<td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-center text-gray-400 italic text-xs">Read Only</td>'}
                            </tr>
                        `;
                    }).join('') || '<tr><td colspan="3" class="text-center py-2 text-gray-500">No equipment data found.</td></tr>';

                    // --- Vehicle Analysis (Historical & Active) ---
                    const vehicleStats = organizationVehicles.map(v => {
                        const reports = fuelReports.filter(r => r.vehicleId === v.id);
                        const totalFuel = reports.reduce((sum, r) => sum + (Number(r.fuel_consumed_liters) || 0), 0);
                        // For trip tickets, we treat them as individual data points. 
                        // To keep it comparable to "Average Monthly Fuel", we just show the total for now.
                        return { ...v, totalFuel };
                    }).filter(v => v.totalFuel > 0).sort((a, b) => b.totalFuel - a.totalFuel).slice(0, 10);

                    vehicleTableBody.innerHTML = vehicleStats.map(v => `
                        <tr>
                            <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm">
                                <div class="font-bold text-gray-800">${v.plate_number}</div>
                                <div class="text-xs text-gray-500">${v.make} ${v.model}</div>
                            </td>
                            <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-right font-mono">${v.totalFuel.toLocaleString(undefined, {maximumFractionDigits: 1})} L</td>
                            ${canWrite ? `
                                <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-center">
                                    <button class="bg-teal-100 text-teal-700 hover:bg-teal-200 px-2 py-1 rounded text-xs font-bold btn-add-seu-vehicle" data-id="${v.id}">Identify</button>
                                </td>
                            ` : '<td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-center text-gray-400 italic text-xs">Read Only</td>'}
                        </tr>
                    `).join('') || '<tr><td colspan="3" class="text-center py-2 text-gray-500">No fuel reports found.</td></tr>';

                    // --- Event Listeners for "Identify" ---
                    document.querySelectorAll('.btn-add-seu-equip').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const m = calculatedMade.find(i => i.id === e.target.dataset.id);
                            const result = await openFormModal({
                                title: 'Identify SEU from Equipment',
                                fields: [{
                                    name: 'finding_description',
                                    label: 'Finding Description',
                                    type: 'textarea',
                                    required: true,
                                    defaultValue: `High consumption equipment: ${m.description_of_equipment}`
                                }],
                                submitText: 'Identify'
                            });

                            if (result) {
                                await window.createSeu({
                                    fsbdId: m.fsbdId,
                                    energy_use_category: m.energy_use_category,
                                    linkedEquipmentIds: [m.id],
                                    finding_description: result.finding_description,
                                    identification_method: 'Calculated (Rating * Hours)',
                                    status: 'Identified'
                                });
                                renderSeuPage();
                            }
                        });
                    });

                    document.querySelectorAll('.btn-add-seu-vehicle').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const v = vehicleStats.find(i => i.id === e.target.dataset.id);
                            const result = await openFormModal({
                                title: 'Identify SEU from Vehicle',
                                fields: [{
                                    name: 'finding_description',
                                    label: 'Finding Description',
                                    type: 'textarea',
                                    required: true,
                                    defaultValue: `High fuel consumption vehicle: ${v.plate_number}`
                                }],
                                submitText: 'Identify'
                            });
                            if (result) {
                                await window.createSeu({
                                    vehicleId: v.id,
                                    energy_use_category: 'Fuel Consumption',
                                    finding_description: result.finding_description,
                                    identification_method: 'Historical Average',
                                    status: 'Identified'
                                });
                                renderSeuPage();
                            }
                        });
                    });

                    // --- Event Listener for "Create Custom SEU" ---
                    const createBtn = document.getElementById('btn-create-seu');
                    if (createBtn) {
                        createBtn.addEventListener('click', async () => {
                            const assets = [
                                ...organizationBuildings.map(b => ({ id: b.id, name: `Building: ${b.name}`, type: 'building' })),
                                ...organizationVehicles.map(v => ({ id: v.id, name: `Vehicle: ${v.plate_number}`, type: 'vehicle' }))
                            ];

                            if (assets.length === 0) {
                                return alert('No buildings or vehicles found for the current Organization. Please add an asset first.');
                            }

                            const assetOptions = assets.map(a => ({
                                value: `${a.type}:${a.id}`,
                                text: a.name
                            }));

                            const result = await openFormModal({
                                title: 'Add Manual SEU Finding',
                                fields: [
                                    {
                                        name: 'asset',
                                        label: 'Select Asset',
                                        type: 'select',
                                        options: assetOptions,
                                        required: true
                                    },
                                    {
                                        name: 'finding_description',
                                        label: 'Finding Description',
                                        type: 'textarea',
                                        required: true,
                                        placeholder: 'e.g., Lights in hallway are always on'
                                    },
                                    {
                                        name: 'energy_use_category',
                                        label: 'Energy Use Category',
                                        type: 'text',
                                        required: true,
                                        placeholder: 'e.g., HVAC, Lighting, Fuel'
                                    }
                                ],
                                submitText: 'Add Finding'
                            });

                            if (result) {
                                const [type, id] = result.asset.split(':');
                                await window.createSeu({
                                    fsbdId: type === 'building' ? id : null,
                                    vehicleId: type === 'vehicle' ? id : null,
                                    energy_use_category: result.energy_use_category,
                                    finding_description: result.finding_description,
                                    identification_method: 'Manual Entry',
                                    status: 'Identified'
                                });
                                renderSeuPage();
                            }
                        });
                    }
                } catch (error) {
                    console.error("Error rendering SEU page:", error);
                }
            }