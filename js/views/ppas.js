import { getCurrentLguId, checkPermission } from './state.js';

// --- Module-level state for search, sort, and data ---
let fullPpaList = [];
let currentSort = { column: 'project_name', direction: 'asc' };
let currentSearchTerm = '';

/**
 * Filters and sorts the full list based on current state.
 */
function getProcessedList() {
    let processedList = fullPpaList;

    // 1. Filter by search term
    if (currentSearchTerm) {
        const lowercasedTerm = currentSearchTerm.toLowerCase();
        processedList = fullPpaList.filter(ppa => 
            (ppa.project_name || '').toLowerCase().includes(lowercasedTerm) ||
            (ppa.status || '').toLowerCase().includes(lowercasedTerm)
        );
    }

    // 2. Sort the list
    processedList.sort((a, b) => {
        const col = currentSort.column;
        let valA = a[col];
        let valB = b[col];

        if (valA == null) return 1;
        if (valB == null) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
            return currentSort.direction === 'asc' ? valA - valB : valB - valA;
        }

        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();

        if (valA < valB) return currentSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    return processedList;
}

/**
 * Renders the PPA table based on the current state.
 */
function renderPpaTable() {
    const tableBody = document.getElementById('ppa-table-body');
    if (!tableBody) return;

    const processedList = getProcessedList();
    const canWrite = checkPermission('ppas', 'write');

    if (processedList.length > 0) {
        tableBody.innerHTML = processedList.map(ppa => `
            <tr>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${ppa.project_name}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${ppa.status}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-mono">${ppa.estimated_cost_php != null ? Number(ppa.estimated_cost_php).toLocaleString() : 'N/A'}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-mono">${ppa.actual_cost_php != null ? Number(ppa.actual_cost_php).toLocaleString() : 'N/A'}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    ${canWrite ? `
                        <a href="#/ppas/edit/${ppa.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                    ` : '<span class="text-gray-400 italic text-xs">Read Only</span>'}
                </td>
            </tr>
        `).join('');
    } else {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">${currentSearchTerm ? 'No projects match your search.' : 'No projects found.'}</td></tr>`;
    }

    // Update sort indicators
    document.querySelectorAll('th[data-sort]').forEach(th => {
        const indicator = th.querySelector('.sort-indicator');
        if (indicator) {
            if (th.dataset.sort === currentSort.column) {
                indicator.textContent = currentSort.direction === 'asc' ? '▲' : '▼';
            } else {
                indicator.textContent = '';
            }
        }
    });
}

export async function renderPpaList() {
    const tableBody = document.getElementById('ppa-table-body');
    if (!tableBody) return;

    // Reset state for this view
    currentSearchTerm = '';
    currentSort = { column: 'project_name', direction: 'asc' };

    // Initial loading state
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
    
    // Handle Add Button visibility
    const addBtn = document.getElementById('btn-add-ppa');
    if (addBtn) {
        addBtn.classList.toggle('hidden', !checkPermission('ppas', 'write'));
    }

    let ppas = await window.getPpaList();
    
    const currentLguId = getCurrentLguId();
    if (currentLguId) {
        let [rios, buildings, vehicles] = await Promise.all([window.getRioList(), window.getFsbdList(), window.getVehicleList()]);
        const allowedAssetIds = new Set([...buildings.filter(b => b.lguId === currentLguId).map(b => b.id), ...vehicles.filter(v => v.lguId === currentLguId).map(v => v.id)]);
        const allowedRioIds = new Set(rios.filter(r => allowedAssetIds.has(r.fsbdId) || allowedAssetIds.has(r.vehicleId)).map(r => r.id));
        
        fullPpaList = ppas.filter(ppa => ppa.relatedRioIds && ppa.relatedRioIds.some(id => allowedRioIds.has(id)));
    } else {
        fullPpaList = ppas;
    }

    // Initial render
    renderPpaTable();

    // Setup search listener
    const searchInput = document.getElementById('ppa-search');
    if (searchInput) {
        searchInput.value = ''; // Clear on load
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            renderPpaTable();
        });
    }

    // Setup sort listeners
    document.querySelectorAll('th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const column = th.dataset.sort;
            if (currentSort.column === column) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.column = column;
                currentSort.direction = 'asc';
            }
            renderPpaTable();
        });
    });
}

export async function initPpaForm(docId = null) {
                const form = document.getElementById('ppa-form');
                if (!form) return;

                const idField = document.getElementById('ppa-id');
                const nameField = document.getElementById('project_name');
                const riosField = document.getElementById('relatedRioIds');
                const statusField = document.getElementById('status');
                const estimatedCostField = document.getElementById('estimated_cost_php');
                const actualCostField = document.getElementById('actual_cost_php');

                // Populate RIOs dropdown
        let rios = await window.getRioList();
        const currentLguId = getCurrentLguId();
                if (currentLguId) {
                    // Filter RIOs for dropdown
            const [buildings, vehicles] = await Promise.all([window.getFsbdList(), window.getVehicleList()]);
                    const allowedAssetIds = new Set([...buildings.filter(b => b.lguId === currentLguId).map(b => b.id), ...vehicles.filter(v => v.lguId === currentLguId).map(v => v.id)]);
                    rios = rios.filter(r => allowedAssetIds.has(r.fsbdId) || allowedAssetIds.has(r.vehicleId));
                }

                riosField.innerHTML = rios.map(rio => `<option value="${rio.id}">${rio.proposed_action}</option>`).join('');

                // Layout adjustment for Side-by-Side View (Form + RIO Details)
                const formCard = form.closest('.bg-white') || form.parentElement;
                formCard.classList.remove('max-w-3xl', 'mx-auto');
                formCard.classList.add('w-full', 'h-full');

                // Create Grid Wrapper
                const gridWrapper = document.createElement('div');
                gridWrapper.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 w-full';

                if (formCard.parentNode) {
                    formCard.parentNode.insertBefore(gridWrapper, formCard);
                    gridWrapper.appendChild(formCard);
                }

                // Create Details Card
                const detailsCard = document.createElement('div');
                detailsCard.className = 'bg-white shadow-md rounded-lg overflow-hidden h-full border-t-4 border-indigo-500 flex flex-col';
                detailsCard.innerHTML = `
                    <div class="hero-header px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-bold">Selected RIO Details</h2>
                    </div>
                    <div class="p-6 space-y-4 overflow-y-auto flex-1" id="rio-details-content">
                        <p class="text-gray-500 text-center italic">Select one or more RIOs to view details.</p>
                    </div>
                `;
                gridWrapper.appendChild(detailsCard);

                const detailsContent = detailsCard.querySelector('#rio-details-content');

                const updateRioDetails = () => {
                    const selectedOptions = Array.from(riosField.selectedOptions);
                    const selectedIds = new Set(selectedOptions.map(o => o.value));
                    const selectedRios = rios.filter(r => selectedIds.has(r.id));

                    if (selectedRios.length === 0) {
                        detailsContent.innerHTML = '<p class="text-gray-500 text-center italic">Select one or more RIOs to view details.</p>';
                        return;
                    }

                    detailsContent.innerHTML = selectedRios.map(rio => `
                        <div class="border rounded p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-xs font-bold px-2 py-1 rounded ${rio.priority === 'High' ? 'bg-red-100 text-red-800' : (rio.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800')}">${rio.priority}</span>
                                <span class="text-xs text-gray-500 border px-1 rounded">${rio.status}</span>
                            </div>
                            <p class="font-medium text-gray-800 mb-2 text-sm">${rio.proposed_action}</p>
                            <div class="text-xs text-gray-600 grid grid-cols-2 gap-2 border-t pt-2 mt-2">
                                <div><span class="block text-gray-400">Est. Cost</span> ₱${(rio.estimated_cost_php || 0).toLocaleString()}</div>
                                <div><span class="block text-gray-400">Est. Savings</span> ₱${(rio.estimated_savings_php || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('');
                };

                riosField.addEventListener('change', updateRioDetails);

                if (docId) {
                    // EDIT MODE
                    const data = await window.getPpaById(docId);
                    if (data) {
                        idField.value = data.id;
                        nameField.value = data.project_name || '';
                        statusField.value = data.status || 'Planned';
                        estimatedCostField.value = data.estimated_cost_php || '';
                        actualCostField.value = data.actual_cost_php || '';
                        if (data.relatedRioIds) {
                            Array.from(riosField.options).forEach(option => {
                                if (data.relatedRioIds.includes(option.value)) {
                                    option.selected = true;
                                }
                            });
                        }
                        updateRioDetails();
                    }
                }

                // Read-only check
                if (!checkPermission('ppas', 'write')) {
                    form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) submitBtn.classList.add('hidden');
                    
                    // Add a notice
                    const notice = document.createElement('div');
                    notice.className = 'bg-amber-50 border border-amber-200 text-amber-700 p-4 mb-6 rounded-lg text-sm';
                    notice.innerHTML = '<strong>Read-Only Mode:</strong> You do not have permission to modify this project. All changes are disabled.';
                    form.prepend(notice);
                    return; // Don't attach submit listener
                }

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const selectedRioIds = Array.from(riosField.selectedOptions).map(option => option.value);
                    
                    const formData = {
                        project_name: nameField.value,
                        status: statusField.value,
                        estimated_cost_php: Number(estimatedCostField.value) || null,
                        actual_cost_php: Number(actualCostField.value) || null,
                        relatedRioIds: selectedRioIds,
                    };

                    const id = idField.value;
                    let success = false;
                    if (id) {
                success = await window.updatePpa(id, formData);
                    } else {
                success = await window.createPpa(formData);
                    }

                    if (success) {
                        location.hash = '#/ppas';
                    } else {
                        alert('Error saving project.');
                    }
                });
}