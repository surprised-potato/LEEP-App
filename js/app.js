// --- GLOBAL STATE ---
// Ensure localStorage is available (for testing environments)
let currentLguId = (typeof localStorage !== 'undefined') ? localStorage.getItem('currentLguId') : null;
let currentLoadId = 0; // Track the latest view load request

// --- FUNCTIONS ---

async function initLguSelector() {
    if (typeof document !== 'undefined') {
        const selector = document.getElementById('lgu-selector');
        const headerLguName = document.getElementById('header-lgu-name');
        const lgus = await getLguList();

        if (lgus.length > 0) {
            selector.innerHTML = lgus.map(lgu => `<option value="${lgu.id}">${lgu.name}</option>`).join('');
            
            // Set initial value
            if (currentLguId && lgus.find(l => l.id === currentLguId)) {
                selector.value = currentLguId;
            } else {
                // Default to first LGU if none selected or invalid
                currentLguId = lgus[0].id;
                localStorage.setItem('currentLguId', currentLguId);
                selector.value = currentLguId;
            }

            const updateHeaderText = () => {
                if (headerLguName) {
                    const selected = lgus.find(l => l.id === currentLguId);
                    headerLguName.textContent = selected ? selected.name : 'Select LGU';
                }
            };
            updateHeaderText();

            selector.addEventListener('change', (e) => {
                currentLguId = e.target.value;
                localStorage.setItem('currentLguId', currentLguId);
                updateHeaderText();
                handleRouting(); // Reload current view with new filter
            });
        } else {
            selector.innerHTML = '<option value="">No LGUs Found</option>';
            if (headerLguName) headerLguName.textContent = 'No LGUs Found';
        }
    }
}

async function handleRouting() {
    if (typeof location !== 'undefined') {
        const path = location.hash.slice(1) || '/dashboard';
        const fullHash = location.hash || '#/dashboard';

        // Update Sidebar Active State
        const navLinks = document.querySelectorAll('aside nav a');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            let isActive = false;
            
            if (href === '#/dashboard') isActive = (fullHash === '#/dashboard' || fullHash === '');
            else isActive = fullHash.startsWith(href);

            if (isActive) {
                link.classList.remove('hover:bg-gray-700', 'hover:text-white');
                link.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-indigo-700', 'text-white', 'shadow-md');
            } else {
                link.classList.add('hover:bg-gray-700', 'hover:text-white');
                link.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-indigo-700', 'text-white', 'shadow-md');
            }
        });

        const parts = path.split('/');
        
        let viewPath = '';
        let params = null;

        if (path === '/dashboard') {
            viewPath = 'views/dashboard.html';
            await loadContent(viewPath, renderDashboard);
        } else if (path === '/lgus') {
            viewPath = 'views/lgu-list.html';
            await loadContent(viewPath, renderLguList);
        } else if (path === '/lgus/new') {
            viewPath = 'views/lgu-form.html';
            await loadContent(viewPath, initLguForm);
        } else if (parts[1] === 'lgus' && parts[2] === 'edit' && parts[3]) {
            viewPath = 'views/lgu-form.html';
            params = { id: parts[3] };
            await loadContent(viewPath, () => initLguForm(params.id));
        } else if (path === '/fsbds') {
            viewPath = 'views/fsbd-list.html';
            await loadContent(viewPath, renderFsbdList);
        } else if (path === '/fsbds/new') {
            viewPath = 'views/fsbd-form.html';
            await loadContent(viewPath, initFsbdForm);
        } else if (parts[1] === 'fsbds' && parts[2] === 'edit' && parts[3]) {
            viewPath = 'views/fsbd-form.html';
            params = { id: parts[3] };
            await loadContent(viewPath, () => initFsbdForm(params.id));
        } else if (path === '/vehicles') {
            viewPath = 'views/vehicle-list.html';
            await loadContent(viewPath, renderVehicleList);
        } else if (path === '/vehicles/new') {
            viewPath = 'views/vehicle-form.html';
            await loadContent(viewPath, initVehicleForm);
                } else if (parts[1] === 'vehicles' && parts[2] === 'edit' && parts[3]) {
                    viewPath = 'views/vehicle-form.html';
                    params = { id: parts[3] };
                    await loadContent(viewPath, () => initVehicleForm(params.id));
                } else if (path === '/made') {
                    viewPath = 'views/made-list.html';
                    await loadContent(viewPath, renderMadeList);
                } else if (path === '/made/new') {
                    viewPath = 'views/made-form.html';
                    await loadContent(viewPath, initMadeForm);
                } else if (parts[1] === 'made' && parts[2] === 'edit' && parts[3]) {
                    viewPath = 'views/made-form.html';
                    params = { id: parts[3] };
                    await loadContent(viewPath, () => initMadeForm(params.id));
                } else if (path === '/consumption') {
                    viewPath = 'views/consumption.html';
                    await loadContent(viewPath, initConsumptionPage);
                } else if (path === '/seu') {
                    viewPath = 'views/seu.html';
                    await loadContent(viewPath, renderSeuPage);
                } else if (path === '/rios') {
                    viewPath = 'views/rio-list.html';
                    await loadContent(viewPath, renderRioList);
                } else if (path === '/rios/new') {
                    viewPath = 'views/rio-form.html';
                    await loadContent(viewPath, initRioForm);
                } else if (parts[1] === 'rios' && parts[2] === 'edit' && parts[3]) {
                    viewPath = 'views/rio-form.html';
                    params = { id: parts[3] };
                    await loadContent(viewPath, () => initRioForm(params.id));
                } else if (path === '/ppas') {
                    viewPath = 'views/ppa-list.html';
                    await loadContent(viewPath, renderPpaList);
                } else if (path === '/ppas/new') {
                    viewPath = 'views/ppa-form.html';
                    await loadContent(viewPath, initPpaForm);
                } else if (parts[1] === 'ppas' && parts[2] === 'edit' && parts[3]) {
                    viewPath = 'views/ppa-form.html';
                    params = { id: parts[3] };
                    await loadContent(viewPath, () => initPpaForm(params.id));
                } else if (path === '/reporting') {
                    viewPath = 'views/reporting.html';
                    await loadContent(viewPath, renderReporting);
                } else if (path === '/admin') {
                    viewPath = 'views/admin.html';
                    await loadContent(viewPath, renderAdmin);
                } else if (path === '/manual') {
                    viewPath = 'views/user-manual.html';
                    await loadContent(viewPath);
                } else {
                    const appContent = document.getElementById('app-content');
                    if (appContent) {
                        appContent.innerHTML = '<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>';
                    }
                    return;
                }
            }
}
        
            async function loadContent(path, onContentReady) {
                const appContent = document.getElementById('app-content');
                if (!appContent) return;
                
                const myLoadId = ++currentLoadId; // Increment and capture ID for this request

                try {
                    // Fetch content first before clearing DOM
                    const response = await fetch(`${path}?t=${Date.now()}`);
                    if (!response.ok) throw new Error(`Could not load ${path}`);
                    const html = await response.text();

                    // If a newer request has started, ignore this one
                    if (myLoadId !== currentLoadId) return;

                    appContent.innerHTML = html;

                    // Apply gradient style to headers dynamically for views not manually updated
                    appContent.querySelectorAll('.bg-gray-50.border-b.border-gray-200').forEach(header => {
                        if (header.querySelector('h1, h2, h3')) {
                            header.classList.remove('bg-gray-50');
                            header.classList.add('hero-header');
                            const title = header.querySelector('h1, h2, h3');
                            if (title) {
                                title.classList.remove('text-gray-800');
                            }
                        }
                    });
                    
                    if (onContentReady) {
                        await onContentReady(myLoadId); 
                    }
                } catch (error) {
                    // Only show error if this is still the active request
                    if (myLoadId === currentLoadId) {
                        console.error('Error loading view:', error);
                        appContent.innerHTML = '<h1>Error</h1><p>Could not load page content.</p>';
                    }
                }
            }
        
            // --- RENDER FUNCTIONS (LGU) ---
            async function renderLguList() {
                const tableBody = document.getElementById('lgu-table-body');
                if (!tableBody) return;
                
                const lgus = await getLguList();
        
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
        
            async function initLguForm(docId = null) {
                const form = document.getElementById('lgu-form');
                if (!form) return;
                
                const title = document.getElementById('form-title');
                const idField = document.getElementById('lgu-id');
                const nameField = document.getElementById('name');
                const regionField = document.getElementById('region');
                const provinceField = document.getElementById('province');
        
                if (docId) {
                    title.textContent = 'Edit LGU';
                    const data = await getLguById(docId);
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
                        success = await updateLgu(id, formData);
                    } else {
                        success = await createLgu(formData);
                    }
        
                    if (success) {
                        await initLguSelector(); // Refresh the navbar selector
                        location.hash = '#/lgus';
                    } else {
                        alert('There was an error saving the LGU.');
                    }
                });
}


async function renderFsbdList() {
                const tableBody = document.getElementById('fsbd-table-body');
                if (!tableBody) return;
                
                let fsbds = await getFsbdList();
                
                // Filter by Current LGU
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
        
            async function initFsbdForm(docId = null) {
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
                    const data = await getFsbdById(docId);
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
                        lguId: currentLguId // Attach current LGU
                    };
        
                    const id = idField.value;
                    let success = false;
                    if (id) {
                        success = await updateFsbd(id, formData);
                    } else {
                        success = await createFsbd(formData);
                    }
        
                    if (success) {
                        location.hash = '#/fsbds'; // Redirect on success
                    } else {
                        alert('There was an error saving the data.');
                    }
                });
            }
        
            // --- RENDER FUNCTIONS (Vehicles) ---
            async function renderVehicleList() {
                const tableBody = document.getElementById('vehicle-table-body');
                if (!tableBody) return;
                
                let vehicles = await getVehicleList();

                // Filter by Current LGU
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
        
            async function initVehicleForm(docId = null) {
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
                    const data = await getVehicleById(docId);
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
                        lguId: currentLguId // Attach current LGU
                    };
        
                    const id = idField.value;
                    let success = false;
                    if (id) {
                        success = await updateVehicle(id, formData);
                    } else {
                        success = await createVehicle(formData);
                    }
        
                    if (success) {
                        location.hash = '#/vehicles'; // Redirect on success
                    } else {
                        alert('There was an error saving the data.');
                    }
                });
            }
        
            // --- RENDER FUNCTIONS (MADE) ---
            async function renderMadeList() {
                const tableBody = document.getElementById('made-table-body');
                if (!tableBody) return;
        
                let madeList = await getMadeList();
                let buildings = await getFsbdList();

                // Filter buildings by LGU, then filter MADE items that belong to those buildings
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
        
            async function initMadeForm(docId = null) {
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
                const buildings = await getFsbdList();
                // Only show buildings for current LGU in dropdown
                const filteredBuildings = currentLguId ? buildings.filter(b => b.lguId === currentLguId) : buildings;
                
                buildingField.innerHTML += filteredBuildings.map(bldg => `<option value="${bldg.id}">${bldg.name}</option>`).join('');
        
                if (docId) {
                    // EDIT MODE
                    const data = await getMadeById(docId);
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
                        success = await updateMade(id, formData);
                    } else {
                        success = await createMade(formData);
                    }
        
                    if (success) {
                        location.hash = '#/made'; // Redirect on success
                    } else {
                        alert('There was an error saving the data.');
                    }
                });
}

async function initConsumptionPage() {
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

                const buildings = await getFsbdList();
                const filteredBuildings = currentLguId ? buildings.filter(b => b.lguId === currentLguId || !b.lguId) : buildings;
                mecrBuildingSelect.innerHTML += filteredBuildings.map(bldg => `<option value="${bldg.id}">${bldg.name}</option>`).join('');

                async function renderMecrReports(buildingId) {
                    currentMecrReports = await getMecrReports(buildingId);
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

                    if (await createMecrReport(reportData)) {
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

                const vehicles = await getVehicleList();
                const filteredVehicles = currentLguId ? vehicles.filter(v => v.lguId === currentLguId || !v.lguId) : vehicles;
                mfcrVehicleSelect.innerHTML += filteredVehicles.map(v => `<option value="${v.id}">${v.plate_number} - ${v.make} ${v.model}</option>`).join('');
                
                async function renderMfcrReports(vehicleId) {
                    currentMfcrReports = await getMfcrReports(vehicleId);
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

                    if (await createMfcrReport(reportData)) {
                        mfcrForm.reset();
                        await renderMfcrReports(selectedVehicleId);
                    } else {
                        alert('Error saving fuel report.');
                    }
                });
}

async function renderRioList() {
                const tableBody = document.getElementById('rio-table-body');
                if (!tableBody) return;

                let [rios, buildings, vehicles] = await Promise.all([getRioList(), getFsbdList(), getVehicleList()]);
                
                // Filter Assets by LGU
                if (currentLguId) {
                    buildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
                    vehicles = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
                }

                const allowedBuildingIds = new Set(buildings.map(b => b.id));
                const allowedVehicleIds = new Set(vehicles.map(v => v.id));

                // Filter RIOs that belong to visible assets
                rios = rios.filter(r => allowedBuildingIds.has(r.fsbdId) || allowedVehicleIds.has(r.vehicleId));
                
                const assetMap = {};
                buildings.forEach(b => assetMap[b.id] = `Building: ${b.name}`);
                vehicles.forEach(v => assetMap[v.id] = `Vehicle: ${v.plate_number}`);

                if (rios.length > 0) {
                    tableBody.innerHTML = rios.map(rio => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${rio.proposed_action}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${assetMap[rio.fsbdId || rio.vehicleId] || 'N/A'}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${rio.priority}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${rio.status}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="#/rios/edit/${rio.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No recommendations found.</td></tr>';
                }
}

async function initRioForm(docId = null) {
                // Ensure docId is a string (handle loadContent passing a number)
                if (typeof docId !== 'string') docId = null;

                const form = document.getElementById('rio-form');
                if (!form) return;

                const idField = document.getElementById('rio-id');
                const actionField = document.getElementById('proposed_action');
                const assetTypeField = document.getElementById('assetType');
                const assetIdField = document.getElementById('assetId');
                const priorityField = document.getElementById('priority');
                const statusField = document.getElementById('status');
                const costField = document.getElementById('estimated_cost_php');
                const savingsField = document.getElementById('estimated_savings_php');
                const selectedSeusContainer = document.getElementById('selected-seus-container');

                // Fetch SEUs for dropdown
                const allSeus = await getSeuList();
                let selectedSeuIds = new Set();

                // Helper to render selected SEUs in the form
                const renderSelectedSeus = () => {
                    selectedSeusContainer.innerHTML = '';
                    if (selectedSeuIds.size === 0) {
                        selectedSeusContainer.innerHTML = '<p class="text-gray-400 text-xs italic p-1">Select SEUs from the Reference Data panel.</p>';
                        return;
                    }
                    selectedSeuIds.forEach(id => {
                        const seu = allSeus.find(s => s.id === id);
                        if (!seu) return;
                        const div = document.createElement('div');
                        div.className = 'flex justify-between items-center bg-white border p-2 rounded shadow-sm mb-2';
                        div.innerHTML = `<div class="text-sm">
                            <div class="font-bold text-xs text-gray-500">${seu.energy_use_category}</div>
                            ${seu.finding_description}
                        </div>
                        <button type="button" class="text-red-500 hover:text-red-700 text-xs font-bold btn-remove-seu px-2" data-id="${id}">&times;</button>`;
                        selectedSeusContainer.appendChild(div);
                    });
                    
                    selectedSeusContainer.querySelectorAll('.btn-remove-seu').forEach(btn => {
                        btn.addEventListener('click', (e) => {
                            selectedSeuIds.delete(e.target.dataset.id);
                            renderSelectedSeus();
                            updateContext(); // Refresh context to show "Add" button again
                        });
                    });
                };

                // Placeholder for context updater, defined after refContainer creation
                let updateContext = () => {};

                assetIdField.addEventListener('change', () => updateContext());

                assetTypeField.addEventListener('change', async () => {
                    const type = assetTypeField.value;
                    assetIdField.innerHTML = '<option value="">Loading...</option>';
                    assetIdField.disabled = true;
                    if (type === 'building') {
                        const buildings = await getFsbdList();
                        const filtered = currentLguId ? buildings.filter(b => b.lguId === currentLguId || !b.lguId) : buildings;
                        assetIdField.innerHTML = filtered.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
                        assetIdField.disabled = false;
                        if (filtered.length > 0) assetIdField.value = filtered[0].id;
                    } else if (type === 'vehicle') {
                        const vehicles = await getVehicleList();
                        const filtered = currentLguId ? vehicles.filter(v => v.lguId === currentLguId || !v.lguId) : vehicles;
                        assetIdField.innerHTML = filtered.map(v => `<option value="${v.id}">${v.plate_number}</option>`).join('');
                        assetIdField.disabled = false;
                        if (filtered.length > 0) assetIdField.value = filtered[0].id;
                    } else {
                        assetIdField.innerHTML = '<option>Please select an asset type first</option>';
                    }
                    updateContext();
                });

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    
                    const formData = {
                        proposed_action: actionField.value,
                        priority: priorityField.value,
                        status: statusField.value,
                        estimated_cost_php: Number(costField.value) || null,
                        estimated_savings_php: Number(savingsField.value) || null,
                        fsbdId: assetTypeField.value === 'building' ? assetIdField.value : null,
                        vehicleId: assetTypeField.value === 'vehicle' ? assetIdField.value : null,
                        seuFindingIds: Array.from(selectedSeuIds)
                    };

                    const id = idField.value;
                    let success = false;
                    if (id) {
                        success = await updateRio(id, formData);
                    } else {
                        success = await createRio(formData);
                    }

                    if (success) {
                        location.hash = '#/rios';
                    } else {
                        alert('Error saving recommendation.');
                    }
                });

                // Inject Asset Summary to help identify RIOs
                // Create a grid layout: Form on left, Reference Data on right
                const formCard = form.closest('.bg-white') || form.parentElement;
                
                // Ensure form card fills the grid cell and matches height
                formCard.classList.remove('max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'mx-auto');
                formCard.classList.add('w-full', 'h-full');
                
                // Also remove constraints from the parent container if it exists (e.g. the view wrapper)
                if (formCard.parentElement && formCard.parentElement.id !== 'app-content') {
                    formCard.parentElement.classList.remove('max-w-lg', 'max-w-xl', 'max-w-2xl', 'max-w-3xl', 'mx-auto');
                    formCard.parentElement.classList.add('w-full');
                }

                // Create grid wrapper
                const gridWrapper = document.createElement('div');
                gridWrapper.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 w-full';
                
                // Insert wrapper before formCard
                if (formCard.parentNode) {
                    formCard.parentNode.insertBefore(gridWrapper, formCard);
                    gridWrapper.appendChild(formCard);
                    
                    // Create Reference Data Container
                    const refContainer = document.createElement('div');
                    gridWrapper.appendChild(refContainer);
                    
                    // Define updateContext now that refContainer exists
                    updateContext = () => {
                        renderRioContext(refContainer, assetIdField.value, assetTypeField.value, (seuId) => {
                            if (!selectedSeuIds.has(seuId)) {
                                selectedSeuIds.add(seuId);
                                renderSelectedSeus();
                                updateContext();
                            }
                        }, selectedSeuIds);
                    };

                    // Handle Data Loading (Edit Mode vs Create Mode)
                    if (docId) {
                        // EDIT MODE
                        const data = await getRioById(docId);
                        if (data) {
                            idField.value = data.id;
                            actionField.value = data.proposed_action || '';
                            priorityField.value = data.priority || 'Medium';
                            statusField.value = data.status || 'Identified';
                            costField.value = data.estimated_cost_php || '';
                            savingsField.value = data.estimated_savings_php || '';
                            
                            const assetType = data.fsbdId ? 'building' : 'vehicle';
                            assetTypeField.value = assetType;
                            
                            // Manually populate assets to ensure await finishes before setting value
                            assetIdField.innerHTML = '<option value="">Loading...</option>';
                            assetIdField.disabled = true;
                            
                            let assets = [];
                            if (assetType === 'building') {
                                assets = await getFsbdList();
                            } else {
                                assets = await getVehicleList();
                            }
                            
                            if (currentLguId) {
                                assets = assets.filter(a => a.lguId === currentLguId || !a.lguId);
                            }
                            
                            assetIdField.innerHTML = assets.map(a => `<option value="${a.id}">${a.name || a.plate_number}</option>`).join('');
                            assetIdField.disabled = false;
                            assetIdField.value = data.fsbdId || data.vehicleId || '';

                            if (data.seuFindingIds) {
                                data.seuFindingIds.forEach(id => selectedSeuIds.add(id));
                                renderSelectedSeus();
                            }
                        }
                    }
                    
                    // Initial Render of Context
                    updateContext();
                }
}

async function renderRioContext(container, assetId = null, assetType = null, onAddSeu = null, selectedSeuIds = new Set()) {
    container.innerHTML = '<div class="bg-white shadow rounded-lg p-6"><div class="text-center py-4 text-gray-500">Loading context data...</div></div>';
    
    try {
        if (!window.db) return;

        const [buildings, vehicles, madeList, mecrSnap, mfcrSnap, seuList] = await Promise.all([
            getFsbdList(),
            getVehicleList(),
            getMadeList(),
            window.db.collection('mecr_reports').get(),
            window.db.collection('mfcr_reports').get(),
            getSeuList()
        ]);

        // Filter by LGU
        let filteredBuildings = buildings;
        let filteredVehicles = vehicles;
        
        if (currentLguId) {
            filteredBuildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
            filteredVehicles = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
        }

        const bldgIds = new Set(filteredBuildings.map(b => b.id));
        const vehIds = new Set(filteredVehicles.map(v => v.id));

        const filteredMade = madeList.filter(m => bldgIds.has(m.fsbdId));
        
        const mecr = mecrSnap.docs.map(d => d.data()).filter(r => bldgIds.has(r.fsbdId));
        const mfcr = mfcrSnap.docs.map(d => d.data()).filter(r => vehIds.has(r.vehicleId));

        // Helper to calculate stats
        const calcStats = (reports, key) => {
            if (!reports.length) return { avg: 0, mom: 0, yoy: 0, peak: 0 };
            
            // Sort by date
            const sorted = [...reports].sort((a, b) => (a.reporting_year - b.reporting_year) || (a.reporting_month - b.reporting_month));
            const vals = sorted.map(r => Number(r[key]) || 0);
            
            // Avg & Peak
            const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            const peak = Math.max(...vals);
            
            // MoM (Month-over-Month)
            let momSum = 0, momCnt = 0;
            for (let i = 1; i < vals.length; i++) {
                if (vals[i-1] > 0) { momSum += (vals[i] - vals[i-1]) / vals[i-1]; momCnt++; }
            }
            
            // YoY (Year-over-Year)
            const byYear = {};
            sorted.forEach(r => byYear[r.reporting_year] = (byYear[r.reporting_year] || 0) + (Number(r[key]) || 0));
            const years = Object.keys(byYear).sort();
            let yoySum = 0, yoyCnt = 0;
            for (let i = 1; i < years.length; i++) {
                const prev = byYear[years[i-1]];
                const curr = byYear[years[i]];
                if (prev > 0) { yoySum += (curr - prev) / prev; yoyCnt++; }
            }
            
            return { avg, peak, mom: momCnt ? (momSum / momCnt) * 100 : 0, yoy: yoyCnt ? (yoySum / yoyCnt) * 100 : 0 };
        };

        const bldgStats = filteredBuildings.map(b => {
            const stats = calcStats(mecr.filter(r => r.fsbdId === b.id), 'electricity_consumption_kwh');
            return { id: b.id, name: b.name, ...stats };
        }).sort((a, b) => b.avg - a.avg).slice(0, 3);

        const vehStats = filteredVehicles.map(v => {
            const stats = calcStats(mfcr.filter(r => r.vehicleId === v.id), 'fuel_consumed_liters');
            return { id: v.id, plate: v.plate_number, ...stats };
        }).sort((a, b) => b.avg - a.avg).slice(0, 3);

        const renderTable = (items, nameKey, unit, type) => `
            <div class="overflow-x-auto">
                <table class="min-w-full text-xs">
                    <thead>
                        <tr class="bg-gray-50 border-b">
                            <th class="py-2 text-left text-gray-600">Asset</th>
                            <th class="py-2 text-right text-gray-600">Avg (${unit})</th>
                            <th class="py-2 text-right text-gray-600">Peak</th>
                            <th class="py-2 text-right text-gray-600">MoM%</th>
                            <th class="py-2 text-right text-gray-600">YoY%</th>
                            <th class="py-2 text-center text-gray-600">View Details</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        ${items.map(i => `<tr><td class="py-2 font-medium text-gray-800">${i[nameKey]}</td><td class="py-2 text-right text-gray-600">${i.avg.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td class="py-2 text-right text-gray-600">${i.peak.toLocaleString(undefined,{maximumFractionDigits:0})}</td><td class="py-2 text-right ${i.mom>0?'text-red-500':'text-green-500'}">${i.mom.toFixed(1)}%</td><td class="py-2 text-right ${i.yoy>0?'text-red-500':'text-green-500'}">${i.yoy.toFixed(1)}%</td><td class="py-2 text-center"><button class="text-blue-600 hover:text-blue-800 btn-details" data-id="${i.id}" data-type="${type}" title="View Details"><svg class="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></button></td></tr>`).join('') || '<tr><td colspan="6" class="py-2 text-center text-gray-500">No data</td></tr>'}
                    </tbody>
                </table>
            </div>`;

        // Render as a single card for the column
        container.className = 'bg-white shadow rounded-lg p-6 border-t-4 border-blue-500 h-full flex flex-col gap-6';
        
        let html = `
            <h3 class="text-lg font-bold text-gray-800 mb-4">Reference Data</h3>
            <div class="space-y-6">`;

        if (filteredBuildings.length > 0) {
            html += `<div>
                <h4 class="font-semibold text-gray-700 mb-2">Top Energy Consuming Buildings</h4>
                ${renderTable(bldgStats, 'name', 'kWh', 'building')}
            </div>`;
        }

        if (filteredVehicles.length > 0) {
            html += `<div>
                <h4 class="font-semibold text-gray-700 mb-2">Top Fuel Consuming Vehicles</h4>
                ${renderTable(vehStats, 'plate', 'L', 'vehicle')}
            </div>`;
        }

        if (filteredMade.length > 0) {
            html += `<div class="pt-4 border-t border-gray-200">
                <h4 class="font-semibold text-gray-700 mb-2">Equipment Categories</h4>
                <div class="flex flex-wrap gap-2">
                    ${[...new Set(filteredMade.map(m => m.energy_use_category))].map(c => `<span class="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">${c}</span>`).join('') || '<span class="text-sm text-gray-500">No equipment recorded</span>'}
                </div>
            </div>`;
        }

        // SEU Section
        html += `<div class="pt-4 border-t border-gray-200 flex-1 flex flex-col min-h-0">
            <h4 class="font-semibold text-gray-700 mb-2">Identified SEUs</h4>
            <div class="space-y-2 overflow-y-auto pr-1 max-h-60">`;

        if (assetId) {
            const assetSeus = seuList.filter(s => (assetType === 'building' && s.fsbdId === assetId) || (assetType === 'vehicle' && s.vehicleId === assetId));
            
            if (assetSeus.length > 0) {
                html += assetSeus.map(s => {
                    const isSelected = selectedSeuIds.has(s.id);
                    return `
                    <div class="border rounded p-3 bg-gray-50 flex justify-between items-start">
                        <div>
                            <span class="text-xs font-bold text-indigo-600 block">${s.energy_use_category}</span>
                            <p class="text-sm text-gray-800">${s.finding_description}</p>
                            <p class="text-xs text-gray-500 mt-1">Method: ${s.identification_method}</p>
                        </div>
                        ${isSelected 
                            ? '<span class="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">Added</span>'
                            : `<button type="button" class="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded btn-add-ref-seu" data-id="${s.id}">Add</button>`
                        }
                    </div>
                    `;
                }).join('');
            } else {
                html += '<p class="text-sm text-gray-500 italic">No SEUs identified for this asset.</p>';
            }
        } else {
            html += '<p class="text-sm text-gray-500 italic">Select an asset to view SEUs.</p>';
        }

        html += `</div>
            <div class="mt-2">
                <p class="text-xs text-gray-500">Tip: Go to "SEU Identification" to add more findings.</p>
            </div>
        </div>`;
        container.innerHTML = html;

        // Add event listeners for details buttons
        container.querySelectorAll('.btn-details').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const id = btn.dataset.id;
                const type = btn.dataset.type;
                
                if (type === 'building') {
                    const asset = filteredBuildings.find(b => b.id === id);
                    const reports = mecr.filter(r => r.fsbdId === id);
                    const assetMade = filteredMade.filter(m => m.fsbdId === id);
                    openAssetDetailsModal(asset.name, reports, 'electricity_consumption_kwh', 'kWh', assetMade);
                } else {
                    const asset = filteredVehicles.find(v => v.id === id);
                    const reports = mfcr.filter(r => r.vehicleId === id);
                    openAssetDetailsModal(asset.plate_number, reports, 'fuel_consumed_liters', 'L');
                }
            });
        });

        // Add event listeners for SEU buttons
        container.querySelectorAll('.btn-add-ref-seu').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (onAddSeu) onAddSeu(e.target.dataset.id);
            });
        });
    } catch (error) {
        console.error("Error rendering RIO context:", error);
        container.innerHTML = '<div class="text-red-500">Failed to load context data.</div>';
    }
}

function openAssetDetailsModal(title, reports, valueKey, unit, madeItems = []) {
    // Sort reports descending for table, ascending for chart
    const sortedDesc = [...reports].sort((a, b) => (b.reporting_year - a.reporting_year) || (b.reporting_month - a.reporting_month));
    const sortedAsc = [...reports].sort((a, b) => (a.reporting_year - b.reporting_year) || (a.reporting_month - b.reporting_month));
    
    const values = sortedDesc.map(r => Number(r[valueKey]) || 0);
    
    // Stats
    const total = values.reduce((a, b) => a + b, 0);
    const avg = values.length ? total / values.length : 0;
    const peak = Math.max(...values, 0);
    const min = values.length ? Math.min(...values) : 0;
    const count = values.length;

    // Chart Generation (SVG)
    const chartWidth = 500;
    const chartHeight = 200;
    const padding = 20;
    const chartValues = sortedAsc.map(r => Number(r[valueKey]) || 0);
    const maxVal = Math.max(...chartValues, 1);
    
    const points = chartValues.map((v, i) => {
        const x = padding + (i / (chartValues.length - 1 || 1)) * (chartWidth - 2 * padding);
        const y = chartHeight - padding - ((v / maxVal) * (chartHeight - 2 * padding));
        return `${x},${y}`;
    }).join(' ');

    const chartSvg = chartValues.length > 0 ? `
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-full h-48 border rounded bg-gray-50">
            <polyline fill="none" stroke="#3B82F6" stroke-width="2" points="${points}" />
            ${chartValues.map((v, i) => {
                const x = padding + (i / (chartValues.length - 1 || 1)) * (chartWidth - 2 * padding);
                const y = chartHeight - padding - ((v / maxVal) * (chartHeight - 2 * padding));
                return `<circle cx="${x}" cy="${y}" r="3" fill="#2563EB"><title>${sortedAsc[i].reporting_year}-${sortedAsc[i].reporting_month}: ${v} ${unit}</title></circle>`;
            }).join('')}
        </svg>
    ` : '<div class="h-48 flex items-center justify-center bg-gray-50 border rounded text-gray-500">No data available for chart</div>';

    const madeTable = (madeItems && madeItems.length > 0) ? `
        <div class="mt-6 pt-4 border-t border-gray-200">
            <h4 class="font-semibold text-gray-700 mb-2">Equipment Details (MADE)</h4>
            <div class="overflow-x-auto border rounded-lg">
                <table class="min-w-full text-sm">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rating (kW)</th>
                            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Hrs/Day</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${madeItems.map(m => `
                            <tr>
                                <td class="px-4 py-2 whitespace-nowrap text-gray-700">${m.description_of_equipment || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-gray-600">${m.energy_use_category || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-gray-600">${m.location || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right text-gray-600 font-mono">${m.power_rating_kw || '-'}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right text-gray-600 font-mono">${m.time_of_use_hours_per_day || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    ` : '';

    // Modal HTML
    const modal = document.createElement('div');
    modal.id = 'asset-detail-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center';
    modal.innerHTML = `
        <div class="relative border w-full max-w-4xl shadow-lg rounded-lg bg-white m-4 overflow-hidden">
            <div class="flex justify-between items-center px-6 py-4 border-b hero-header">
                <h3 class="text-xl font-bold">Details: ${title}</h3>
                <button class="text-white hover:text-gray-200 text-2xl font-bold leading-none" onclick="document.getElementById('asset-detail-modal').remove()">&times;</button>
            </div>
            
            <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Total Consumption</p>
                            <p class="text-lg font-bold text-blue-700">${total.toLocaleString()} ${unit}</p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Average Monthly</p>
                            <p class="text-lg font-bold text-green-700">${avg.toLocaleString(undefined, {maximumFractionDigits: 1})} ${unit}</p>
                        </div>
                        <div class="bg-yellow-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Peak Monthly</p>
                            <p class="text-lg font-bold text-yellow-700">${peak.toLocaleString()} ${unit}</p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-lg">
                            <p class="text-xs text-gray-500 uppercase">Records Count</p>
                            <p class="text-lg font-bold text-purple-700">${count}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-700 mb-2">Consumption Trend</h4>
                        ${chartSvg}
                        <p class="text-xs text-gray-500 mt-1 text-center">Hover over points for details</p>
                    </div>
                </div>

                <div class="flex flex-col h-96">
                    <h4 class="font-semibold text-gray-700 mb-2">History</h4>
                    <div class="overflow-y-auto flex-1 border rounded-lg">
                        <table class="min-w-full text-sm leading-normal">
                            <thead>
                                <tr class="bg-gray-100 sticky top-0">
                                    <th class="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                    <th class="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Consumption (${unit})</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-gray-200">
                                ${sortedDesc.map(r => `
                                    <tr>
                                        <td class="px-4 py-2 whitespace-no-wrap text-gray-700">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</td>
                                        <td class="px-4 py-2 whitespace-no-wrap text-right font-mono text-gray-800">${(Number(r[valueKey])||0).toLocaleString()}</td>
                                    </tr>
                                `).join('') || '<tr><td colspan="2" class="px-4 py-2 text-center text-gray-500">No records found</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            ${madeTable}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

async function renderPpaList() {
                const tableBody = document.getElementById('ppa-table-body');
                if (!tableBody) return;

                let ppas = await getPpaList();
                
                // To filter PPAs, we need to know which RIOs they are related to, and if those RIOs belong to the current LGU.
                // This is complex because PPAs have an array of RIO IDs.
                // Simplified approach: Fetch RIOs for current LGU, get their IDs, filter PPAs that contain at least one valid RIO.
                if (currentLguId) {
                    let [rios, buildings, vehicles] = await Promise.all([getRioList(), getFsbdList(), getVehicleList()]);
                    const allowedAssetIds = new Set([...buildings.filter(b => b.lguId === currentLguId).map(b => b.id), ...vehicles.filter(v => v.lguId === currentLguId).map(v => v.id)]);
                    const allowedRioIds = new Set(rios.filter(r => allowedAssetIds.has(r.fsbdId) || allowedAssetIds.has(r.vehicleId)).map(r => r.id));
                    
                    ppas = ppas.filter(ppa => ppa.relatedRioIds && ppa.relatedRioIds.some(id => allowedRioIds.has(id)));
                }

                if (ppas.length > 0) {
                    tableBody.innerHTML = ppas.map(ppa => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${ppa.project_name}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${ppa.status}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${ppa.estimated_cost_php || 'N/A'}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${ppa.actual_cost_php || 'N/A'}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="#/ppas/edit/${ppa.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs">Edit</a>
                            </td>
                        </tr>
                    `).join('');
                } else {
                    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No projects found.</td></tr>';
                }
}

async function initPpaForm(docId = null) {
                const form = document.getElementById('ppa-form');
                if (!form) return;

                const idField = document.getElementById('ppa-id');
                const nameField = document.getElementById('project_name');
                const riosField = document.getElementById('relatedRioIds');
                const statusField = document.getElementById('status');
                const estimatedCostField = document.getElementById('estimated_cost_php');
                const actualCostField = document.getElementById('actual_cost_php');

                // Populate RIOs dropdown
                let rios = await getRioList();
                if (currentLguId) {
                    // Filter RIOs for dropdown
                    const [buildings, vehicles] = await Promise.all([getFsbdList(), getVehicleList()]);
                    const allowedAssetIds = new Set([...buildings.filter(b => b.lguId === currentLguId).map(b => b.id), ...vehicles.filter(v => v.lguId === currentLguId).map(v => v.id)]);
                    rios = rios.filter(r => allowedAssetIds.has(r.fsbdId) || allowedAssetIds.has(r.vehicleId));
                }

                riosField.innerHTML = rios.map(rio => `<option value="${rio.id}">${rio.proposed_action}</option>`).join('');

                // Layout adjustment for Side-by-Side View (Form + RIO Details)
                const formCard = form.closest('.bg-white') || form.parentElement;
                formCard.classList.remove('max-w-3xl', 'mx-auto');
                formCard.classList.add('w-full', 'h-full');

                // Create Grid Wrapper
                const gridWrapper = document.createElement('div');
                gridWrapper.className = 'grid grid-cols-1 lg:grid-cols-2 gap-6 w-full';

                if (formCard.parentNode) {
                    formCard.parentNode.insertBefore(gridWrapper, formCard);
                    gridWrapper.appendChild(formCard);
                }

                // Create Details Card
                const detailsCard = document.createElement('div');
                detailsCard.className = 'bg-white shadow-md rounded-lg overflow-hidden h-full border-t-4 border-indigo-500 flex flex-col';
                detailsCard.innerHTML = `
                    <div class="hero-header px-6 py-4 border-b border-gray-200">
                        <h2 class="text-xl font-bold">Selected RIO Details</h2>
                    </div>
                    <div class="p-6 space-y-4 overflow-y-auto flex-1" id="rio-details-content">
                        <p class="text-gray-500 text-center italic">Select one or more RIOs to view details.</p>
                    </div>
                `;
                gridWrapper.appendChild(detailsCard);

                const detailsContent = detailsCard.querySelector('#rio-details-content');

                const updateRioDetails = () => {
                    const selectedOptions = Array.from(riosField.selectedOptions);
                    const selectedIds = new Set(selectedOptions.map(o => o.value));
                    const selectedRios = rios.filter(r => selectedIds.has(r.id));

                    if (selectedRios.length === 0) {
                        detailsContent.innerHTML = '<p class="text-gray-500 text-center italic">Select one or more RIOs to view details.</p>';
                        return;
                    }

                    detailsContent.innerHTML = selectedRios.map(rio => `
                        <div class="border rounded p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div class="flex justify-between items-start mb-2">
                                <span class="text-xs font-bold px-2 py-1 rounded ${rio.priority === 'High' ? 'bg-red-100 text-red-800' : (rio.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800')}">${rio.priority}</span>
                                <span class="text-xs text-gray-500 border px-1 rounded">${rio.status}</span>
                            </div>
                            <p class="font-medium text-gray-800 mb-2 text-sm">${rio.proposed_action}</p>
                            <div class="text-xs text-gray-600 grid grid-cols-2 gap-2 border-t pt-2 mt-2">
                                <div><span class="block text-gray-400">Est. Cost</span> ₱${(rio.estimated_cost_php || 0).toLocaleString()}</div>
                                <div><span class="block text-gray-400">Est. Savings</span> ₱${(rio.estimated_savings_php || 0).toLocaleString()}</div>
                            </div>
                        </div>
                    `).join('');
                };

                riosField.addEventListener('change', updateRioDetails);

                if (docId) {
                    // EDIT MODE
                    const data = await getPpaById(docId);
                    if (data) {
                        idField.value = data.id;
                        nameField.value = data.project_name || '';
                        statusField.value = data.status || 'Planned';
                        estimatedCostField.value = data.estimated_cost_php || '';
                        actualCostField.value = data.actual_cost_php || '';
                        if (data.relatedRioIds) {
                            Array.from(riosField.options).forEach(option => {
                                if (data.relatedRioIds.includes(option.value)) {
                                    option.selected = true;
                                }
                            });
                        }
                        updateRioDetails();
                    }
                }

                form.addEventListener('submit', async (e) => {
                    e.preventDefault();

                    const selectedRioIds = Array.from(riosField.selectedOptions).map(option => option.value);
                    
                    const formData = {
                        project_name: nameField.value,
                        status: statusField.value,
                        estimated_cost_php: Number(estimatedCostField.value) || null,
                        actual_cost_php: Number(actualCostField.value) || null,
                        relatedRioIds: selectedRioIds,
                    };

                    const id = idField.value;
                    let success = false;
                    if (id) {
                        success = await updatePpa(id, formData);
                    } else {
                        success = await createPpa(formData);
                    }

                    if (success) {
                        location.hash = '#/ppas';
                    } else {
                        alert('Error saving project.');
                    }
                });
}

async function renderDashboard(loadId) {
                if (!window.db) {
                    console.error("Firestore is not initialized.");
                    return;
                }

                try {
                    let [buildings, vehicles, rios, ppas, mecrResults, mfcrResults] = await Promise.all([
                        getFsbdList(),
                        getVehicleList(),
                        getRioList(),
                        getPpaList(),
                        db.collection('mecr_reports').get().catch(e => { console.error(e); return { docs: [] }; }),
                        db.collection('mfcr_reports').get().catch(e => { console.error(e); return { docs: [] }; }),
                    ]);
                    
                    // Check if this render is still valid for the current view
                    if (loadId && loadId !== currentLoadId) return;

                    let mecrReports = mecrResults.docs.map(doc => doc.data());
                    let mfcrReports = mfcrResults.docs.map(doc => doc.data());

                    // Filter Data by LGU
                    if (currentLguId) {
                        buildings = buildings.filter(b => b.lguId === currentLguId || !b.lguId);
                        vehicles = vehicles.filter(v => v.lguId === currentLguId || !v.lguId);
                        
                        const allowedBldgIds = new Set(buildings.map(b => b.id));
                        const allowedVehicleIds = new Set(vehicles.map(v => v.id));

                        rios = rios.filter(r => allowedBldgIds.has(r.fsbdId) || allowedVehicleIds.has(r.vehicleId));
                        
                        mecrReports = mecrReports.filter(r => allowedBldgIds.has(r.fsbdId));
                        mfcrReports = mfcrReports.filter(r => allowedVehicleIds.has(r.vehicleId));

                        // Filter PPAs based on filtered RIOs
                        const allowedRioIds = new Set(rios.map(r => r.id));
                        ppas = ppas.filter(ppa => ppa.relatedRioIds && ppa.relatedRioIds.some(id => allowedRioIds.has(id)));
                    }

                    // Calculate additional KPIs
                    const totalElectricity = mecrReports.reduce((sum, r) => sum + (Number(r.electricity_consumption_kwh) || 0), 0);
                    const totalFuel = mfcrReports.reduce((sum, r) => sum + (Number(r.fuel_consumed_liters) || 0), 0);
                    const totalSavings = rios.reduce((sum, r) => sum + (Number(r.estimated_savings_php) || 0), 0);
                    const totalInvestment = ppas.reduce((sum, p) => sum + (Number(p.actual_cost_php) || Number(p.estimated_cost_php) || 0), 0);

                    // Render Stats Helper
                    const setSafeText = (id, text) => {
                        const el = document.getElementById(id);
                        if (el) el.textContent = text;
                    };

                    setSafeText('stats-total-buildings', buildings.length);
                    setSafeText('stats-total-vehicles', vehicles.length);
                    setSafeText('stats-high-rios', rios.filter(r => r.priority === 'High').length);
                    setSafeText('stats-ongoing-ppas', ppas.filter(p => p.status === 'Ongoing').length);

                    // Render New KPIs
                    setSafeText('stats-total-electricity', totalElectricity.toLocaleString());
                    setSafeText('stats-total-fuel', totalFuel.toLocaleString());
                    setSafeText('stats-total-savings', '₱' + totalSavings.toLocaleString());
                    setSafeText('stats-total-investment', '₱' + totalInvestment.toLocaleString());
                    
                    // Render Recent Consumption Table
                    const buildingMap = buildings.reduce((acc, b) => ({...acc, [b.id]: b.name}), {});
                    const vehicleMap = vehicles.reduce((acc, v) => ({...acc, [v.id]: v.plate_number}), {});

                    const allReports = [
                        ...mecrReports.map(r => ({
                            date: `${r.reporting_year}-${String(r.reporting_month).padStart(2, '0')}`,
                            year: r.reporting_year,
                            month: r.reporting_month,
                            type: 'Electricity',
                            asset: buildingMap[r.fsbdId] || 'Unknown Building',
                            amount: `${Number(r.electricity_consumption_kwh).toLocaleString()} kWh`,
                            colorClass: 'text-indigo-900 bg-indigo-200'
                        })),
                        ...mfcrReports.map(r => ({
                            date: `${r.reporting_year}-${String(r.reporting_month).padStart(2, '0')}`,
                            year: r.reporting_year,
                            month: r.reporting_month,
                            type: 'Fuel',
                            asset: vehicleMap[r.vehicleId] || 'Unknown Vehicle',
                            amount: `${Number(r.fuel_consumed_liters).toLocaleString()} L`,
                            colorClass: 'text-teal-900 bg-teal-200'
                        }))
                    ];

                    // Sort by date descending
                    allReports.sort((a, b) => (b.year - a.year) || (b.month - a.month));

                    const recentActivity = allReports.slice(0, 5);
                    const tableBody = document.getElementById('dashboard-recent-consumption-body');
                    
                    if (tableBody) {
                        tableBody.innerHTML = recentActivity.length > 0 ? recentActivity.map(r => `
                            <tr>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.date}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.asset}</td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                    <span class="relative inline-block px-3 py-1 font-semibold ${r.colorClass.split(' ')[0]} leading-tight">
                                        <span aria-hidden class="absolute inset-0 ${r.colorClass.split(' ')[1]} opacity-50 rounded-full"></span>
                                        <span class="relative">${r.type}</span>
                                    </span>
                                </td>
                                <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${r.amount}</td>
                            </tr>
                        `).join('') : '<tr><td colspan="4" class="px-5 py-5 border-b border-gray-200 bg-white text-sm text-center">No recent reports found.</td></tr>';
                    }

                } catch (error) {
                    console.error("Error rendering dashboard:", error);
                }
}

async function renderAdmin() {
                // Fetch all data
                const [lgus, fsbds, vehicles, made, mecr, mfcr, rios, ppas] = await Promise.all([
                    getLguList(), getFsbdList(), getVehicleList(), getMadeList(),
                    db.collection('mecr_reports').get().then(s => s.docs.map(d => ({id:d.id, ...d.data()}))),
                    db.collection('mfcr_reports').get().then(s => s.docs.map(d => ({id:d.id, ...d.data()}))),
                    getRioList(), getPpaList()
                ]);

                // --- SAMPLE DATA BUTTON LOGIC ---
                const btnSample = document.getElementById('btn-sample-data');
                if (btnSample) {
                    const exists = await checkSampleDataExists();
                    
                    if (exists) {
                        btnSample.textContent = 'Delete Sample Data';
                        btnSample.className = 'bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded shadow focus:outline-none focus:shadow-outline transition duration-150 ease-in-out';
                        btnSample.onclick = async () => {
                            if (confirm('Are you sure you want to delete all sample data? This cannot be undone.')) {
                                btnSample.disabled = true;
                                btnSample.textContent = 'Deleting...';
                                await deleteSampleData();
                                await initLguSelector(); // Refresh selector
                                await renderAdmin(); // Refresh view
                            }
                        };
                    } else {
                        btnSample.textContent = 'Generate Sample Data';
                        btnSample.className = 'bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded shadow focus:outline-none focus:shadow-outline transition duration-150 ease-in-out';
                        btnSample.onclick = async () => {
                            btnSample.disabled = true;
                            btnSample.textContent = 'Generating...';
                            await createSampleData();
                            await initLguSelector(); // Refresh selector
                            await renderAdmin(); // Refresh view
                        };
                    }
                    btnSample.classList.remove('hidden');
                }

                // --- TAB LOGIC ---
                const tabs = document.querySelectorAll('.tab-btn');
                const contents = document.querySelectorAll('.tab-content-item');
                tabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        tabs.forEach(t => t.classList.replace('border-blue-500', 'border-transparent'));
                        tabs.forEach(t => t.classList.replace('text-blue-600', 'text-gray-500'));
                        tab.classList.replace('border-transparent', 'border-blue-500');
                        tab.classList.replace('text-gray-500', 'text-blue-600');
                        contents.forEach(c => c.classList.add('hidden'));
                        document.getElementById(tab.dataset.target).classList.remove('hidden');
                    });
                });

                // Create Maps for Parent Lookup
                const lguMap = lgus.reduce((acc, i) => ({...acc, [i.id]: i.name}), {});
                const fsbdMap = fsbds.reduce((acc, i) => ({...acc, [i.id]: i.name}), {});
                const vehicleMap = vehicles.reduce((acc, i) => ({...acc, [i.id]: i.plate_number}), {});

                // Helper to render table rows
                const renderRows = (tableId, items, nameFn, parentFn, editHash, deleteFn) => {
                    const tbody = document.querySelector(`#${tableId} tbody`);
                    if (!tbody) return;
                    if (items.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="3" class="text-center">No items found</td></tr>';
                        return;
                    }
                    tbody.innerHTML = items.map(item => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${nameFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${parentFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                <a href="${editHash}/${item.id}" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-2 rounded text-xs mr-1">Edit</a>
                                <button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs btn-delete" data-id="${item.id}">Delete</button>
                            </td>
                        </tr>
                    `).join('');

                    // Attach delete listeners
                    tbody.querySelectorAll('.btn-delete').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            if(confirm('Are you sure you want to delete this item?')) {
                                const id = e.target.getAttribute('data-id');
                                const success = await deleteFn(id);
                                if(success) {
                                    e.target.closest('tr').remove();
                                } else {
                                    alert('Error deleting item.');
                                }
                            }
                        });
                    });
                };

                // Render LGUs
                renderRows('table-lgus', lgus, i => i.name, () => 'N/A', '#/lgus/edit', deleteLgu);

                // Render Buildings
                renderRows('table-fsbds', fsbds, i => i.name, i => lguMap[i.lguId] || 'Unknown LGU', '#/fsbds/edit', deleteFsbd);

                // Render Vehicles
                renderRows('table-vehicles', vehicles, i => i.plate_number, i => lguMap[i.lguId] || 'Unknown LGU', '#/vehicles/edit', deleteVehicle);

                // Render MADE
                renderRows('table-made', made, i => i.description_of_equipment, i => fsbdMap[i.fsbdId] || 'Unknown Building', '#/made/edit', deleteMade);

                // Render MECR (No edit page for reports in current structure, usually handled in consumption page, but we can't link easily without a specific edit route. 
                // For now, we will disable Edit or link to consumption page. The prompt asked for edit/delete. 
                // Since we don't have specific edit forms for reports (they are inline in consumption), I will omit the edit link for reports or point to consumption.)
                // Actually, let's just allow Delete for reports to keep it simple as per "edit and delete" request usually implies existence of edit forms.
                // I'll leave Edit button but it might not work perfectly if route doesn't exist. 
                // *Correction*: The user didn't ask to create edit forms for reports, just "actions to edit or delete". 
                // I will hide Edit for reports since no route exists in app.js for /mecr/edit.
                const renderRowsNoEdit = (tableId, items, nameFn, parentFn, deleteFn) => {
                     const tbody = document.querySelector(`#${tableId} tbody`);
                     if (!tbody) return;
                     tbody.innerHTML = items.map(item => `
                        <tr>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${nameFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${parentFn(item)}</td>
                            <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm"><button class="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-2 rounded text-xs btn-delete" data-id="${item.id}">Delete</button></td>
                        </tr>
                    `).join('');
                    tbody.querySelectorAll('.btn-delete').forEach(btn => btn.addEventListener('click', async (e) => { if(confirm('Delete?')) { await deleteFn(e.target.getAttribute('data-id')); e.target.closest('tr').remove(); } }));
                };

                renderRowsNoEdit('table-mecr', mecr, i => `${i.reporting_year}-${i.reporting_month}`, i => fsbdMap[i.fsbdId] || 'Unknown', deleteMecrReport);
                renderRowsNoEdit('table-mfcr', mfcr, i => `${i.reporting_year}-${i.reporting_month}`, i => vehicleMap[i.vehicleId] || 'Unknown', deleteMfcrReport);

                renderRows('table-rios', rios, i => i.proposed_action, i => fsbdMap[i.fsbdId] || vehicleMap[i.vehicleId] || 'Unknown Asset', '#/rios/edit', deleteRio);
                renderRows('table-ppas', ppas, i => i.project_name, () => 'N/A', '#/ppas/edit', deletePpa);
            }
        
            async function renderSeuPage() {
                const seuTableBody = document.getElementById('seu-table-body');
                const equipTableBody = document.getElementById('analysis-equipment-body');
                const vehicleTableBody = document.getElementById('analysis-vehicle-body');

                if (!currentLguId) {
                    seuTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-red-500">Please select an LGU first.</td></tr>';
                    return;
                }

                try {
                    const [lguSeus, buildings, vehicles, madeList, mfcrSnap, mecrSnap] = await Promise.all([
                        getSeuList(),
                        getFsbdList(),
                        getVehicleList(),
                        getMadeList(),
                        window.db.collection('mfcr_reports').get(),
                        window.db.collection('mecr_reports').get()
                    ]);

                    // Filter by LGU
                    const lguBuildings = buildings.filter(b => b.lguId === currentLguId);
                    const lguVehicles = vehicles.filter(v => v.lguId === currentLguId);
                    const bldgIds = new Set(lguBuildings.map(b => b.id));
                    const vehIds = new Set(lguVehicles.map(v => v.id));

                    // Filter SEUs
                    const filteredSeus = lguSeus.filter(s => bldgIds.has(s.fsbdId) || vehIds.has(s.vehicleId));

                    // Render Registered SEUs
                    if (filteredSeus.length > 0) {
                        seuTableBody.innerHTML = filteredSeus.map(s => {
                            const assetName = s.fsbdId ? (lguBuildings.find(b => b.id === s.fsbdId)?.name || 'Unknown Bldg') : (lguVehicles.find(v => v.id === s.vehicleId)?.plate_number || 'Unknown Vehicle');
                            return `
                                <tr>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm font-medium">${assetName}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${s.energy_use_category || '-'}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${s.finding_description}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">${s.identification_method}</td>
                                    <td class="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <button class="text-red-600 hover:text-red-900 btn-delete-seu" data-id="${s.id}">Delete</button>
                                    </td>
                                </tr>
                            `;
                        }).join('');

                        // Attach delete listeners
                        document.querySelectorAll('.btn-delete-seu').forEach(btn => {
                            btn.addEventListener('click', async (e) => {
                                if (confirm('Delete this SEU finding?')) {
                                    await deleteSeu(e.target.dataset.id);
                                    renderSeuPage(); // Reload
                                }
                            });
                        });
                    } else {
                        seuTableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-gray-500">No SEU findings recorded yet.</td></tr>';
                    }

                    // --- Top Consumers Chart ---
                    const mecr = mecrSnap.docs.map(d => d.data()).filter(r => bldgIds.has(r.fsbdId));
                    const mfcr = mfcrSnap.docs.map(d => d.data()).filter(r => vehIds.has(r.vehicleId));

                    const assetCosts = [];
                    lguBuildings.forEach(b => {
                        const cost = mecr.filter(r => r.fsbdId === b.id).reduce((sum, r) => sum + (Number(r.cost_php) || 0), 0);
                        if(cost > 0) assetCosts.push({ name: b.name, cost, type: 'Building' });
                    });
                    lguVehicles.forEach(v => {
                        const cost = mfcr.filter(r => r.vehicleId === v.id).reduce((sum, r) => sum + (Number(r.cost_php) || 0), 0);
                        if(cost > 0) assetCosts.push({ name: v.plate_number, cost, type: 'Vehicle' });
                    });

                    assetCosts.sort((a, b) => b.cost - a.cost);
                    const topConsumers = assetCosts.slice(0, 10);

                    const ctx = document.getElementById('chart-top-consumers');
                    if (ctx) {
                        new Chart(ctx, {
                            type: 'bar',
                            data: {
                                labels: topConsumers.map(c => c.name),
                                datasets: [{
                                    label: 'Total Energy Cost (PHP)',
                                    data: topConsumers.map(c => c.cost),
                                    backgroundColor: topConsumers.map(c => c.type === 'Building' ? '#4F46E5' : '#0D9488')
                                }]
                            },
                            options: { responsive: true, maintainAspectRatio: false }
                        });
                    }

                    // --- Equipment Analysis (Calculated) ---
                    const lguMade = madeList.filter(m => bldgIds.has(m.fsbdId));
                    const calculatedMade = lguMade.map(m => ({
                        ...m,
                        est_monthly_kwh: (m.power_rating_kw || 0) * (m.time_of_use_hours_per_day || 0) * 30 // Assuming 30 days
                    })).sort((a, b) => b.est_monthly_kwh - a.est_monthly_kwh).slice(0, 10); // Top 10

                    equipTableBody.innerHTML = calculatedMade.map(m => {
                        const bldg = lguBuildings.find(b => b.id === m.fsbdId);
                        return `
                            <tr>
                                <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm">
                                    <div class="font-bold text-gray-800">${m.description_of_equipment}</div>
                                    <div class="text-xs text-gray-500">${bldg ? bldg.name : 'Unknown'} - ${m.location}</div>
                                </td>
                                <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-right font-mono">${m.est_monthly_kwh.toLocaleString()} kWh</td>
                                <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-center">
                                    <button class="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded text-xs font-bold btn-add-seu-equip" data-id="${m.id}">Identify</button>
                                </td>
                            </tr>
                        `;
                    }).join('') || '<tr><td colspan="3" class="text-center py-2 text-gray-500">No equipment data found.</td></tr>';

                    // --- Vehicle Analysis (Historical) ---
                    const vehicleStats = lguVehicles.map(v => {
                        const reports = mfcr.filter(r => r.vehicleId === v.id);
                        const totalFuel = reports.reduce((sum, r) => sum + (Number(r.fuel_consumed_liters) || 0), 0);
                        const avgFuel = reports.length ? totalFuel / reports.length : 0;
                        return { ...v, avgFuel };
                    }).filter(v => v.avgFuel > 0).sort((a, b) => b.avgFuel - a.avgFuel).slice(0, 10);

                    vehicleTableBody.innerHTML = vehicleStats.map(v => `
                        <tr>
                            <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm">
                                <div class="font-bold text-gray-800">${v.plate_number}</div>
                                <div class="text-xs text-gray-500">${v.make} ${v.model}</div>
                            </td>
                            <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-right font-mono">${v.avgFuel.toLocaleString(undefined, {maximumFractionDigits: 1})} L</td>
                            <td class="px-4 py-2 border-b border-gray-200 bg-white text-sm text-center">
                                <button class="bg-teal-100 text-teal-700 hover:bg-teal-200 px-2 py-1 rounded text-xs font-bold btn-add-seu-vehicle" data-id="${v.id}">Identify</button>
                            </td>
                        </tr>
                    `).join('') || '<tr><td colspan="3" class="text-center py-2 text-gray-500">No fuel reports found.</td></tr>';

                    // --- Event Listeners for "Identify" ---
                    document.querySelectorAll('.btn-add-seu-equip').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const m = calculatedMade.find(i => i.id === e.target.dataset.id);
                            const desc = prompt("Enter SEU Finding Description:", `High consumption equipment: ${m.description_of_equipment}`);
                            if (desc) {
                                await createSeu({
                                    fsbdId: m.fsbdId,
                                    energy_use_category: m.energy_use_category,
                                    linkedEquipmentIds: [m.id],
                                    finding_description: desc,
                                    identification_method: 'Calculated (Rating * Hours)',
                                    status: 'Identified'
                                });
                                renderSeuPage();
                            }
                        });
                    });

                    document.querySelectorAll('.btn-add-seu-vehicle').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const v = vehicleStats.find(i => i.id === e.target.dataset.id);
                            const desc = prompt("Enter SEU Finding Description:", `High fuel consumption vehicle: ${v.plate_number}`);
                            if (desc) {
                                await createSeu({
                                    vehicleId: v.id,
                                    energy_use_category: 'Fuel Consumption',
                                    finding_description: desc,
                                    identification_method: 'Historical Average',
                                    status: 'Identified'
                                });
                                renderSeuPage();
                            }
                        });
                    });

                } catch (error) {
                    console.error("Error rendering SEU page:", error);
                }
            }

            async function renderReporting() {
                const container = document.getElementById('report-container');
                const printBtn = document.getElementById('btn-print-report');
                
                if (printBtn) {
                    printBtn.addEventListener('click', () => window.print());
                }

                if (!currentLguId) {
                    container.innerHTML = '<p class="text-red-500 text-center">Please select an LGU first.</p>';
                    return;
                }

                try {
                    // Fetch Data
                    const [lgu, buildings, vehicles, rios, ppas, mecrSnap, mfcrSnap, seuSnap] = await Promise.all([
                        getLguById(currentLguId),
                        getFsbdList(),
                        getVehicleList(),
                        getRioList(),
                        getPpaList(),
                        window.db.collection('mecr_reports').get(),
                        window.db.collection('mfcr_reports').get(),
                        window.db.collection('seu_findings').get()
                    ]);

                    // Filter Data
                    const lguBuildings = buildings.filter(b => b.lguId === currentLguId);
                    const lguVehicles = vehicles.filter(v => v.lguId === currentLguId);
                    
                    const bldgIds = new Set(lguBuildings.map(b => b.id));
                    const vehIds = new Set(lguVehicles.map(v => v.id));

                    const lguRios = rios.filter(r => bldgIds.has(r.fsbdId) || vehIds.has(r.vehicleId));
                    
                    // Filter PPAs based on RIOs
                    const rioIds = new Set(lguRios.map(r => r.id));
                    const lguPpas = ppas.filter(p => p.relatedRioIds && p.relatedRioIds.some(id => rioIds.has(id)));

                    const mecr = mecrSnap.docs.map(d => d.data()).filter(r => bldgIds.has(r.fsbdId));
                    const mfcr = mfcrSnap.docs.map(d => d.data()).filter(r => vehIds.has(r.vehicleId));
                    const lguSeus = seuSnap.docs.map(d => d.data()).filter(s => bldgIds.has(s.fsbdId) || vehIds.has(s.vehicleId));

                    // Calculations
                    const totalElectricity = mecr.reduce((sum, r) => sum + (Number(r.electricity_consumption_kwh) || 0), 0);
                    const totalFuel = mfcr.reduce((sum, r) => sum + (Number(r.fuel_consumed_liters) || 0), 0);
                    
                    // Group Consumption by Asset for Drilldown
                    const mecrByBuilding = {};
                    mecr.forEach(r => {
                        if (!mecrByBuilding[r.fsbdId]) mecrByBuilding[r.fsbdId] = [];
                        mecrByBuilding[r.fsbdId].push(r);
                    });

                    const mfcrByVehicle = {};
                    mfcr.forEach(r => {
                        if (!mfcrByVehicle[r.vehicleId]) mfcrByVehicle[r.vehicleId] = [];
                        mfcrByVehicle[r.vehicleId].push(r);
                    });

                    // Date formatting
                    const dateStr = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

                    // --- CHART DATA PREPARATION ---
                    const chartColors = [
                        '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f',
                        '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab'
                    ];

                    // 1. Shares (Pie Charts)
                    const elecShareLabels = lguBuildings.map(b => b.name);
                    const elecShareData = lguBuildings.map(b => {
                        return mecr.filter(r => r.fsbdId === b.id).reduce((sum, r) => sum + (Number(r.electricity_consumption_kwh)||0), 0);
                    });

                    const fuelShareLabels = lguVehicles.map(v => v.plate_number);
                    const fuelShareData = lguVehicles.map(v => {
                        return mfcr.filter(r => r.vehicleId === v.id).reduce((sum, r) => sum + (Number(r.fuel_consumed_liters)||0), 0);
                    });

                    // 2. Trends (Stacked Bar)
                    const getPeriod = (r) => `${r.reporting_year}-${String(r.reporting_month).padStart(2, '0')}`;
                    
                    // Electricity Trends
                    const elecPeriods = [...new Set(mecr.map(getPeriod))].sort();
                    const elecTrendDatasets = lguBuildings.map((b, i) => ({
                        label: b.name,
                        data: elecPeriods.map(p => {
                            const match = mecr.find(r => r.fsbdId === b.id && getPeriod(r) === p);
                            return match ? (Number(match.electricity_consumption_kwh)||0) : 0;
                        }),
                        backgroundColor: chartColors[i % chartColors.length]
                    }));

                    // Fuel Trends
                    const fuelPeriods = [...new Set(mfcr.map(getPeriod))].sort();
                    const fuelTrendDatasets = lguVehicles.map((v, i) => ({
                        label: v.plate_number,
                        data: fuelPeriods.map(p => {
                            const match = mfcr.find(r => r.vehicleId === v.id && getPeriod(r) === p);
                            return match ? (Number(match.fuel_consumed_liters)||0) : 0;
                        }),
                        backgroundColor: chartColors[i % chartColors.length]
                    }));

                    // 3. Statuses (Doughnut/Bar)
                    const rioStatuses = ['Identified', 'Planned', 'In Progress', 'Completed', 'Implemented'];
                    const rioStatusData = rioStatuses.map(s => lguRios.filter(r => r.status === s).length);
                    
                    const ppaStatuses = ['Planned', 'Ongoing', 'Completed'];
                    const ppaStatusData = ppaStatuses.map(s => lguPpas.filter(p => p.status === s).length);

                    // 4. Financials (Bar Charts)
                    const rioPriorities = ['High', 'Medium', 'Low'];
                    const rioCostByPriority = rioPriorities.map(p => lguRios.filter(r => r.priority === p).reduce((sum, r) => sum + (r.estimated_cost_php || 0), 0));
                    const rioSavingsByPriority = rioPriorities.map(p => lguRios.filter(r => r.priority === p).reduce((sum, r) => sum + (r.estimated_savings_php || 0), 0));

                    const ppaEstCostByStatus = ppaStatuses.map(s => lguPpas.filter(p => p.status === s).reduce((sum, p) => sum + (p.estimated_cost_php || 0), 0));
                    const ppaActualCostByStatus = ppaStatuses.map(s => lguPpas.filter(p => p.status === s).reduce((sum, p) => sum + (p.actual_cost_php || 0), 0));

                    // 5. SEU Distribution
                    const seuCategories = {};
                    lguSeus.forEach(s => {
                        const cat = s.energy_use_category || 'Uncategorized';
                        seuCategories[cat] = (seuCategories[cat] || 0) + 1;
                    });
                    const seuLabels = Object.keys(seuCategories);
                    const seuData = Object.values(seuCategories);

                    // Helper to render charts after HTML injection
                    const initCharts = () => {
                        const commonOptions = { animation: false, responsive: true, maintainAspectRatio: false };
                        
                        new Chart(document.getElementById('chart-elec-share'), { type: 'pie', data: { labels: elecShareLabels, datasets: [{ data: elecShareData, backgroundColor: chartColors }] }, options: commonOptions });
                        new Chart(document.getElementById('chart-fuel-share'), { type: 'pie', data: { labels: fuelShareLabels, datasets: [{ data: fuelShareData, backgroundColor: chartColors }] }, options: commonOptions });
                        
                        new Chart(document.getElementById('chart-elec-trend'), { type: 'bar', data: { labels: elecPeriods, datasets: elecTrendDatasets }, options: { ...commonOptions, scales: { x: { stacked: true }, y: { stacked: true } } } });
                        new Chart(document.getElementById('chart-fuel-trend'), { type: 'bar', data: { labels: fuelPeriods, datasets: fuelTrendDatasets }, options: { ...commonOptions, scales: { x: { stacked: true }, y: { stacked: true } } } });

                        new Chart(document.getElementById('chart-rio-status'), { type: 'doughnut', data: { labels: rioStatuses, datasets: [{ data: rioStatusData, backgroundColor: ['#9CA3AF', '#FCD34D', '#60A5FA', '#34D399', '#10B981'] }] }, options: commonOptions });
                        new Chart(document.getElementById('chart-ppa-status'), { type: 'doughnut', data: { labels: ppaStatuses, datasets: [{ data: ppaStatusData, backgroundColor: ['#FCD34D', '#60A5FA', '#10B981'] }] }, options: commonOptions });
                        
                        // Financial Charts
                        new Chart(document.getElementById('chart-rio-finance'), { type: 'bar', data: { labels: rioPriorities, datasets: [{ label: 'Est. Cost', data: rioCostByPriority, backgroundColor: '#EF4444' }, { label: 'Est. Savings', data: rioSavingsByPriority, backgroundColor: '#10B981' }] }, options: commonOptions });
                        new Chart(document.getElementById('chart-ppa-finance'), { type: 'bar', data: { labels: ppaStatuses, datasets: [{ label: 'Est. Cost', data: ppaEstCostByStatus, backgroundColor: '#F59E0B' }, { label: 'Actual Cost', data: ppaActualCostByStatus, backgroundColor: '#3B82F6' }] }, options: commonOptions });
                        
                        // SEU Chart
                        new Chart(document.getElementById('chart-seu-dist'), { type: 'pie', data: { labels: seuLabels, datasets: [{ data: seuData, backgroundColor: chartColors }] }, options: commonOptions });
                    };

                    // HTML Generation
                    container.innerHTML = `
                        <div class="max-w-4xl mx-auto font-serif text-gray-900">
                            <!-- COVER PAGE -->
                            <div class="flex flex-col justify-center items-center min-h-[90vh] text-center break-after-page" style="page-break-after: always;">
                                <div class="mb-12 pt-20">
                                    <h1 class="text-4xl font-bold uppercase tracking-widest mb-4">Compliance Report</h1>
                                    <h2 class="text-2xl font-semibold text-gray-700">Energy Efficiency & Conservation Act (RA 11285)</h2>
                                </div>
                                
                                <div class="mb-16 flex-grow flex flex-col justify-center">
                                    <h3 class="text-5xl font-bold text-blue-900 mb-4">${lgu.name || 'LGU Name'}</h3>
                                    <p class="text-xl text-gray-600">${lgu.region || ''}, ${lgu.province || ''}</p>
                                </div>

                                <div class="mt-auto mb-20">
                                    <p class="text-lg text-gray-500">Generated on</p>
                                    <p class="text-2xl font-bold">${dateStr}</p>
                                </div>
                            </div>

                            <!-- Executive Summary -->
                            <div class="mb-8 pt-8">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">1. Executive Summary</h3>
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p><span class="font-semibold">Region:</span> ${lgu.region || '-'}</p>
                                        <p><span class="font-semibold">Province:</span> ${lgu.province || '-'}</p>
                                    </div>
                                    <div class="text-right">
                                        <p><span class="font-semibold">Head of LGU:</span> ${lgu.head_of_lgu || '-'}</p>
                                        <p><span class="font-semibold">Contact:</span> ${lgu.email || '-'}</p>
                                    </div>
                                </div>
                                <div class="mt-6 grid grid-cols-2 gap-4">
                                    <div class="bg-gray-50 p-4 rounded border">
                                        <p class="text-xs text-gray-500 uppercase">Total Electricity Recorded</p>
                                        <p class="text-xl font-bold text-indigo-700">${totalElectricity.toLocaleString()} kWh</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded border">
                                        <p class="text-xs text-gray-500 uppercase">Total Fuel Recorded</p>
                                        <p class="text-xl font-bold text-teal-700">${totalFuel.toLocaleString()} Liters</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Asset Inventory -->
                            <div class="mb-8">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">2. Asset Inventory</h3>
                                <p class="text-sm text-gray-600 mb-4">Summary of registered government-owned assets.</p>
                                <div class="grid grid-cols-2 gap-8">
                                    <div>
                                        <h4 class="font-bold text-sm mb-2">Buildings (${lguBuildings.length})</h4>
                                        <ul class="list-disc list-inside text-sm text-gray-700">
                                            ${lguBuildings.slice(0, 5).map(b => `<li>${b.name} <span class="text-xs text-gray-500">(${b.fsbd_type})</span></li>`).join('')}
                                            ${lguBuildings.length > 5 ? `<li class="italic text-gray-500">...and ${lguBuildings.length - 5} more</li>` : ''}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-sm mb-2">Vehicles (${lguVehicles.length})</h4>
                                        <ul class="list-disc list-inside text-sm text-gray-700">
                                            ${lguVehicles.slice(0, 5).map(v => `<li>${v.plate_number} <span class="text-xs text-gray-500">(${v.model})</span></li>`).join('')}
                                            ${lguVehicles.length > 5 ? `<li class="italic text-gray-500">...and ${lguVehicles.length - 5} more</li>` : ''}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Consumption Analysis -->
                            <div class="mb-8 break-before-page" style="page-break-before: always;">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">3. Consumption Analysis</h3>
                                
                                <!-- Charts Row 1: Shares -->
                                <div class="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">Electricity Share by Building</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-elec-share"></canvas></div>
                                    </div>
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">Fuel Share by Vehicle</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-fuel-share"></canvas></div>
                                    </div>
                                </div>

                                <!-- Charts Row 2: Trends -->
                                <div class="mb-8 break-inside-avoid">
                                    <h4 class="font-bold text-sm text-center mb-2">Electricity Consumption Trend (Stacked)</h4>
                                    <div class="relative h-80 w-full"><canvas id="chart-elec-trend"></canvas></div>
                                </div>

                                <div class="mb-8 break-inside-avoid">
                                    <h4 class="font-bold text-sm text-center mb-2">Fuel Consumption Trend (Stacked)</h4>
                                    <div class="relative h-80 w-full"><canvas id="chart-fuel-trend"></canvas></div>
                                </div>
                                
                                <h4 class="font-bold text-md text-indigo-800 mb-3 mt-6 border-t pt-4">3.1 Detailed Electricity Reports</h4>
                                ${lguBuildings.map(b => {
                                    const reports = mecrByBuilding[b.id] || [];
                                    if (reports.length === 0) return '';
                                    // Sort by date
                                    reports.sort((x, y) => (x.reporting_year - y.reporting_year) || (x.reporting_month - y.reporting_month));
                                    return `
                                        <div class="mb-6 break-inside-avoid">
                                            <p class="font-bold text-sm mb-1">${b.name} <span class="font-normal text-gray-500">(${b.fsbd_type})</span></p>
                                            <table class="w-full text-xs text-left border border-gray-200">
                                                <thead class="bg-gray-50">
                                                    <tr>
                                                        ${reports.map(r => `<th class="p-1 border text-center">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</th>`).join('')}
                                                        <th class="p-1 border text-center font-bold">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        ${reports.map(r => `<td class="p-1 border text-center">${r.electricity_consumption_kwh.toLocaleString()}</td>`).join('')}
                                                        <td class="p-1 border text-center font-bold">${reports.reduce((s,r)=>s+r.electricity_consumption_kwh,0).toLocaleString()} kWh</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    `;
                                }).join('') || '<p class="text-sm italic text-gray-500">No electricity reports available.</p>'}

                                <h4 class="font-bold text-md text-teal-800 mb-3 mt-8">3.2 Detailed Fuel Reports</h4>
                                ${lguVehicles.map(v => {
                                    const reports = mfcrByVehicle[v.id] || [];
                                    if (reports.length === 0) return '';
                                    reports.sort((x, y) => (x.reporting_year - y.reporting_year) || (x.reporting_month - y.reporting_month));
                                    return `
                                        <div class="mb-6 break-inside-avoid">
                                            <p class="font-bold text-sm mb-1">${v.plate_number} <span class="font-normal text-gray-500">(${v.make} ${v.model})</span></p>
                                            <table class="w-full text-xs text-left border border-gray-200">
                                                <thead class="bg-gray-50">
                                                    <tr>
                                                        ${reports.map(r => `<th class="p-1 border text-center">${r.reporting_year}-${String(r.reporting_month).padStart(2,'0')}</th>`).join('')}
                                                        <th class="p-1 border text-center font-bold">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        ${reports.map(r => `<td class="p-1 border text-center">${r.fuel_consumed_liters.toLocaleString()}</td>`).join('')}
                                                        <td class="p-1 border text-center font-bold">${reports.reduce((s,r)=>s+r.fuel_consumed_liters,0).toLocaleString()} L</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    `;
                                }).join('') || '<p class="text-sm italic text-gray-500">No fuel reports available.</p>'}
                            </div>

                            <!-- SEU Findings -->
                            <div class="mb-8 break-before-page" style="page-break-before: always;">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">4. Significant Energy Use (SEU)</h3>
                                
                                <!-- SEU Chart -->
                                <div class="mb-8 break-inside-avoid flex flex-col items-center">
                                    <h4 class="font-bold text-sm text-center mb-2">SEU Distribution by Category</h4>
                                    <div class="relative h-64 w-full max-w-md"><canvas id="chart-seu-dist"></canvas></div>
                                </div>

                                <p class="text-sm text-gray-600 mb-4">Identified areas of significant energy consumption.</p>
                                <table class="w-full text-sm text-left border-collapse">
                                    <thead>
                                        <tr class="border-b border-gray-400">
                                            <th class="py-1">Asset</th>
                                            <th class="py-1">Category</th>
                                            <th class="py-1">Description</th>
                                            <th class="py-1">Method</th>
                                            <th class="py-1">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${lguSeus.map(s => {
                                            const asset = s.fsbdId ? lguBuildings.find(b => b.id === s.fsbdId) : lguVehicles.find(v => v.id === s.vehicleId);
                                            const assetName = asset ? (asset.name || asset.plate_number) : 'Unknown Asset';
                                            return `
                                            <tr class="border-b border-gray-200">
                                                <td class="py-1 font-medium">${assetName}</td>
                                                <td class="py-1">${s.energy_use_category || '-'}</td>
                                                <td class="py-1">${s.finding_description || '-'}</td>
                                                <td class="py-1">${s.identification_method || '-'}</td>
                                                <td class="py-1 text-xs">${s.status || '-'}</td>
                                            </tr>
                                            `;
                                        }).join('') || '<tr><td colspan="5" class="italic text-gray-500 py-1">No SEU findings recorded.</td></tr>'}
                                    </tbody>
                                </table>
                            </div>

                            <!-- Recommendations & Projects -->
                            <div class="mb-8 break-before-page" style="page-break-before: always;">
                                <h3 class="text-lg font-bold uppercase border-b border-gray-300 mb-4 pb-1">5. Action Plan</h3>
                                
                                <!-- Charts: Status Overview -->
                                <div class="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">RIO Status Distribution</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-rio-status"></canvas></div>
                                    </div>
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">PPA Status Distribution</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-ppa-status"></canvas></div>
                                    </div>
                                </div>

                                <!-- Charts: Financial Overview -->
                                <div class="grid grid-cols-2 gap-8 mb-8 break-inside-avoid">
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">RIO Financial Impact (by Priority)</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-rio-finance"></canvas></div>
                                    </div>
                                    <div class="flex flex-col items-center">
                                        <h4 class="font-bold text-sm text-center mb-2">PPA Budget Performance (by Status)</h4>
                                        <div class="relative h-64 w-full"><canvas id="chart-ppa-finance"></canvas></div>
                                    </div>
                                </div>

                                <div class="mb-6">
                                    <h4 class="font-bold text-sm mb-2">5.1 Recommendations List</h4>
                                    <table class="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr class="border-b border-gray-400">
                                                <th class="py-1">Action</th>
                                                <th class="py-1">Priority</th>
                                                <th class="py-1">Status</th>
                                                <th class="py-1 text-right">Est. Cost</th>
                                                <th class="py-1 text-right">Est. Savings</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${lguRios.map(r => `
                                                <tr class="border-b border-gray-200">
                                                    <td class="py-1">${r.proposed_action}</td>
                                                    <td class="py-1"><span class="text-xs px-2 py-0.5 rounded ${r.priority==='High'?'bg-red-100':(r.priority==='Medium'?'bg-yellow-100':'bg-blue-100')}">${r.priority}</span></td>
                                                    <td class="py-1 text-xs">${r.status}</td>
                                                    <td class="py-1 text-right">₱${(r.estimated_cost_php||0).toLocaleString()}</td>
                                                    <td class="py-1 text-right">₱${(r.estimated_savings_php||0).toLocaleString()}</td>
                                                </tr>
                                            `).join('') || '<tr><td colspan="5" class="italic text-gray-500 py-1">No recommendations recorded.</td></tr>'}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <h4 class="font-bold text-sm mb-2">5.2 Projects List</h4>
                                    <table class="w-full text-sm text-left border-collapse">
                                        <thead>
                                            <tr class="border-b border-gray-400">
                                                <th class="py-1">Project Name</th>
                                                <th class="py-1">Status</th>
                                                <th class="py-1 text-right">Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${lguPpas.map(p => `
                                                <tr class="border-b border-gray-200">
                                                    <td class="py-1">${p.project_name}</td>
                                                    <td class="py-1 text-xs">${p.status}</td>
                                                    <td class="py-1 text-right">₱${(p.actual_cost_php || p.estimated_cost_php || 0).toLocaleString()}</td>
                                                </tr>
                                            `).join('') || '<tr><td colspan="3" class="italic text-gray-500 py-1">No projects recorded.</td></tr>'}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <!-- Sign Off -->
                            <div class="mt-16 pt-8 border-t border-gray-800 break-inside-avoid">
                                <div class="grid grid-cols-2 gap-16">
                                    <div class="text-center">
                                        <div class="border-b border-black mb-2 h-8"></div>
                                        <p class="font-bold text-sm">Prepared By</p>
                                        <p class="text-xs text-gray-500">EEC Officer</p>
                                    </div>
                                    <div class="text-center">
                                        <div class="border-b border-black mb-2 h-8"></div>
                                        <p class="font-bold text-sm">Approved By</p>
                                        <p class="text-xs text-gray-500">Local Chief Executive</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;

                    // Initialize Charts
                    initCharts();

                } catch (error) {
                    console.error("Error generating report:", error);
                    container.innerHTML = '<p class="text-red-500 text-center">Error loading report data.</p>';
                }
            }

            // --- INITIALIZATION ---
            document.addEventListener('DOMContentLoaded', async () => {
                window.addEventListener('hashchange', handleRouting);
                await initLguSelector(); // Initialize LGU selector before routing
                handleRouting(); // Initial load
            });

            // Export for testing
            if (typeof module !== 'undefined' && module.exports) {
                module.exports = {
                    initLguSelector,
                    handleRouting,
                    renderDashboard,
                    renderLguList,
                    initLguForm,
                    renderFsbdList,
                    initFsbdForm,
                    renderVehicleList,
                    initVehicleForm,
                    renderMadeList,
                    initMadeForm,
                    initConsumptionPage,
                    renderRioList,
                    initRioForm,
                    renderPpaList,
                    initPpaForm,
                    renderAdmin,
                    renderReporting
                };
            }