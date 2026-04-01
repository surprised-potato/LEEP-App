import { initOrganizationSelector } from '../app.js';
import { checkPermission } from './state.js';

// --- Module-level state for search, sort, and data ---
let fullOrganizationList = [];
let currentSort = { column: 'name', direction: 'asc' };
let currentSearchTerm = '';

/**
 * Filters and sorts the full list based on current state.
 */
function getProcessedList() {
    let processedList = fullOrganizationList;

    // 1. Filter by search term
    if (currentSearchTerm) {
        const lowercasedTerm = currentSearchTerm.toLowerCase();
        processedList = fullOrganizationList.filter(organization => 
            (organization.name || '').toLowerCase().includes(lowercasedTerm) ||
            (organization.region || '').toLowerCase().includes(lowercasedTerm) ||
            (organization.province || '').toLowerCase().includes(lowercasedTerm)
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
 * Renders the Organization table based on the current state.
 */
function renderOrganizationTable() {
    const tableBody = document.getElementById('organization-table-body');
    if (!tableBody) return;

    const processedList = getProcessedList();

    if (processedList.length > 0) {
        tableBody.innerHTML = processedList.map(organization => `
            <tr>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${organization.name}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${organization.region || ''}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${organization.province || ''}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    <a href="#/organizations/edit/${organization.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                </td>
            </tr>
        `).join('');
    } else {
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center py-4">${currentSearchTerm ? 'No Organizations match your search.' : 'No Organizations found. Add one!'}</td></tr>`;
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

export async function renderOrganizationList() {
    const tableBody = document.getElementById('organization-table-body');
    if (!tableBody) return;

    // Reset state for this view
    currentSearchTerm = '';
    currentSort = { column: 'name', direction: 'asc' };
    
    // Initial loading state
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...</td></tr>';
            
    fullOrganizationList = await window.getOrganizationList();
    
    // Initial render
    renderOrganizationTable();

    // Setup search listener
    const searchInput = document.getElementById('organization-search');
    if (searchInput) {
        searchInput.value = ''; // Clear on load
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            renderOrganizationTable();
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
            renderOrganizationTable();
        });
    });
}
        
export async function initOrganizationForm(docId = null) {
                const form = document.getElementById('organization-form');
                if (!form) return;
                
                const title = document.getElementById('form-title');
                const idField = document.getElementById('organization-id');
                const nameField = document.getElementById('name');
                const regionField = document.getElementById('region');
                const provinceField = document.getElementById('province');
        
        if (docId) {
            title.textContent = 'Edit Organization';
            const data = await window.getOrganizationById(docId);
            if (data) {
                idField.value = data.id;
                nameField.value = data.name || '';
                regionField.value = data.region || '';
                provinceField.value = data.province || '';
            }
        }

        // Read-only check - Only System Admins can manage Organizations
        if (!checkPermission('organizations', 'write')) {
            form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.classList.add('hidden');
            
            // Add a notice
            const notice = document.createElement('div');
            notice.className = 'bg-amber-50 border border-amber-200 text-amber-700 p-4 mb-6 rounded-lg text-sm';
            notice.innerHTML = '<strong>Read-Only Mode:</strong> Organization management is restricted to System Administrators.';
            form.prepend(notice);
            return; // Don't attach submit listener
        }
        
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = {
                        name: nameField.value,
                        region: regionField.value,
                        province: provinceField.value
                    };
        
                    const id = idField.value;
                    let success = false;
                    if (id) {
                success = await window.updateOrganization(id, formData);
                    } else {
                success = await window.createOrganization(formData);
                    }
        
                    if (success) {
                        await initOrganizationSelector(); // Refresh the navbar selector
                        location.hash = '#/organizations';
                    } else {
                        alert('There was an error saving the Organization.');
                    }
                });
}