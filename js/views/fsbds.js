import { getCurrentLguId } from './state.js';

export async function renderFsbdList() {
                const tableBody = document.getElementById('fsbd-table-body');
                if (!tableBody) return;
                
        let fsbds = await window.getFsbdList();
                
                // Filter by Current LGU
        const currentLguId = getCurrentLguId();
        if (currentLguId) fsbds = fsbds.filter(f => f.lguId === currentLguId || !f.lguId);
        
                if (fsbds.length > 0) {
                    tableBody.innerHTML = fsbds.map(fsbd => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${fsbd.name}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${fsbd.fsbd_type}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${fsbd.address}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="#/fsbds/edit/${fsbd.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                                <!-- Delete button can be added here -->
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No buildings found. Add one!</td></tr>';
                }
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