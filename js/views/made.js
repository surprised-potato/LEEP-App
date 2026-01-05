import { getCurrentLguId } from './state.js';

export async function renderMadeList() {
                const tableBody = document.getElementById('made-table-body');
                if (!tableBody) return;
        
        let madeList = await window.getMadeList();
        let buildings = await window.getFsbdList();

                // Filter buildings by LGU, then filter MADE items that belong to those buildings
        const currentLguId = getCurrentLguId();
                if (currentLguId) buildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
                const allowedBuildingIds = new Set(buildings.map(b => b.id));
                madeList = madeList.filter(m => allowedBuildingIds.has(m.fsbdId));

                const buildingMap = buildings.reduce((map, bldg) => {
                    map[bldg.id] = bldg.name;
                    return map;
                }, {});
        
                if (madeList.length > 0) {
                    tableBody.innerHTML = madeList.map(made => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${made.description_of_equipment}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${made.energy_use_category}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${made.location}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${buildingMap[made.fsbdId] || 'N/A'}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="#/made/edit/${made.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No equipment found. Add some!</td></tr>';
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