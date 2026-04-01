import { initOrganizationSelector } from '../app.js';
import { populateOrganizationSelector } from './ui.js';
import { checkPermission } from './state.js';

const modules = [
    { id: 'dashboard', name: 'Dashboard' },
    { id: 'fsbds', name: 'Buildings (FSBD)' },
    { id: 'vehicles', name: 'Vehicles' },
    { id: 'made', name: 'Equipment (MADE)' },
    { id: 'consumption', name: 'Consumption' },
    { id: 'seu', name: 'SEU Identification' },
    { id: 'rios', name: 'Recommendations (RIO)' },
    { id: 'ppas', name: 'Projects (PPA)' },
    { id: 'reporting', name: 'Compliance Report' },
    { id: 'users', name: 'Users' },
    { id: 'organizations', name: 'Organizations' },
    { id: 'admin', name: 'Admin Panel' }
];

export async function renderAdmin() {
                // Fetch all data
                const [organizations, fsbds, vehicles, made, mecr, mfcr, rios, ppas, users] = await Promise.all([
            window.getOrganizationList(), window.getFsbdList(), window.getVehicleList(), window.getMadeList(),
            window.getMecrReports(), window.getTripTickets(),
            window.getRioList(), window.getPpaList(),
            window.getUserList()
                ]);

                // --- SAMPLE DATA BUTTON LOGIC ---
                const btnSample = document.getElementById('btn-sample-data');
                if (btnSample) {
                    if (!checkPermission('admin', 'write')) {
                        btnSample.classList.add('hidden');
                    } else {
                        const exists = await window.checkSampleDataExists();
                        
                        if (exists) {
                            btnSample.textContent = 'Delete Sample Data';
                            btnSample.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow focus:outline-none focus:shadow-outline transition duration-150 ease-in-out';
                            btnSample.onclick = async () => {
                                if (confirm('Are you sure you want to delete all sample data? This cannot be undone.')) {
                                    btnSample.disabled = true;
                                    btnSample.textContent = 'Deleting...';
                                    await window.deleteSampleData();
                                    if(window.showToast) window.showToast('Sample Data Deleted successfully', 'success');
                                    await initOrganizationSelector(); // Refresh selector
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
                                if(window.showToast) window.showToast('Sample Data Generated Successfully');
                                await initOrganizationSelector(); // Refresh selector
                                await renderAdmin(); // Refresh view
                            };
                        }
                        btnSample.classList.remove('hidden');
                    }
                }

                // --- STATE MANAGEMENT ---
                let currentSearchQuery = '';
                let currentPage = 1;
                const ITEMS_PER_PAGE = 50;
                let currentActiveTabId = 'content-organizations';

                const searchInput = document.getElementById('admin-search-input');
                const btnPrev = document.getElementById('btn-prev-page');
                const btnNext = document.getElementById('btn-next-page');
                const pageInfo = document.getElementById('pagination-info');
                const pagContainer = document.getElementById('admin-pagination-container');
                const itemCount = document.getElementById('admin-item-count');

                // Create Maps for Parent Lookup
                const organizationMap = (organizations || []).reduce((acc, i) => ({...acc, [i.id]: i.name}), {});
                const fsbdMap = (fsbds || []).reduce((acc, i) => ({...acc, [i.id]: i.name}), {});
                const vehicleMap = (vehicles || []).reduce((acc, i) => ({...acc, [i.id]: i.plate_number}), {});

                // Define tables centrally to allow dynamic re-rendering
                const tableDefs = {
                    'content-organizations': { tableId: 'table-organizations', moduleId: 'organizations', items: organizations, nameFn: i => i.name, parentFn: () => 'N/A', editHash: '#/organizations/edit', deleteFn: window.deleteOrganization },
                    'content-fsbds': { tableId: 'table-fsbds', moduleId: 'fsbds', items: fsbds, nameFn: i => i.name, parentFn: i => organizationMap[i.organizationId] || 'Unknown Organization', editHash: '#/fsbds/edit', deleteFn: window.deleteFsbd },
                    'content-vehicles': { tableId: 'table-vehicles', moduleId: 'vehicles', items: vehicles, nameFn: i => i.plate_number, parentFn: i => organizationMap[i.organizationId] || 'Unknown Organization', editHash: '#/vehicles/edit', deleteFn: window.deleteVehicle },
                    'content-made': { tableId: 'table-made', moduleId: 'made', items: made, nameFn: i => i.description_of_equipment, parentFn: i => fsbdMap[i.fsbdId] || 'Unknown Building', editHash: '#/made/edit', deleteFn: window.deleteMade },
                    'content-mecr': { tableId: 'table-mecr', moduleId: 'consumption', items: mecr, nameFn: i => `${i.reporting_year}-${i.reporting_month}`, parentFn: i => fsbdMap[i.fsbdId] || 'Unknown', editHash: '#/consumption', deleteFn: window.deleteMecrReport },
                    'content-trip-tickets': { tableId: 'table-trip-tickets', moduleId: 'consumption', items: mfcr, nameFn: i => `${i.date} - ${i.driver}`, parentFn: i => vehicleMap[i.vehicleId] || 'Unknown', editHash: '#/consumption', deleteFn: window.deleteTripTicket },
                    'content-rios': { tableId: 'table-rios', moduleId: 'rios', items: rios, nameFn: i => i.proposed_action, parentFn: i => fsbdMap[i.fsbdId] || vehicleMap[i.vehicleId] || 'Unknown Asset', editHash: '#/rios/edit', deleteFn: window.deleteRio },
                    'content-ppas': { tableId: 'table-ppas', moduleId: 'ppas', items: ppas, nameFn: i => i.project_name, parentFn: () => 'N/A', editHash: '#/ppas/edit', deleteFn: window.deletePpa },
                    'content-users': { tableId: 'table-users', moduleId: 'users', items: users, nameFn: i => `${i.displayName || 'Unknown'} (${i.email})`, parentFn: i => organizationMap[i.assignedOrganizationId] || 'None / Pending', editHash: '#/users', deleteFn: () => false },
                };

                const renderActiveTable = () => {
                    if (currentActiveTabId === 'content-defaults') {
                        pagContainer.classList.add('hidden');
                        if (searchInput) searchInput.parentElement.classList.add('hidden');
                        itemCount.innerHTML = '';
                        return;
                    }
                    if (searchInput) searchInput.parentElement.classList.remove('hidden');

                    const def = tableDefs[currentActiveTabId];
                    if (!def) return;

                    const tbody = document.querySelector(`#${def.tableId} tbody`);
                    if (!tbody) return;

                    // Filter
                    let filtered = def.items;
                    if (currentSearchQuery) {
                        const q = currentSearchQuery.toLowerCase();
                        filtered = def.items.filter(item => {
                            const n = (def.nameFn(item) || '').toLowerCase();
                            const p = (def.parentFn(item) || '').toLowerCase();
                            return n.includes(q) || p.includes(q);
                        });
                    }

                    // Paginate
                    const totalItems = filtered.length;
                    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
                    if (currentPage > totalPages) currentPage = totalPages;

                    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
                    const endIdx = startIdx + ITEMS_PER_PAGE;
                    const paginated = filtered.slice(startIdx, endIdx);

                    // Update UI Counters
                    if (itemCount) {
                        itemCount.textContent = `Showing ${totalItems > 0 ? startIdx + 1 : 0} - ${Math.min(endIdx, totalItems)} of ${totalItems}`;
                    }
                    
                    if (totalItems > ITEMS_PER_PAGE) {
                        pagContainer.classList.remove('hidden');
                        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
                        btnPrev.disabled = currentPage === 1;
                        btnNext.disabled = currentPage === totalPages;
                    } else {
                        pagContainer.classList.add('hidden');
                    }

                    // Render
                    if (paginated.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-500 italic">No items found</td></tr>';
                        return;
                    }
                    
                    const canWrite = checkPermission(def.moduleId, 'write');

                    tbody.innerHTML = paginated.map(item => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${def.nameFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${def.parentFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                ${canWrite ? `
                                    <a href="${def.editHash === '#/consumption' ? def.editHash : def.editHash + '/' + item.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</a>
                                    ${def.tableId !== 'table-users' ? `<button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs btn-delete" data-id="${item.id}">Delete</button>` : ''}
                                ` : '<span class="text-gray-400 italic text-xs">Read Only</span>'}
                            </td>
                        </tr>
                    `).join('');

                    // Attach delete listeners
                    if (canWrite && def.tableId !== 'table-users') {
                        tbody.querySelectorAll('.btn-delete').forEach(btn => {
                            btn.addEventListener('click', async (e) => {
                                if(confirm('Are you sure you want to delete this item?')) {
                                    const id = e.target.getAttribute('data-id');
                                    const success = await def.deleteFn(id);
                                    if(success) {
                                        if (window.showToast) window.showToast('Item deleted successfully.');
                                        // Remove from local array so it doesn't reappear on search/pagination
                                        def.items = def.items.filter(i => i.id !== id);
                                        renderActiveTable(); // re-render
                                    } else {
                                        if (window.showToast) window.showToast('Error deleting item.', 'error');
                                    }
                                }
                            });
                        });
                    }
                };

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
                        
                        currentActiveTabId = tab.dataset.target;
                        document.getElementById(currentActiveTabId).classList.remove('hidden');
                        
                        // Reset search and pagination when switching tabs
                        if (searchInput) searchInput.value = '';
                        currentSearchQuery = '';
                        currentPage = 1;

                        renderActiveTable();
                    });
                });

                // Attach Event Listeners to Search and Pagination
                if (searchInput) {
                    searchInput.addEventListener('input', (e) => {
                        currentSearchQuery = e.target.value;
                        currentPage = 1;
                        renderActiveTable();
                    });
                }

                if (btnPrev) {
                    btnPrev.addEventListener('click', () => {
                        if (currentPage > 1) {
                            currentPage--;
                            renderActiveTable();
                        }
                    });
                }

                if (btnNext) {
                    btnNext.addEventListener('click', () => {
                        currentPage++;
                        renderActiveTable();
                    });
                }

                // Initial Render Base view
                const initialTabsElements = ['content-organizations','content-fsbds','content-vehicles','content-made','content-mecr','content-trip-tickets','content-rios','content-ppas','content-users'];
                for (const t of initialTabsElements) {
                    // pre-render all tables hidden so they don't stutter, but keep 'content-organizations' active
                    const tempTab = currentActiveTabId;
                    currentActiveTabId = t;
                    renderActiveTable();
                    currentActiveTabId = tempTab;
                }
                renderActiveTable(); // force active rendering

        // --- DEFAULT PERMISSIONS LOGIC ---
        const defaultContainer = document.getElementById('admin-default-modules');
        const defaultPerms = await window.getDefaultPermissions();
        const defaultOrganizationSelector = document.getElementById('default-organization-selector');

        if (defaultOrganizationSelector) {
            await populateOrganizationSelector(defaultOrganizationSelector, { 
                includeEmpty: true, 
                emptyText: 'None (System Wide)',
                filterByUser: false 
            });
            defaultOrganizationSelector.value = defaultPerms.defaultOrganizationId || '';
        }

        defaultContainer.innerHTML = modules.map(m => {
            const read = defaultPerms[m.id]?.read ?? false;
            const write = defaultPerms[m.id]?.write ?? false;
            return `
                <div class="flex items-center py-2 border-b border-gray-100 last:border-0">
                    <div class="flex-1 text-sm font-medium text-gray-700">${m.name}</div>
                    <div class="w-24 flex justify-center">
                        <input type="checkbox" class="default-perm-check w-5 h-5 text-blue-600 rounded" data-module="${m.id}" data-type="read" ${read ? 'checked' : ''}>
                    </div>
                    <div class="w-24 flex justify-center">
                        <input type="checkbox" class="default-perm-check w-5 h-5 text-blue-600 rounded" data-module="${m.id}" data-type="write" ${write ? 'checked' : ''}>
                    </div>
                </div>
            `;
        }).join('');

        const saveBtn = document.getElementById('btn-save-default-perms');
        if (saveBtn) {
            if (!checkPermission('admin', 'write')) {
                saveBtn.classList.add('hidden');
                document.querySelectorAll('.default-perm-check').forEach(cb => cb.disabled = true);
                if (defaultOrganizationSelector) defaultOrganizationSelector.disabled = true;
            } else {
                saveBtn.onclick = async () => {
                    saveBtn.disabled = true;
                    saveBtn.textContent = 'Saving...';
                    
                    const newDefaults = {
                        defaultOrganizationId: document.getElementById('default-organization-selector')?.value || null
                    };
                    document.querySelectorAll('.default-perm-check').forEach(cb => {
                        const mod = cb.dataset.module;
                        const type = cb.dataset.type;
                        if (!newDefaults[mod]) newDefaults[mod] = {};
                        newDefaults[mod][type] = cb.checked;
                    });

                    if (await window.updateDefaultPermissions(newDefaults)) {
                        saveBtn.textContent = 'Saved!';
                        setTimeout(() => { saveBtn.disabled = false; saveBtn.textContent = 'Save Default Permissions'; }, 2000);
                    }
                };
            }
        }
            }