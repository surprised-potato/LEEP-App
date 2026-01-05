import { initLguSelector } from '../app.js';

export async function renderLguList() {
                const tableBody = document.getElementById('lgu-table-body');
                if (!tableBody) return;
                
        const lgus = await window.getLguList();
        
                if (lgus.length > 0) {
                    tableBody.innerHTML = lgus.map(lgu => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${lgu.name}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${lgu.region || ''}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${lgu.province || ''}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="#/lgus/edit/${lgu.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">No LGUs found. Add one!</td></tr>';
                }
            }
        
export async function initLguForm(docId = null) {
                const form = document.getElementById('lgu-form');
                if (!form) return;
                
                const title = document.getElementById('form-title');
                const idField = document.getElementById('lgu-id');
                const nameField = document.getElementById('name');
                const regionField = document.getElementById('region');
                const provinceField = document.getElementById('province');
        
                if (docId) {
                    title.textContent = 'Edit LGU';
            const data = await window.getLguById(docId);
                    if (data) {
                        idField.value = data.id;
                        nameField.value = data.name || '';
                        regionField.value = data.region || '';
                        provinceField.value = data.province || '';
                    }
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
                success = await window.updateLgu(id, formData);
                    } else {
                success = await window.createLgu(formData);
                    }
        
                    if (success) {
                        await initLguSelector(); // Refresh the navbar selector
                        location.hash = '#/lgus';
                    } else {
                        alert('There was an error saving the LGU.');
                    }
                });
}