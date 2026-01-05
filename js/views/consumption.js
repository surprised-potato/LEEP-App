import { getCurrentLguId } from './state.js';

export async function initConsumptionPage() {
                // Helper to populate Year and Month dropdowns
                const populateDateSelects = (yearId, monthId) => {
                    const yearSelect = document.getElementById(yearId);
                    const monthSelect = document.getElementById(monthId);
                    if (!yearSelect || !monthSelect) return;

                    const currentYear = new Date().getFullYear();
                    yearSelect.innerHTML = '';
                    for (let i = currentYear; i >= currentYear - 10; i--) {
                        const opt = document.createElement('option');
                        opt.value = i;
                        opt.textContent = i;
                        yearSelect.appendChild(opt);
                    }

                    const months = [
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    monthSelect.innerHTML = '';
                    months.forEach((m, i) => {
                        const opt = document.createElement('option');
                        opt.value = i + 1;
                        opt.textContent = m;
                        monthSelect.appendChild(opt);
                    });
                };

                populateDateSelects('mecr-year', 'mecr-month');
                populateDateSelects('mfcr-year', 'mfcr-month');

                // --- MECR (Electricity) Logic ---
                const mecrBuildingSelect = document.getElementById('mecrBuildingSelect');
                const mecrContentArea = document.getElementById('mecr-content-area');
                const mecrTableBody = document.getElementById('mecr-table-body');
                const mecrForm = document.getElementById('mecr-form');
                let currentMecrReports = [];

        const buildings = await window.getFsbdList();
        const currentLguId = getCurrentLguId();
                const filteredBuildings = currentLguId ? buildings.filter(b => b.lguId === currentLguId || !b.lguId) : buildings;
                mecrBuildingSelect.innerHTML += filteredBuildings.map(bldg => `<option value="${bldg.id}">${bldg.name}</option>`).join('');

                async function renderMecrReports(buildingId) {
            currentMecrReports = await window.getMecrReports(buildingId);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    mecrTableBody.innerHTML = currentMecrReports.length > 0
                        ? currentMecrReports.map(r => `<tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.reporting_year}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${months[r.reporting_month - 1] || r.reporting_month}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.electricity_consumption_kwh}</td>
                        </tr>`).join('')
                        : '<tr><td colspan="3" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">No reports found.</td></tr>';
                }

                mecrBuildingSelect.addEventListener('change', async () => {
                    const selectedBuildingId = mecrBuildingSelect.value;
                    if (selectedBuildingId) {
                        mecrContentArea.classList.remove('hidden');
                        await renderMecrReports(selectedBuildingId);
                    } else {
                        mecrContentArea.classList.add('hidden');
                    }
                });

                mecrForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectedBuildingId = mecrBuildingSelect.value;
                    if (!selectedBuildingId) return alert('Please select a building first.');
                    
                    const year = Number(document.getElementById('mecr-year').value);
                    const month = Number(document.getElementById('mecr-month').value);

                    // Validation: Check for duplicate
                    if (currentMecrReports.some(r => r.reporting_year === year && r.reporting_month === month)) {
                        alert('A report for this month and year already exists.');
                        return;
                    }

                    const reportData = {
                        fsbdId: selectedBuildingId,
                        reporting_year: year,
                        reporting_month: month,
                        electricity_consumption_kwh: Number(document.getElementById('mecr-kwh').value),
                    };

            if (await window.createMecrReport(reportData)) {
                        mecrForm.reset();
                        await renderMecrReports(selectedBuildingId);
                    } else {
                        alert('Error saving electricity report.');
                    }
                });

                // --- MFCR (Fuel) Logic ---
                const mfcrVehicleSelect = document.getElementById('mfcrVehicleSelect');
                const mfcrContentArea = document.getElementById('mfcr-content-area');
                const mfcrTableBody = document.getElementById('mfcr-table-body');
                const mfcrForm = document.getElementById('mfcr-form');
                let currentMfcrReports = [];

        const vehicles = await window.getVehicleList();
        // const currentLguId = getCurrentLguId(); // already defined
                const filteredVehicles = currentLguId ? vehicles.filter(v => v.lguId === currentLguId || !v.lguId) : vehicles;
                mfcrVehicleSelect.innerHTML += filteredVehicles.map(v => `<option value="${v.id}">${v.plate_number} - ${v.make} ${v.model}</option>`).join('');
                
                async function renderMfcrReports(vehicleId) {
            currentMfcrReports = await window.getMfcrReports(vehicleId);
                    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    mfcrTableBody.innerHTML = currentMfcrReports.length > 0
                        ? currentMfcrReports.map(r => `<tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.reporting_year}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${months[r.reporting_month - 1] || r.reporting_month}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.fuel_consumed_liters}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.distance_traveled_km || 'N/A'}</td>
                        </tr>`).join('')
                        : '<tr><td colspan="4" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">No reports found.</td></tr>';
                }

                mfcrVehicleSelect.addEventListener('change', async () => {
                    const selectedVehicleId = mfcrVehicleSelect.value;
                    if (selectedVehicleId) {
                        mfcrContentArea.classList.remove('hidden');
                        await renderMfcrReports(selectedVehicleId);
                    } else {
                        mfcrContentArea.classList.add('hidden');
                    }
                });

                mfcrForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectedVehicleId = mfcrVehicleSelect.value;
                    if (!selectedVehicleId) return alert('Please select a vehicle first.');

                    const year = Number(document.getElementById('mfcr-year').value);
                    const month = Number(document.getElementById('mfcr-month').value);

                    // Validation: Check for duplicate
                    if (currentMfcrReports.some(r => r.reporting_year === year && r.reporting_month === month)) {
                        alert('A report for this month and year already exists.');
                        return;
                    }

                    const reportData = {
                        vehicleId: selectedVehicleId,
                        reporting_year: year,
                        reporting_month: month,
                        fuel_consumed_liters: Number(document.getElementById('mfcr-liters').value),
                        distance_traveled_km: Number(document.getElementById('mfcr-distance').value) || null,
                    };

            if (await window.createMfcrReport(reportData)) {
                        mfcrForm.reset();
                        await renderMfcrReports(selectedVehicleId);
                    } else {
                        alert('Error saving fuel report.');
                    }
                });
}