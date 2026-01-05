import { getCurrentLguId, checkPermission } from './state.js';

// --- Module-level state for search, sort, and data ---
let fullMadeList = [];
let buildingMap = {};
let currentSort = { column: 'description_of_equipment', direction: 'asc' };
let currentSearchTerm = '';

/**
 * Filters and sorts the full list based on current state.
 * @returns {Array} The processed list of equipment.
 */
function getProcessedList() {
    let processedList = fullMadeList;

    // 1. Filter by search term
    if (currentSearchTerm) {
        const lowercasedTerm = currentSearchTerm.toLowerCase();
        processedList = fullMadeList.filter(made => 
            (made.description_of_equipment || '').toLowerCase().includes(lowercasedTerm) ||
            (made.energy_use_category || '').toLowerCase().includes(lowercasedTerm) ||
            (made.location || '').toLowerCase().includes(lowercasedTerm) ||
            (buildingMap[made.fsbdId] || '').toLowerCase().includes(lowercasedTerm)
        );
    }

    // 2. Sort the list
    processedList.sort((a, b) => {
        const col = currentSort.column;
        let valA, valB;

        if (col === 'building') {
            valA = buildingMap[a.fsbdId] || '';
            valB = buildingMap[b.fsbdId] || '';
        } else {
            valA = a[col];
            valB = b[col];
        }

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
 * Renders the equipment table based on the current state.
 */
function renderMadeTable() {
    const tableBody = document.getElementById('made-table-body');
    if (!tableBody) return;

    const processedList = getProcessedList();

    if (processedList.length > 0) {
        tableBody.innerHTML = processedList.map(made => {
            const monthlyConsumption = (made.energy_consumption_kwh_per_month != null)
                ? made.energy_consumption_kwh_per_month.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : 'N/A';
            return `
            <tr>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${made.description_of_equipment}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${made.energy_use_category}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${made.location}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right font-mono">${monthlyConsumption}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${buildingMap[made.fsbdId] || 'N/A'}</td>
                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    ${checkPermission('made', 'write') ? `
                        <a href="#/made/edit/${made.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                    ` : '<span class="text-gray-400 italic text-xs">Read Only</span>'}
                </td>
            </tr>
        `}).join('');
    } else {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4">${currentSearchTerm ? 'No equipment matches your search.' : 'No equipment found. Add some!'}</td></tr>`;
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

export async function renderMadeList() {
                const tableBody = document.getElementById('made-table-body');
                if (!tableBody) return;
        
        // Reset state for this view
        currentSearchTerm = '';
        currentSort = { column: 'description_of_equipment', direction: 'asc' };

        // Initial loading state
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Loading...</td></tr>';

        // Handle Add Button visibility
        const addBtn = document.getElementById('btn-add-made');
        if (addBtn) {
            addBtn.classList.toggle('hidden', !checkPermission('made', 'write'));
        }

        let madeData = await window.getMadeList();
        let buildings = await window.getFsbdList();

                // Filter buildings by LGU, then filter MADE items that belong to those buildings
        const currentLguId = getCurrentLguId();
                if (currentLguId) buildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
                const allowedBuildingIds = new Set(buildings.map(b => b.id));
        fullMadeList = madeData.filter(m => allowedBuildingIds.has(m.fsbdId));

        buildingMap = buildings.reduce((map, bldg) => {
                    map[bldg.id] = bldg.name;
                    return map;
                }, {});
        
        // Initial render
        renderMadeTable();

        // Setup search listener
        const searchInput = document.getElementById('made-search');
        if (searchInput) {
            searchInput.value = ''; // Clear on load
            searchInput.addEventListener('input', (e) => {
                currentSearchTerm = e.target.value;
                renderMadeTable();
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
                renderMadeTable();
            });
        });

                const printBtn = document.getElementById('btn-print-made');
                if (printBtn) {
                    printBtn.addEventListener('click', async () => {
                        const printArea = document.getElementById('print-area');
                        if (!printArea) return;

                        // 1. Get LGU Info
                        const lgus = await window.getLguList();
                        const currentLguId = getCurrentLguId();
                        const currentLgu = lgus.find(l => l.id === currentLguId);
                        const lguName = currentLgu ? currentLgu.name : 'All LGUs';
                        const generationDate = new Date().toLocaleDateString('en-US', {
                            year: 'numeric', month: 'long', day: 'numeric'
                        });

                        const displayedList = getProcessedList();

                        // 2. Calculate Summaries
                        const totalCount = displayedList.length;
                        const totalConsumption = displayedList.reduce((sum, made) => {
                            return sum + (made.energy_consumption_kwh_per_month || 0);
                        }, 0);

                        // 3. Build Print HTML
                        const tableRows = displayedList.map(made => {
                            const monthlyConsumption = made.energy_consumption_kwh_per_month || 0;
                            return `
                                <tr>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${made.description_of_equipment || 'N/A'}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${made.energy_use_category || 'N/A'}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${made.location || 'N/A'}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${monthlyConsumption.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td style="border: 1px solid #ddd; padding: 8px;">${buildingMap[made.fsbdId] || 'N/A'}</td>
                                </tr>
                            `;
                        }).join('');

                        const printHTML = `
                            <div style="font-family: sans-serif;">
                                <div style="margin-bottom: 2rem; text-align: center;">
                                    <h1 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 0.25rem;">Major Appliance and Device Equipment (MADE) Report</h1>
                                    <p style="color: #555;">An inventory of major energy-consuming devices.</p>
                                </div>
                                <div style="margin-bottom: 1.5rem; font-size: 0.9rem;">
                                    <p><strong>LGU:</strong> ${lguName}</p>
                                    <p><strong>Date Generated:</strong> ${generationDate}</p>
                                </div>
                                <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem;">
                                    <thead>
                                        <tr>
                                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Description</th>
                                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Category</th>
                                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Location</th>
                                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right; background-color: #f2f2f2;">Est. Monthly Consumption (kWh)</th>
                                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f2f2f2;">Building</th>
                                        </tr>
                                    </thead>
                                    <tbody>${tableRows.length > 0 ? tableRows : '<tr><td colspan="5" style="text-align: center; padding: 1rem;">No equipment to display.</td></tr>'}</tbody>
                                </table>
                                <div style="margin-top: 2rem; padding-top: 1rem; border-top: 2px solid #333; font-size: 0.9rem;">
                                    <h2 style="font-size: 1.1rem; font-weight: bold; margin-bottom: 0.5rem;">Summary</h2>
                                    <p><strong>Total Count of MADE:</strong> ${totalCount}</p>
                                    <p><strong>Total Estimated Monthly Consumption:</strong> ${totalConsumption.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kWh</p>
                                </div>
                            </div>
                        `;
                        printArea.innerHTML = printHTML;
                        window.print();
                    });
                }
            }
        
export async function initMadeForm(docId = null) {
                const form = document.getElementById('made-form');
                if (!form) return;
        
                const idField = document.getElementById('made-id');
                const buildingField = document.getElementById('fsbdId');
                const descriptionField = document.getElementById('description_of_equipment');
                const categoryField = document.getElementById('energy_use_category');
                const locationField = document.getElementById('location');
                const powerField = document.getElementById('power_rating_kw');
                const hoursField = document.getElementById('time_of_use_hours_per_day');
        
                // Populate building dropdown
        const buildings = await window.getFsbdList();
                // Only show buildings for current LGU in dropdown
        const currentLguId = getCurrentLguId();
                const filteredBuildings = currentLguId ? buildings.filter(b => b.lguId === currentLguId) : buildings;
                
                buildingField.innerHTML += filteredBuildings.map(bldg => `<option value="${bldg.id}">${bldg.name}</option>`).join('');
        
                if (docId) {
                    // EDIT MODE
            const data = await window.getMadeById(docId);
                    if (data) {
                        idField.value = data.id;
                        buildingField.value = data.fsbdId || '';
                        descriptionField.value = data.description_of_equipment || '';
                        categoryField.value = data.energy_use_category || '';
                        locationField.value = data.location || '';
                        powerField.value = data.power_rating_kw || '';
                        hoursField.value = data.time_of_use_hours_per_day || '';
                    }
                }
        
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const formData = {
                        fsbdId: buildingField.value,
                        description_of_equipment: descriptionField.value,
                        energy_use_category: categoryField.value,
                        location: locationField.value,
                        power_rating_kw: powerField.value ? Number(powerField.value) : null,
                        time_of_use_hours_per_day: hoursField.value ? Number(hoursField.value) : null,
                    };
        
                    // Pre-calculate monthly consumption as per PRD
                    const power = formData.power_rating_kw;
                    const hours = formData.time_of_use_hours_per_day;
                    if (power && hours) {
                        formData.energy_consumption_kwh_per_month = power * hours * 30;
                    } else {
                        formData.energy_consumption_kwh_per_month = null;
                    }

                    const id = idField.value;
                    let success = false;
                    if (id) {
                success = await window.updateMade(id, formData);
                    } else {
                success = await window.createMade(formData);
                    }
        
                    if (success) {
                        location.hash = '#/made'; // Redirect on success
                    } else {
                        alert('There was an error saving the data.');
                    }
                });
}