import { getCurrentLguId } from './state.js';

export async function renderVehicleList() {
                const tableBody = document.getElementById('vehicle-table-body');
                if (!tableBody) return;
                
        let vehicles = await window.getVehicleList();

                // Filter by Current LGU
        const currentLguId = getCurrentLguId();
        if (currentLguId) vehicles = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
        
                if (vehicles.length > 0) {
                    tableBody.innerHTML = vehicles.map(vehicle => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.plate_number}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.make}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.model}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${vehicle.fuel_type}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="#/vehicles/edit/${vehicle.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No vehicles found. Add one!</td></tr>';
                }
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