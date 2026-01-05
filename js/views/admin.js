import { initLguSelector } from '../app.js';

export async function renderAdmin() {
                // Fetch all data
                const [lgus, fsbds, vehicles, made, mecr, mfcr, rios, ppas] = await Promise.all([
            window.getLguList(), window.getFsbdList(), window.getVehicleList(), window.getMadeList(),
            window.db.collection('mecr_reports').get().then(s => s.docs.map(d => ({id:d.id, ...d.data()}))),
            window.db.collection('mfcr_reports').get().then(s => s.docs.map(d => ({id:d.id, ...d.data()}))),
            window.getRioList(), window.getPpaList()
                ]);

                // --- SAMPLE DATA BUTTON LOGIC ---
                const btnSample = document.getElementById('btn-sample-data');
                if (btnSample) {
            const exists = await window.checkSampleDataExists();
                    
                    if (exists) {
                        btnSample.textContent = 'Delete Sample Data';
                        btnSample.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow focus:outline-none focus:shadow-outline transition duration-150 ease-in-out';
                        btnSample.onclick = async () => {
                            if (confirm('Are you sure you want to delete all sample data? This cannot be undone.')) {
                                btnSample.disabled = true;
                                btnSample.textContent = 'Deleting...';
                        await window.deleteSampleData();
                                await initLguSelector(); // Refresh selector
                                await renderAdmin(); // Refresh view
                            }
                        };
                    } else {
                        btnSample.textContent = 'Generate Sample Data';
                        btnSample.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow focus:outline-none focus:shadow-outline transition duration-150 ease-in-out';
                        btnSample.onclick = async () => {
                            btnSample.disabled = true;
                            btnSample.textContent = 'Generating...';
                    await window.createSampleData();
                            await initLguSelector(); // Refresh selector
                            await renderAdmin(); // Refresh view
                        };
                    }
                    btnSample.classList.remove('hidden');
                }

                // --- TAB LOGIC ---
                const tabs = document.querySelectorAll('.tab-btn');
                const contents = document.querySelectorAll('.tab-content-item');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        tabs.forEach(t => t.classList.replace('border-blue-500', 'border-transparent'));
                        tabs.forEach(t => t.classList.replace('text-blue-600', 'text-gray-500'));
                        tab.classList.replace('border-transparent', 'border-blue-500');
                        tab.classList.replace('text-gray-500', 'text-blue-600');
                        contents.forEach(c => c.classList.add('hidden'));
                        document.getElementById(tab.dataset.target).classList.remove('hidden');
                    });
                });

                // Create Maps for Parent Lookup
                const lguMap = lgus.reduce((acc, i) => ({...acc, [i.id]: i.name}), {});
                const fsbdMap = fsbds.reduce((acc, i) => ({...acc, [i.id]: i.name}), {});
                const vehicleMap = vehicles.reduce((acc, i) => ({...acc, [i.id]: i.plate_number}), {});

                // Helper to render table rows
                const renderRows = (tableId, items, nameFn, parentFn, editHash, deleteFn) => {
                    const tbody = document.querySelector(`#${tableId} tbody`);
                    if (!tbody) return;
                    if (items.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No items found</td></tr>';
                        return;
                    }
                    tbody.innerHTML = items.map(item => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${nameFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${parentFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="${editHash}/${item.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</a>
                                <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs btn-delete" data-id="${item.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('');

                    // Attach delete listeners
                    tbody.querySelectorAll('.btn-delete').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            if(confirm('Are you sure you want to delete this item?')) {
                                const id = e.target.getAttribute('data-id');
                                const success = await deleteFn(id);
                                if(success) {
                                    e.target.closest('tr').remove();
                                } else {
                                    alert('Error deleting item.');
                                }
                            }
                        });
                    });
                };

                // Render LGUs
        renderRows('table-lgus', lgus, i => i.name, () => 'N/A', '#/lgus/edit', window.deleteLgu);

                // Render Buildings
        renderRows('table-fsbds', fsbds, i => i.name, i => lguMap[i.lguId] || 'Unknown LGU', '#/fsbds/edit', window.deleteFsbd);

                // Render Vehicles
        renderRows('table-vehicles', vehicles, i => i.plate_number, i => lguMap[i.lguId] || 'Unknown LGU', '#/vehicles/edit', window.deleteVehicle);

                // Render MADE
        renderRows('table-made', made, i => i.description_of_equipment, i => fsbdMap[i.fsbdId] || 'Unknown Building', '#/made/edit', window.deleteMade);

                // Render MECR (No edit page for reports in current structure, usually handled in consumption page, but we can't link easily without a specific edit route. 
                // For now, we will disable Edit or link to consumption page. The prompt asked for edit/delete. 
                // Since we don't have specific edit forms for reports (they are inline in consumption), I will omit the edit link for reports or point to consumption.)
                // Actually, let's just allow Delete for reports to keep it simple as per "edit and delete" request usually implies existence of edit forms.
                // I'll leave Edit button but it might not work perfectly if route doesn't exist. 
                // *Correction*: The user didn't ask to create edit forms for reports, just "actions to edit or delete". 
                // I will hide Edit for reports since no route exists in app.js for /mecr/edit.
                const renderRowsNoEdit = (tableId, items, nameFn, parentFn, deleteFn) => {
                     const tbody = document.querySelector(`#${tableId} tbody`);
                     if (!tbody) return;
                     tbody.innerHTML = items.map(item => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${nameFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${parentFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs btn-delete" data-id="${item.id}">Delete</button></td>
                        </tr>
                    `).join('');
                    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async (e) => { if(confirm('Delete?')) { await deleteFn(e.target.getAttribute('data-id')); e.target.closest('tr').remove(); } }));
                };

        renderRowsNoEdit('table-mecr', mecr, i => `${i.reporting_year}-${i.reporting_month}`, i => fsbdMap[i.fsbdId] || 'Unknown', window.deleteMecrReport);
        renderRowsNoEdit('table-mfcr', mfcr, i => `${i.reporting_year}-${i.reporting_month}`, i => vehicleMap[i.vehicleId] || 'Unknown', window.deleteMfcrReport);

        renderRows('table-rios', rios, i => i.proposed_action, i => fsbdMap[i.fsbdId] || vehicleMap[i.vehicleId] || 'Unknown Asset', '#/rios/edit', window.deleteRio);
        renderRows('table-ppas', ppas, i => i.project_name, () => 'N/A', '#/ppas/edit', window.deletePpa);
            }