import { getCurrentLguId, checkPermission } from './state.js';

// --- Module-level state for search, sort, and data ---
let fullFsbdList = [];
let currentSort = { column: 'name', direction: 'asc' };
let currentSearchTerm = '';

/**
 * Filters and sorts the full list based on current state.
 * @returns {Array} The processed list of buildings.
 */
function getProcessedList() {
    let processedList = fullFsbdList;

    // 1. Filter by search term
    if (currentSearchTerm) {
        const lowercasedTerm = currentSearchTerm.toLowerCase();
        processedList = fullFsbdList.filter(fsbd => 
            (fsbd.name || '').toLowerCase().includes(lowercasedTerm) ||
            (fsbd.fsbd_type || '').toLowerCase().includes(lowercasedTerm) ||
            (fsbd.address || '').toLowerCase().includes(lowercasedTerm)
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
 * Renders the building table based on the current state.
 */
function renderFsbdTable() {
    const tableBody = document.getElementById('fsbd-table-body');
    if (!tableBody) return;

    const processedList = getProcessedList();

    if (processedList.length > 0) {
        tableBody.innerHTML = processedList.map(fsbd => `
            <tr>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${fsbd.name}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${fsbd.fsbd_type}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${fsbd.address}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    ${checkPermission('fsbds', 'write') ? `
                        <a href="#/fsbds/edit/${fsbd.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                    ` : '<span class="text-gray-400 italic text-xs">Read Only</span>'}
                </td>
            </tr>
        `).join('');
    } else {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">${currentSearchTerm ? 'No buildings match your search.' : 'No buildings found. Add one!'}</td></tr>`;
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

export async function renderFsbdList() {
    const tableBody = document.getElementById('fsbd-table-body');
    if (!tableBody) return;

    // Reset state for this view
    currentSearchTerm = '';
    currentSort = { column: 'name', direction: 'asc' };

    // Initial loading state
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>';
    
    // Handle Add Button visibility
    const addBtn = document.getElementById('btn-add-fsbd');
    if (addBtn) {
        addBtn.classList.toggle('hidden', !checkPermission('fsbds', 'write'));
    }
    
    let fsbds = await window.getFsbdList();
            
    // Filter by Current LGU
    const currentLguId = getCurrentLguId();
    if (currentLguId) {
        fullFsbdList = fsbds.filter(f => f.lguId === currentLguId || !f.lguId);
    } else {
        fullFsbdList = fsbds;
    }

    // Initial render
    renderFsbdTable();

    // Setup search listener
    const searchInput = document.getElementById('fsbd-search');
    if (searchInput) {
        searchInput.value = ''; // Clear on load
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            renderFsbdTable();
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
            renderFsbdTable();
        });
    });
}
        
export async function initFsbdForm(docId = null) {
                const form = document.getElementById('fsbd-form');
                if (!form) return;
                
                const idField = document.getElementById('fsbd-id');
                const nameField = document.getElementById('name');
                const typeField = document.getElementById('fsbd_type');
                const addressField = document.getElementById('address');
                const yearField = document.getElementById('construction_year');
                const areaField = document.getElementById('floor_area_sqm');
        
                if (docId) {
                    // EDIT MODE
            const data = await window.getFsbdById(docId);
                    if (data) {
                        idField.value = data.id;
                        nameField.value = data.name || '';
                        typeField.value = data.fsbd_type || '';
                        addressField.value = data.address || '';
                        yearField.value = data.construction_year || '';
                        areaField.value = data.floor_area_sqm || '';
                    }
                } 
                // else CREATE MODE (fields are empty by default)
        
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = {
                        name: nameField.value,
                        fsbd_type: typeField.value,
                        address: addressField.value,
                        construction_year: yearField.value ? Number(yearField.value) : null,
                        floor_area_sqm: areaField.value ? Number(areaField.value) : null,
                lguId: getCurrentLguId() // Attach current LGU
                    };
        
                    const id = idField.value;
                    let success = false;
                    if (id) {
                success = await window.updateFsbd(id, formData);
                    } else {
                success = await window.createFsbd(formData);
                    }
        
                    if (success) {
                        location.hash = '#/fsbds'; // Redirect on success
                    } else {
                        alert('There was an error saving the data.');
                    }
                });
            }