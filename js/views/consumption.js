import { getCurrentLguId, checkPermission } from './state.js';

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

                // --- Trip Tickets Logic ---
                const ttVehicleSelect = document.getElementById('ttVehicleSelect');
                const ttContentArea = document.getElementById('tt-content-area');
                const ttTableBody = document.getElementById('tt-table-body');
                const ttForm = document.getElementById('tt-form');
                let currentTripTickets = [];

                const canWrite = checkPermission('consumption', 'write');
                [mecrForm, ttForm].forEach(form => {
                    if (form) {
                        const submitBtn = form.querySelector('button[type="submit"]');
                        if (submitBtn) submitBtn.disabled = !canWrite;
                        if (submitBtn && !canWrite) {
                            submitBtn.classList.add('opacity-50', 'cursor-not-allowed', 'hidden');
                            form.querySelectorAll('input, select').forEach(el => el.disabled = true);

                             // Add a notice
                             const notice = document.createElement('div');
                             notice.className = 'bg-amber-50 border border-amber-200 text-amber-700 p-3 mb-4 rounded text-xs';
                             notice.innerHTML = '<strong>Read-Only:</strong> You do not have write access to consumption reports.';
                             form.prepend(notice);
                        }
                    }
                });

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

        const vehicles = await window.getVehicleList();
        // const currentLguId = getCurrentLguId(); // already defined
                const filteredVehicles = currentLguId ? vehicles.filter(v => v.lguId === currentLguId || !v.lguId) : vehicles;
                ttVehicleSelect.innerHTML += filteredVehicles.map(v => `<option value="${v.id}">${v.plate_number} - ${v.make} ${v.model}</option>`).join('');
                
                async function renderTripTickets(vehicleId) {
            currentTripTickets = await window.getTripTickets(vehicleId);
                    ttTableBody.innerHTML = currentTripTickets.length > 0
                        ? currentTripTickets.map(t => `<tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${t.date}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${t.driver}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${t.destination}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${t.fuelLiters}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">₱${(t.fuelCost || 0).toLocaleString()}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${t.odometerEnd - t.odometerStart}</td>
                        </tr>`).join('')
                        : '<tr><td colspan="6" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">No trip tickets found.</td></tr>';
                }

                ttVehicleSelect.addEventListener('change', async () => {
                    const selectedVehicleId = ttVehicleSelect.value;
                    if (selectedVehicleId) {
                        ttContentArea.classList.remove('hidden');
                        await renderTripTickets(selectedVehicleId);
                    } else {
                        ttContentArea.classList.add('hidden');
                    }
                });

                ttForm.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const selectedVehicleId = ttVehicleSelect.value;
                    if (!selectedVehicleId) return alert('Please select a vehicle first.');

                    const odoStart = Number(document.getElementById('tt-odo-start').value);
                    const odoEnd = Number(document.getElementById('tt-odo-end').value);

                    if (odoEnd <= odoStart) {
                        return alert('Odometer End must be strictly greater than Odometer Start.');
                    }

                    const ticketData = {
                        vehicleId: selectedVehicleId,
                        date: document.getElementById('tt-date').value,
                        driver: document.getElementById('tt-driver').value,
                        destination: document.getElementById('tt-destination').value,
                        purpose: document.getElementById('tt-purpose').value,
                        odometerStart: odoStart,
                        odometerEnd: odoEnd,
                        fuelLiters: Number(document.getElementById('tt-fuel').value),
                        fuelCost: Number(document.getElementById('tt-cost').value)
                    };

            if (await window.createTripTicket(ticketData)) {
                        ttForm.reset();
                        await renderTripTickets(selectedVehicleId);
                    } else {
                        alert('Error saving Trip Ticket.');
                    }
                });
}