import { getCurrentLguId, checkPermission } from './state.js';

// --- Module-level state for search, sort, and data ---
let fullVehicleList = [];
let currentSort = { column: 'plate_number', direction: 'asc' };
let currentSearchTerm = '';

/**
 * Filters and sorts the full list based on current state.
 * @returns {Array} The processed list of vehicles.
 */
function getProcessedList() {
    let processedList = fullVehicleList;

    // 1. Filter by search term
    if (currentSearchTerm) {
        const lowercasedTerm = currentSearchTerm.toLowerCase();
        processedList = fullVehicleList.filter(vehicle => 
            (vehicle.plate_number || '').toLowerCase().includes(lowercasedTerm) ||
            (vehicle.make || '').toLowerCase().includes(lowercasedTerm) ||
            (vehicle.model || '').toLowerCase().includes(lowercasedTerm) ||
            (vehicle.fuel_type || '').toLowerCase().includes(lowercasedTerm)
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
 * Renders the vehicle table based on the current state.
 */
function renderVehicleTable() {
    const tableBody = document.getElementById('vehicle-table-body');
    if (!tableBody) return;

    const processedList = getProcessedList();

    if (processedList.length > 0) {
        tableBody.innerHTML = processedList.map(vehicle => `
            <tr>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.plate_number}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.make}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.model}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.fuel_type}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    ${checkPermission('vehicles', 'write') ? `
                        <a href="#/vehicles/edit/${vehicle.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                    ` : '<span class="text-gray-400 italic text-xs">Read Only</span>'}
                </td>
            </tr>
        `).join('');
    } else {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4">${currentSearchTerm ? 'No vehicles match your search.' : 'No vehicles found. Add one!'}</td></tr>`;
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

export async function renderVehicleList() {
    const tableBody = document.getElementById('vehicle-table-body');
    if (!tableBody) return;

    // Reset state for this view
    currentSearchTerm = '';
    currentSort = { column: 'plate_number', direction: 'asc' };

    // Initial loading state
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading...</td></tr>';
    
    // Handle Add Button visibility
    const addBtn = document.getElementById('btn-add-vehicle');
    if (addBtn) {
        addBtn.classList.toggle('hidden', !checkPermission('vehicles', 'write'));
    }
    
    let vehicles = await window.getVehicleList();

    // Filter by Current LGU
    const currentLguId = getCurrentLguId();
    if (currentLguId) {
        fullVehicleList = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
    } else {
        fullVehicleList = vehicles;
    }
    
    // Initial render
    renderVehicleTable();

    // Setup search listener
    const searchInput = document.getElementById('vehicle-search');
    if (searchInput) {
        searchInput.value = ''; // Clear on load
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            renderVehicleTable();
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
            renderVehicleTable();
        });
    });
}
        
export async function initVehicleForm(docId = null) {
                const form = document.getElementById('vehicle-form');
                if (!form) return;
        
                const idField = document.getElementById('vehicle-id');
                const plateField = document.getElementById('plate_number');
                const makeField = document.getElementById('make');
                const modelField = document.getElementById('model');
                const yearField = document.getElementById('year_model');
                const fuelField = document.getElementById('fuel_type');
        
                if (docId) {
                    // EDIT MODE
            const data = await window.getVehicleById(docId);
                    if (data) {
                        idField.value = data.id;
                        plateField.value = data.plate_number || '';
                        makeField.value = data.make || '';
                        modelField.value = data.model || '';
                        yearField.value = data.year_model || '';
                        fuelField.value = data.fuel_type || '';
                    }
                }
        
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = {
                        plate_number: plateField.value,
                        make: makeField.value,
                        model: modelField.value,
                        year_model: yearField.value ? Number(yearField.value) : null,
                        fuel_type: fuelField.value,
                lguId: getCurrentLguId() // Attach current LGU
                    };
        
                    const id = idField.value;
                    let success = false;
                    if (id) {
                success = await window.updateVehicle(id, formData);
                    } else {
                success = await window.createVehicle(formData);
                    }
        
                    if (success) {
                        location.hash = '#/vehicles'; // Redirect on success
                    } else {
                        alert('There was an error saving the data.');
                    }
                });
            }