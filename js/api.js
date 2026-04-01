// Firestore data interaction functions

// --- Security Guards ---
function _requireWrite(module) {
    const user = window._getCurrentUser ? window._getCurrentUser() : null;
    if (!user) throw new Error('Not authenticated');
    if (user.role === 'Pending') throw new Error('Account pending approval');
    if (window._checkPermission && !window._checkPermission(module, 'write')) {
        throw new Error('Write permission denied for: ' + module);
    }
}

function _requireOrganizationMatch(dataOrganizationId) {
    const user = window._getCurrentUser ? window._getCurrentUser() : null;
    if (!user) return; 
    const restrictedRoles = ['Organization Admin', 'Organization EEC Officer', 'Organization Planner'];
    if (restrictedRoles.includes(user.role) && user.assignedOrganizationId) {
        if (dataOrganizationId && dataOrganizationId !== user.assignedOrganizationId) {
            throw new Error('Access denied: Cannot write data for a different Organization');
        }
    }
}

// --- Caching Helpers ---
const CACHE_TTL = 300000; // 5 minutes

function _getCachedData(cacheKey) {
    try {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return null;
        
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp > CACHE_TTL) {
            localStorage.removeItem(cacheKey);
            return null;
        }
        return data;
    } catch (e) {
        console.warn('Cache read error:', e);
        return null;
    }
}

function _setCachedData(cacheKey, data) {
    try {
        const cachePayload = {
            data: data,
            timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
    } catch (e) {
        console.warn('Cache write error:', e);
    }
}

function _invalidateCache(cacheKey) {
    try {
        localStorage.removeItem(cacheKey);
    } catch (e) {
        console.warn('Cache invalidation error:', e);
    }
}

// --- Organization Functions ---

/**
 * Fetches the list of all Organizations.
 * @returns {Promise<Array>} A promise that resolves to an array of Organization objects.
 */
async function getOrganizationList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_organizations';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('organizations').orderBy('name').get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        _setCachedData(cacheKey, data);
        return data;
    } catch (error) {
        console.error("Error fetching Organization list:", error);
        return [];
    }
}

/**
 * Creates a new Organization document in Firestore.
 * @param {object} data The Organization data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createOrganization(data) {
    _requireWrite('organizations');
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('organizations').add(data);
        console.log("Created new Organization with ID:", docRef.id);
        _invalidateCache('cache_organizations');
        return docRef.id;
    } catch (error) {
        console.error("Error creating Organization:", error);
        return null;
    }
}

/**
 * Updates an existing Organization document in Firestore.
 * @param {string} docId The ID of the document to update.
 * @param {object} data The data to update.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on error.
 */
async function updateOrganization(docId, data) {
    _requireWrite('organizations');
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('organizations').doc(docId).update(data);
        console.log("Updated Organization with ID:", docId);
        _invalidateCache('cache_organizations');
        return true;
    } catch (error) {
        console.error("Error updating Organization:", error);
        return false;
    }
}

/**
 * Gets a single Organization document from Firestore.
 * @param {string} docId The ID of the document to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the document data or null if not found.
 */
async function getOrganizationById(docId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await db.collection('organizations').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.error("No such Organization document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting Organization document:", error);
        return null;
    }
}

/**
 * Deletes an Organization document.
 * @param {string} docId 
 */
async function deleteOrganization(docId) {
    _requireWrite('organizations');
    if (!window.db) return false;
    try {
        await db.collection('organizations').doc(docId).delete();
        _invalidateCache('cache_organizations');
        return true;
    } catch (error) {
        console.error("Error deleting Organization:", error);
        return false;
    }
}

/**
 * Fetches the list of all buildings (FSBDs) from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of building objects.
 */
async function getFsbdList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_fsbds';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('fsbds').get();
        const fsbdList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched FSBDs:", fsbdList);
        _setCachedData(cacheKey, fsbdList);
        return fsbdList;
    } catch (error) {
        console.error("Error fetching FSBD list:", error);
        return [];
    }
}

/**
 * Creates a new building document in Firestore.
 * @param {object} data The building data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createFsbd(data) {
    _requireWrite('fsbds');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('fsbds').add(data);
        console.log("Created new FSBD with ID:", docRef.id);
        _invalidateCache('cache_fsbds');
        return docRef.id;
    } catch (error) {
        console.error("Error creating FSBD:", error);
        return null;
    }
}

/**
 * Updates an existing building document in Firestore.
 * @param {string} docId The ID of the document to update.
 * @param {object} data The data to update.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on error.
 */
async function updateFsbd(docId, data) {
    _requireWrite('fsbds');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('fsbds').doc(docId).update(data);
        console.log("Updated FSBD with ID:", docId);
        _invalidateCache('cache_fsbds');
        return true;
    } catch (error) {
        console.error("Error updating FSBD:", error);
        return false;
    }
}

/**
 * Gets a single building document from Firestore.
 * @param {string} docId The ID of the document to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the document data or null if not found.
 */
async function getFsbdById(docId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await db.collection('fsbds').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.error("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting document:", error);
        return null;
    }
}

/**
 * Deletes an FSBD document.
 * @param {string} docId 
 */
async function deleteFsbd(docId) {
    _requireWrite('fsbds');
    if (!window.db) return false;
    try {
        await db.collection('fsbds').doc(docId).delete();
        _invalidateCache('cache_fsbds');
        return true;
    } catch (error) {
        console.error("Error deleting FSBD:", error);
        return false;
    }
}

// --- Vehicle Functions ---

/**
 * Fetches the list of all vehicles from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of vehicle objects.
 */
async function getVehicleList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_vehicles';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('vehicles').get();
        const vehicleList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched Vehicles:", vehicleList);
        _setCachedData(cacheKey, vehicleList);
        return vehicleList;
    } catch (error) {
        console.error("Error fetching vehicle list:", error);
        return [];
    }
}

/**
 * Creates a new vehicle document in Firestore.
 * @param {object} data The vehicle data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createVehicle(data) {
    _requireWrite('vehicles');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('vehicles').add(data);
        console.log("Created new Vehicle with ID:", docRef.id);
        _invalidateCache('cache_vehicles');
        return docRef.id;
    } catch (error) {
        console.error("Error creating vehicle:", error);
        return null;
    }
}

/**
 * Updates an existing vehicle document in Firestore.
 * @param {string} docId The ID of the document to update.
 * @param {object} data The data to update.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on error.
 */
async function updateVehicle(docId, data) {
    _requireWrite('vehicles');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('vehicles').doc(docId).update(data);
        console.log("Updated Vehicle with ID:", docId);
        _invalidateCache('cache_vehicles');
        return true;
    } catch (error) {
        console.error("Error updating vehicle:", error);
        return false;
    }
}

/**
 * Gets a single vehicle document from Firestore.
 * @param {string} docId The ID of the document to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the document data or null if not found.
 */
async function getVehicleById(docId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await db.collection('vehicles').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.error("No such vehicle document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting vehicle document:", error);
        return null;
    }
}

/**
 * Deletes a Vehicle document.
 * @param {string} docId 
 */
async function deleteVehicle(docId) {
    _requireWrite('vehicles');
    if (!window.db) return false;
    try {
        await db.collection('vehicles').doc(docId).delete();
        _invalidateCache('cache_vehicles');
        return true;
    } catch (error) {
        console.error("Error deleting Vehicle:", error);
        return false;
    }
}

// --- MADE Functions ---

/**
 * Fetches the list of all MADE equipment from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of equipment objects.
 */
async function getMadeList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_made';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('made_equipment').get();
        const madeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched MADE Equipment:", madeList);
        _setCachedData(cacheKey, madeList);
        return madeList;
    } catch (error) {
        console.error("Error fetching MADE list:", error);
        return [];
    }
}

/**
 * Creates a new MADE equipment document in Firestore.
 * @param {object} data The equipment data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createMade(data) {
    _requireWrite('made');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('made_equipment').add(data);
        console.log("Created new MADE Equipment with ID:", docRef.id);
        _invalidateCache('cache_made');
        return docRef.id;
    } catch (error) {
        console.error("Error creating MADE equipment:", error);
        return null;
    }
}

/**
 * Updates an existing MADE equipment document in Firestore.
 * @param {string} docId The ID of the document to update.
 * @param {object} data The data to update.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on error.
 */
async function updateMade(docId, data) {
    _requireWrite('made');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('made_equipment').doc(docId).update(data);
        console.log("Updated MADE Equipment with ID:", docId);
        _invalidateCache('cache_made');
        return true;
    } catch (error) {
        console.error("Error updating MADE equipment:", error);
        return false;
    }
}

/**
 * Gets a single MADE equipment document from Firestore.
 * @param {string} docId The ID of the document to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the document data or null if not found.
 */
async function getMadeById(docId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await db.collection('made_equipment').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.error("No such MADE equipment document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting MADE equipment document:", error);
        return null;
    }
}

/**
 * Deletes a MADE equipment document.
 * @param {string} docId 
 */
async function deleteMade(docId) {
    _requireWrite('made');
    if (!window.db) return false;
    try {
        await db.collection('made_equipment').doc(docId).delete();
        _invalidateCache('cache_made');
        return true;
    } catch (error) {
        console.error("Error deleting MADE:", error);
        return false;
    }
}

// --- User Management Functions ---

/**
 * Fetches the list of all users from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects.
 */
async function getUserList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_users';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('users').get();
        const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        _setCachedData(cacheKey, userList);
        return userList;
    } catch (error) {
        console.error("Error fetching user list:", error);
        return [];
    }
}

/**
 * Updates a user's permissions in Firestore.
 * @param {string} uid The user's ID.
 * @param {object} permissions The permissions object.
 * @returns {Promise<boolean>}
 */
/**
 * Updates a user's role, permissions, and Organization assignment with escalation guards.
 * @param {string} uid Target user ID.
 * @param {object} data { role, permissions, assignedOrganizationId }
 */
async function updateUserRole(uid, data) {
    _requireWrite('users');
    const currentUser = window._getCurrentUser ? window._getCurrentUser() : null;
    
    // 1. Basic check: System Admin can do anything
    if (currentUser.role !== 'System Admin') {
        // Hierarchy level checks
        const ROLE_LEVELS = {
            'System Admin': 100,
            'Organization Admin': 50,
            'Organization EEC Officer': 20,
            'Auditor': 20,
            'Organization Planner': 20,
            'Pending': 0
        };

        const myLevel = ROLE_LEVELS[currentUser.role] || 0;
        const targetLevel = ROLE_LEVELS[data.role] || 0;

        // Escalation ceiling: Cannot assign a role >= your own
        if (targetLevel >= myLevel) {
            throw new Error(`Permission denied: You cannot assign the role "${data.role}" as it is equal to or higher than your own level.`);
        }

        // Organization Scope check
        if (currentUser.assignedOrganizationId && data.assignedOrganizationId !== currentUser.assignedOrganizationId && data.assignedOrganizationId !== null) {
            throw new Error('Permission denied: You can only manage users within your own Organization.');
        }

        // Check if target user is current a System Admin
        try {
            const targetDoc = await db.collection('users').doc(uid).get();
            if (targetDoc.exists && targetDoc.data().role === 'System Admin') {
                throw new Error('Permission denied: Non-System Admins cannot modify System Admin accounts.');
            }
        } catch (e) {
            if (e.message.includes('Permission denied')) throw e;
            // Ignore other fetch errors and proceed to let Firestore handle it
        }
    }

    if (!window.db) return false;
    try {
        await db.collection('users').doc(uid).update({ 
            role: data.role,
            permissions: data.permissions,
            assignedOrganizationId: data.assignedOrganizationId 
        });
        _invalidateCache('cache_users');
        return true;
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
}

/**
 * Updates a user's permissions in Firestore.
 * @param {string} uid The user's ID.
 * @param {object} permissions The permissions object.
 * @returns {Promise<boolean>}
 */
async function updateUserPermissions(uid, permissions) {
    _requireWrite('users');
    if (!window.db) return false;
    try {
        await db.collection('users').doc(uid).update({ permissions });
        _invalidateCache('cache_users');
        return true;
    } catch (error) {
        console.error("Error updating user permissions:", error);
        return false;
    }
}

/**
 * Fetches the global default permissions for new users.
 * @returns {Promise<object>}
 */
async function getDefaultPermissions() {
    if (!window.db) return {};
    try {
        const doc = await db.collection('settings').doc('default_permissions').get();
        return doc.exists ? doc.data().permissions : {};
    } catch (error) {
        console.error("Error fetching default permissions:", error);
        return {};
    }
}

/**
 * Updates the global default permissions.
 * @param {object} permissions 
 * @returns {Promise<boolean>}
 */
async function updateDefaultPermissions(permissions) {
    _requireWrite('users');
    if (!window.db) return false;
    try {
        await db.collection('settings').doc('default_permissions').set({ permissions });
        return true;
    } catch (error) {
        console.error("Error updating default permissions:", error);
        return false;
    }
}

// --- Sample Data Management ---

const SAMPLE_DATA = {
    organizations: [
        { id: 'sample_organization_1', name: 'City of Pasig', region: 'NCR', province: 'Metro Manila', date_registered: new Date() },
        { id: 'sample_organization_2', name: 'Municipality of Cainta', region: 'Region 4A', province: 'Rizal', date_registered: new Date() },
        { id: 'sample_organization_3', name: 'Quezon City', region: 'NCR', province: 'Metro Manila', date_registered: new Date() }
    ],
    fsbds: [
        // Pasig Assets (Expanded Procedurally Down Below)
        // Cainta Assets (Expanded)
        { id: 'sample_fsbd_4', organizationId: 'sample_organization_2', name: 'Cainta Municipal Hall', fsbd_type: 'Office Building', address: 'Cainta, Rizal', construction_year: 1985, floor_area_sqm: 3000 },
        { id: 'sample_fsbd_5', organizationId: 'sample_organization_2', name: 'Cainta Public Market', fsbd_type: 'Market', address: 'Cainta, Rizal', construction_year: 2010, floor_area_sqm: 5000 },
        { id: 'sample_fsbd_6', organizationId: 'sample_organization_2', name: 'Cainta Elementary School', fsbd_type: 'School', address: 'Sto. Domingo, Cainta', construction_year: 1998, floor_area_sqm: 4500 },
        // Quezon City Assets (New)
        { id: 'sample_fsbd_7', organizationId: 'sample_organization_3', name: 'Quezon City Hall', fsbd_type: 'Office Building', address: 'Elliptical Road, QC', construction_year: 1970, floor_area_sqm: 25000 },
        { id: 'sample_fsbd_8', organizationId: 'sample_organization_3', name: 'Quezon City General Hospital', fsbd_type: 'Hospital', address: 'Seminary Rd, QC', construction_year: 1980, floor_area_sqm: 15000 },
        { id: 'sample_fsbd_9', organizationId: 'sample_organization_3', name: 'Amoranto Sports Complex', fsbd_type: 'Sports Complex', address: 'Roces Ave, QC', construction_year: 1960, floor_area_sqm: 10000 }
    ],
    vehicles: [
        // Pasig Fleet (Expanded Procedurally Down Below)
        // Cainta Fleet (Expanded)
        { id: 'sample_veh_4', organizationId: 'sample_organization_2', plate_number: 'SDD-4444', make: 'Mitsubishi', model: 'L300', year_model: 2021, fuel_type: 'Diesel' },
        { id: 'sample_veh_5', organizationId: 'sample_organization_2', plate_number: 'SEE-5555', make: 'Toyota', model: 'Vios', year_model: 2017, fuel_type: 'Gasoline' },
        { id: 'sample_veh_6', organizationId: 'sample_organization_2', plate_number: 'SFF-6666', make: 'Toyota', model: 'Hiace Ambulance', year_model: 2022, fuel_type: 'Diesel' },
        // Quezon City Fleet (New)
        { id: 'sample_veh_7', organizationId: 'sample_organization_3', plate_number: 'SGG-7777', make: 'Hino', model: 'Bus', year_model: 2019, fuel_type: 'Diesel' },
        { id: 'sample_veh_8', organizationId: 'sample_organization_3', plate_number: 'SHH-8888', make: 'Toyota', model: 'Vios Patrol', year_model: 2020, fuel_type: 'Gasoline' },
        { id: 'sample_veh_9', organizationId: 'sample_organization_3', plate_number: 'SII-9999', make: 'Isuzu', model: 'Garbage Compactor', year_model: 2018, fuel_type: 'Diesel' }
    ],
    made_equipment: [
        // Pasig (Expanded Procedurally Down Below)
        // Cainta (New)
        { id: 'sample_made_5', fsbdId: 'sample_fsbd_4', description_of_equipment: 'Split Type AC Units', energy_use_category: 'ACU', location: 'Offices', power_rating_kw: 40, time_of_use_hours_per_day: 9 },
        { id: 'sample_made_6', fsbdId: 'sample_fsbd_5', description_of_equipment: 'Industrial Freezers', energy_use_category: 'Refrigeration', location: 'Meat Section', power_rating_kw: 15, time_of_use_hours_per_day: 24 },
        // QC (New)
        { id: 'sample_made_7', fsbdId: 'sample_fsbd_7', description_of_equipment: 'Chiller Plant', energy_use_category: 'ACU', location: 'Basement', power_rating_kw: 300, time_of_use_hours_per_day: 12 },
        { id: 'sample_made_8', fsbdId: 'sample_fsbd_8', description_of_equipment: 'CT Scan', energy_use_category: 'Medical Equipment', location: 'Imaging Dept', power_rating_kw: 50, time_of_use_hours_per_day: 24 },
        { id: 'sample_made_9', fsbdId: 'sample_fsbd_9', description_of_equipment: 'Stadium Floodlights', energy_use_category: 'Lighting', location: 'Field', power_rating_kw: 100, time_of_use_hours_per_day: 4 }
    ],
    mecr_reports: [
        // Pasig City (Expanded Procedurally Down Below)

        // Cainta Municipal Hall (6 months) - New
        { id: 'sample_mecr_4_1', fsbdId: 'sample_fsbd_4', reporting_year: 2023, reporting_month: 1, electricity_consumption_kwh: 12000, cost_php: 120000 },
        { id: 'sample_mecr_4_2', fsbdId: 'sample_fsbd_4', reporting_year: 2023, reporting_month: 2, electricity_consumption_kwh: 11500, cost_php: 115000 },
        { id: 'sample_mecr_4_3', fsbdId: 'sample_fsbd_4', reporting_year: 2023, reporting_month: 3, electricity_consumption_kwh: 13000, cost_php: 130000 },
        { id: 'sample_mecr_4_4', fsbdId: 'sample_fsbd_4', reporting_year: 2023, reporting_month: 4, electricity_consumption_kwh: 14500, cost_php: 145000 },
        { id: 'sample_mecr_4_5', fsbdId: 'sample_fsbd_4', reporting_year: 2023, reporting_month: 5, electricity_consumption_kwh: 15000, cost_php: 150000 },
        { id: 'sample_mecr_4_6', fsbdId: 'sample_fsbd_4', reporting_year: 2023, reporting_month: 6, electricity_consumption_kwh: 14000, cost_php: 140000 },
        // QC Hall (6 months) - New
        { id: 'sample_mecr_7_1', fsbdId: 'sample_fsbd_7', reporting_year: 2023, reporting_month: 1, electricity_consumption_kwh: 150000, cost_php: 1500000 },
        { id: 'sample_mecr_7_2', fsbdId: 'sample_fsbd_7', reporting_year: 2023, reporting_month: 2, electricity_consumption_kwh: 145000, cost_php: 1450000 },
        { id: 'sample_mecr_7_3', fsbdId: 'sample_fsbd_7', reporting_year: 2023, reporting_month: 3, electricity_consumption_kwh: 160000, cost_php: 1600000 },
        { id: 'sample_mecr_7_4', fsbdId: 'sample_fsbd_7', reporting_year: 2023, reporting_month: 4, electricity_consumption_kwh: 175000, cost_php: 1750000 },
        { id: 'sample_mecr_7_5', fsbdId: 'sample_fsbd_7', reporting_year: 2023, reporting_month: 5, electricity_consumption_kwh: 180000, cost_php: 1800000 },
        { id: 'sample_mecr_7_6', fsbdId: 'sample_fsbd_7', reporting_year: 2023, reporting_month: 6, electricity_consumption_kwh: 170000, cost_php: 1700000 },
        // Cainta Public Market (6 months)
        { id: 'sample_mecr_5_1', fsbdId: 'sample_fsbd_5', reporting_year: 2023, reporting_month: 1, electricity_consumption_kwh: 5200, cost_php: 52000 },
        { id: 'sample_mecr_5_2', fsbdId: 'sample_fsbd_5', reporting_year: 2023, reporting_month: 2, electricity_consumption_kwh: 4800, cost_php: 48000 },
        { id: 'sample_mecr_5_3', fsbdId: 'sample_fsbd_5', reporting_year: 2023, reporting_month: 3, electricity_consumption_kwh: 5500, cost_php: 55000 },
        { id: 'sample_mecr_5_4', fsbdId: 'sample_fsbd_5', reporting_year: 2023, reporting_month: 4, electricity_consumption_kwh: 6000, cost_php: 60000 },
        { id: 'sample_mecr_5_5', fsbdId: 'sample_fsbd_5', reporting_year: 2023, reporting_month: 5, electricity_consumption_kwh: 6200, cost_php: 62000 },
        { id: 'sample_mecr_5_6', fsbdId: 'sample_fsbd_5', reporting_year: 2023, reporting_month: 6, electricity_consumption_kwh: 5800, cost_php: 58000 },
        // QC General Hospital (6 months)
        { id: 'sample_mecr_8_1', fsbdId: 'sample_fsbd_8', reporting_year: 2023, reporting_month: 1, electricity_consumption_kwh: 95000, cost_php: 950000 },
        { id: 'sample_mecr_8_2', fsbdId: 'sample_fsbd_8', reporting_year: 2023, reporting_month: 2, electricity_consumption_kwh: 92000, cost_php: 920000 },
        { id: 'sample_mecr_8_3', fsbdId: 'sample_fsbd_8', reporting_year: 2023, reporting_month: 3, electricity_consumption_kwh: 98000, cost_php: 980000 },
        { id: 'sample_mecr_8_4', fsbdId: 'sample_fsbd_8', reporting_year: 2023, reporting_month: 4, electricity_consumption_kwh: 105000, cost_php: 1050000 },
        { id: 'sample_mecr_8_5', fsbdId: 'sample_fsbd_8', reporting_year: 2023, reporting_month: 5, electricity_consumption_kwh: 110000, cost_php: 1100000 },
        { id: 'sample_mecr_8_6', fsbdId: 'sample_fsbd_8', reporting_year: 2023, reporting_month: 6, electricity_consumption_kwh: 108000, cost_php: 1080000 }
    ],
    trip_tickets: [
        // Pasig City (Expanded Procedurally Down Below)

        // Cainta Ambulance
        { id: 'sample_tt_6_1', vehicleId: 'sample_veh_6', date: '2023-03-01', driver: 'Jose M.', destination: 'Provincial Hospital', purpose: 'Patient Transfer', odometerStart: 8500, odometerEnd: 8540, fuelLiters: 10 },
        // QC Bus
        { id: 'sample_tt_7_1', vehicleId: 'sample_veh_7', date: '2023-04-12', driver: 'Arthur', destination: 'Various Barangays', purpose: 'Free Ride Program', odometerStart: 21000, odometerEnd: 21200, fuelLiters: 80 }
    ],
    rios: [
        // Pasig (Existing)
        { id: 'sample_rio_1', fsbdId: 'sample_fsbd_1', seuFindingIds: ['sample_seu_1'], proposed_action: 'Replace AC Units with Inverter Type', priority: 'High', status: 'Identified', estimated_cost_php: 2000000, estimated_savings_php: 300000 },
        { id: 'sample_rio_2', fsbdId: 'sample_fsbd_1', proposed_action: 'Install Solar PV System (100kWp)', priority: 'High', status: 'Planned', estimated_cost_php: 5000000, estimated_savings_php: 800000 },
        { id: 'sample_rio_3', fsbdId: 'sample_fsbd_2', proposed_action: 'Upgrade Sports Center Lighting to LED', priority: 'Medium', status: 'In Progress', estimated_cost_php: 500000, estimated_savings_php: 120000 },
        { id: 'sample_rio_4', vehicleId: 'sample_veh_3', seuFindingIds: ['sample_seu_2'], proposed_action: 'Route Optimization for Garbage Trucks', priority: 'High', status: 'Identified', estimated_cost_php: 50000, estimated_savings_php: 200000 },
        { id: 'sample_rio_5', fsbdId: 'sample_fsbd_4', proposed_action: 'Window Tinting for Heat Reduction', priority: 'Low', status: 'Identified', estimated_cost_php: 100000, estimated_savings_php: 15000 },
        { id: 'sample_rio_6', fsbdId: 'sample_fsbd_5', proposed_action: 'Solar Streetlights for Market Perimeter', priority: 'Medium', status: 'Planned', estimated_cost_php: 300000, estimated_savings_php: 40000 },
        // Cainta (New)
        { id: 'sample_rio_7', fsbdId: 'sample_fsbd_6', seuFindingIds: ['sample_seu_3'], proposed_action: 'LED Retrofit for Classrooms', priority: 'High', status: 'Planned', estimated_cost_php: 200000, estimated_savings_php: 50000 },
        { id: 'sample_rio_8', vehicleId: 'sample_veh_6', proposed_action: 'Preventive Maintenance Schedule', priority: 'Medium', status: 'In Progress', estimated_cost_php: 20000, estimated_savings_php: 10000 },
        // QC (New)
        { id: 'sample_rio_9', fsbdId: 'sample_fsbd_7', seuFindingIds: ['sample_seu_4'], proposed_action: 'Chiller Plant Upgrade', priority: 'High', status: 'Identified', estimated_cost_php: 10000000, estimated_savings_php: 2000000 },
        { id: 'sample_rio_10', fsbdId: 'sample_fsbd_9', proposed_action: 'Solar Roof for Sports Complex', priority: 'Medium', status: 'Planned', estimated_cost_php: 8000000, estimated_savings_php: 900000 },
        { id: 'sample_rio_11', vehicleId: 'sample_veh_7', proposed_action: 'Driver Eco-Driving Training', priority: 'Low', status: 'Completed', estimated_cost_php: 50000, estimated_savings_php: 30000 }
    ],
    ppas: [
        // Pasig (Existing)
        { id: 'sample_ppa_1', project_name: 'City Hall Solarization Project', status: 'Planned', estimated_cost_php: 5000000, relatedRioIds: ['sample_rio_2'] },
        { id: 'sample_ppa_2', project_name: 'Sports Complex LED Retrofit', status: 'Ongoing', estimated_cost_php: 500000, actual_cost_php: 480000, relatedRioIds: ['sample_rio_3'] },
        { id: 'sample_ppa_3', project_name: 'Fleet Management System Implementation', status: 'Planned', estimated_cost_php: 150000, relatedRioIds: ['sample_rio_4'] },
        // Cainta (New)
        { id: 'sample_ppa_4', project_name: 'School Energy Efficiency Program', status: 'Planned', estimated_cost_php: 200000, relatedRioIds: ['sample_rio_7'] },
        // QC (New)
        { id: 'sample_ppa_5', project_name: 'QC Hall Chiller Replacement', status: 'Planned', estimated_cost_php: 10000000, relatedRioIds: ['sample_rio_9'] },
        { id: 'sample_ppa_6', project_name: 'Eco-Driving Certification', status: 'Completed', estimated_cost_php: 50000, actual_cost_php: 45000, relatedRioIds: ['sample_rio_11'] }
    ],
    seu_findings: [
        { id: 'sample_seu_1', fsbdId: 'sample_fsbd_101', energy_use_category: 'ACU', finding_description: 'High consumption AC units', identification_method: 'Calculated', status: 'Identified' },
        { id: 'sample_seu_2', vehicleId: 'sample_veh_103', energy_use_category: 'Fuel Consumption', finding_description: 'Inefficient Garbage Truck', identification_method: 'Historical Average', status: 'Identified' },
        { id: 'sample_seu_3', fsbdId: 'sample_fsbd_6', energy_use_category: 'Lighting', finding_description: 'Old lighting fixtures', identification_method: 'Audit', status: 'Identified' },
        { id: 'sample_seu_4', fsbdId: 'sample_fsbd_7', energy_use_category: 'ACU', finding_description: 'Chiller plant optimization needed', identification_method: 'Calculated', status: 'Identified' }
    ]
};

// Procedurally generate extensive data for Pasig City to showcase dense historical reporting
function generatePasigData() {
    const organizationId = 'sample_organization_1';
    
    // 1 Organization, 10 Buildings, 20 Vehicles
    const fsbds = [
        { id: 'sample_fsbd_101', organizationId, name: 'Pasig City Hall Main', fsbd_type: 'Office Building', address: 'Caruncho Ave, Pasig', construction_year: 1990, floor_area_sqm: 15000 },
        { id: 'sample_fsbd_102', organizationId, name: 'Pasig Sports Center', fsbd_type: 'Sports Complex', address: 'Pasig City', construction_year: 2000, floor_area_sqm: 8000 },
        { id: 'sample_fsbd_103', organizationId, name: 'Pasig General Hospital', fsbd_type: 'Hospital', address: 'Maybunga, Pasig', construction_year: 1995, floor_area_sqm: 12000 },
        { id: 'sample_fsbd_104', organizationId, name: 'Rave Park Administration', fsbd_type: 'Office Building', address: 'Rainforest Park, Pasig', construction_year: 2005, floor_area_sqm: 2000 },
        { id: 'sample_fsbd_105', organizationId, name: 'Pasig Mega Market', fsbd_type: 'Market', address: 'San Nicolas, Pasig', construction_year: 1980, floor_area_sqm: 20000 },
        { id: 'sample_fsbd_106', organizationId, name: 'Rizal High School Main', fsbd_type: 'School', address: 'Caniogan, Pasig', construction_year: 1975, floor_area_sqm: 18000 },
        { id: 'sample_fsbd_107', organizationId, name: 'Pinagbuhatan High School', fsbd_type: 'School', address: 'Pinagbuhatan, Pasig', construction_year: 2010, floor_area_sqm: 5000 },
        { id: 'sample_fsbd_108', organizationId, name: 'PCGH Extension Annex', fsbd_type: 'Hospital', address: 'Maybunga, Pasig', construction_year: 2018, floor_area_sqm: 4000 },
        { id: 'sample_fsbd_109', organizationId, name: 'Pasig City Science High', fsbd_type: 'School', address: 'Maybunga, Pasig', construction_year: 2008, floor_area_sqm: 6000 },
        { id: 'sample_fsbd_110', organizationId, name: 'City Library and Museum', fsbd_type: 'Office Building', address: 'Plaza Rizal, Pasig', construction_year: 1960, floor_area_sqm: 1500 }
    ];

    const vehicles = [];
    for(let i=1; i<=20; i++) {
        vehicles.push({
            id: `sample_veh_10${i}`,
            organizationId,
            plate_number: `PAS-${1000+i}`,
            make: i % 3 === 0 ? 'Toyota' : (i % 2 === 0 ? 'Mitsubishi' : 'Isuzu'),
            model: i % 3 === 0 ? 'Innova' : (i % 2 === 0 ? 'L300' : 'Garbage Truck'),
            year_model: 2015 + (i % 8),
            fuel_type: i % 5 === 0 ? 'Gasoline' : 'Diesel'
        });
    }

    const made_equipment = [];
    fsbds.forEach(b => {
        // Base AC
        made_equipment.push({ id: `sample_made_ac_${b.id}`, fsbdId: b.id, description_of_equipment: 'HVAC Units', energy_use_category: 'ACU', location: 'Various', power_rating_kw: (b.floor_area_sqm / 100), time_of_use_hours_per_day: 10 });
        // Base Lighting
        made_equipment.push({ id: `sample_made_light_${b.id}`, fsbdId: b.id, description_of_equipment: 'Fluorescent/LED Mix', energy_use_category: 'Lighting', location: 'All Floors', power_rating_kw: (b.floor_area_sqm / 500), time_of_use_hours_per_day: 12 });
        
        if (b.fsbd_type === 'Hospital') {
            made_equipment.push({ id: `sample_made_med_${b.id}`, fsbdId: b.id, description_of_equipment: 'Medical Imaging', energy_use_category: 'Medical Equipment', location: 'Radiology', power_rating_kw: 150, time_of_use_hours_per_day: 8 });
        }
    });

    const mecr_reports = [];
    // 2 years of data (2023, 2024, half of 2025)
    [2023, 2024, 2025].forEach(year => {
        const maxMonth = year === 2025 ? 6 : 12;
        for(let month=1; month<=maxMonth; month++) {
            fsbds.forEach(b => {
                const baseKwh = b.floor_area_sqm * 3; // Approx 3 kWh per sqm
                // Add some seasonal variation (higher in summer: Mar-May)
                const isSummer = (month >= 3 && month <= 5);
                const variation = isSummer ? 1.2 : 0.9;
                const randomNoise = 0.95 + (Math.random() * 0.1); // +/- 5%
                
                const kwh = Math.floor(baseKwh * variation * randomNoise);
                // Approx 10.5 PHP per kWh
                const cost = Math.floor(kwh * 10.5);
                
                mecr_reports.push({
                    id: `sample_mecr_${b.id}_${year}_${month}`,
                    fsbdId: b.id,
                    reporting_year: year,
                    reporting_month: month,
                    electricity_consumption_kwh: kwh,
                    cost_php: cost
                });
            });
        }
    });

    const trip_tickets = [];
    // Daily trips for a year and a half for every vehicle
    const startObj = new Date('2024-01-01T00:00:00Z');
    vehicles.forEach((v, index) => {
        let currentOdo = 50000 + Math.floor(Math.random() * 20000); // Start between 50k and 70k
        for (let day=0; day<540; day++) { // 1.5 years
             // Skip weekends mostly
             const date = new Date(startObj.getTime() + (day * 24 * 60 * 60 * 1000));
             const dayOfWeek = date.getDay();
             if (dayOfWeek === 0 || dayOfWeek === 6) {
                 if (Math.random() > 0.2) continue; // 80% chance to skip weekends
             }

             const dateStr = date.toISOString().split('T')[0];
             const isTruck = v.model.includes('Truck');
             const tripDist = Math.floor(Math.random() * (isTruck ? 100 : 40)) + 10; // 10-50km for cars, 10-110km for trucks
             
             const endOdo = currentOdo + tripDist;
             // Fuel efficiency: Cars ~ 10km/L, Trucks ~ 4km/L
             const efficiency = isTruck ? 4 : 10;
             const fuelLiters = Number((tripDist / efficiency).toFixed(2));
             // ~60 php per liter
             const fuelCost = Math.floor(fuelLiters * 60);

             trip_tickets.push({
                 id: `sample_tt_${v.id}_${day}`,
                 vehicleId: v.id,
                 date: dateStr,
                 driver: `Driver ${index+1}`,
                 destination: `Destination ${Math.floor(Math.random()*15)}`,
                 purpose: isTruck ? 'Waste Management' : 'Official Business',
                 odometerStart: currentOdo,
                 odometerEnd: endOdo,
                 fuelLiters: fuelLiters,
                 fuelCost: fuelCost
             });
             currentOdo = endOdo;
        }
    });

    return { fsbds, vehicles, made_equipment, mecr_reports, trip_tickets };
}

// Inject procedurally generated data into SAMPLE_DATA
const generated = generatePasigData();
SAMPLE_DATA.fsbds.push(...generated.fsbds);
SAMPLE_DATA.vehicles.push(...generated.vehicles);
SAMPLE_DATA.made_equipment.push(...generated.made_equipment);
SAMPLE_DATA.mecr_reports.push(...generated.mecr_reports);
SAMPLE_DATA.trip_tickets.push(...generated.trip_tickets);

async function checkSampleDataExists() {
    if (!window.db) return false;
    try {
        const doc = await db.collection('organizations').doc('sample_organization_1').get();
        return doc.exists;
    } catch (error) {
        console.error("Error checking sample data:", error);
        return false;
    }
}

async function createSampleData() {
    _requireWrite('admin');
    if (!window.db) return false;

    try {
        let batches = [];
        let currentBatch = db.batch();
        let operationCount = 0;

        // Iterate over all collections in SAMPLE_DATA
        for (const [collectionName, items] of Object.entries(SAMPLE_DATA)) {
            for (const item of items) {
                const ref = db.collection(collectionName).doc(item.id);
                currentBatch.set(ref, item);
                operationCount++;

                if (operationCount >= 450) {
                    batches.push(currentBatch.commit());
                    currentBatch = db.batch(); // Start a new batch
                    operationCount = 0;
                }
            }
        }

        // Commit the last remaining batch if it has operations
        if (operationCount > 0) {
            batches.push(currentBatch.commit());
        }

        await Promise.all(batches);
        console.log("Sample data created successfully in batches.");
        return true;
    } catch (error) {
        console.error("Error creating sample data:", error);
        return false;
    }
}

async function deleteSampleData() {
    _requireWrite('admin');
    if (!window.db) return false;

    try {
        let batches = [];
        let currentBatch = db.batch();
        let operationCount = 0;

        // Iterate over all collections in SAMPLE_DATA
        for (const [collectionName, items] of Object.entries(SAMPLE_DATA)) {
            for (const item of items) {
                const ref = db.collection(collectionName).doc(item.id);
                currentBatch.delete(ref);
                operationCount++;

                if (operationCount >= 450) {
                    batches.push(currentBatch.commit());
                    currentBatch = db.batch(); // Start a new batch
                    operationCount = 0;
                }
            }
        }

        // Commit the last remaining batch if it has operations
        if (operationCount > 0) {
            batches.push(currentBatch.commit());
        }

        await Promise.all(batches);
        console.log("Sample data deleted successfully in batches.");
        return true;
    } catch (error) {
        console.error("Error deleting sample data:", error);
        return false;
    }
}

// --- SEU Functions ---

/**
 * Fetches the list of all SEU findings from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of SEU objects.
 */
async function getSeuList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_seu';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('seu_findings').get();
        const seuList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched SEUs:", seuList);
        _setCachedData(cacheKey, seuList);
        return seuList;
    } catch (error) {
        console.error("Error fetching SEU list:", error);
        return [];
    }
}

/**
 * Creates a new SEU finding document in Firestore.
 * @param {object} data The SEU data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createSeu(data) {
    _requireWrite('seu');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('seu_findings').add(data);
        console.log("Created new SEU finding with ID:", docRef.id);
        _invalidateCache('cache_seu');
        return docRef.id;
    } catch (error) {
        console.error("Error creating SEU finding:", error);
        return null;
    }
}

/**
 * Deletes an SEU finding document.
 * @param {string} docId 
 */
async function deleteSeu(docId) {
    _requireWrite('seu');
    if (!window.db) return false;
    try {
        await db.collection('seu_findings').doc(docId).delete();
        _invalidateCache('cache_seu');
        return true;
    } catch (error) {
        console.error("Error deleting SEU finding:", error);
        return false;
    }
}

// Export for Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getOrganizationList, createOrganization, updateOrganization, getOrganizationById, deleteOrganization,
        getFsbdList, createFsbd, updateFsbd, getFsbdById, deleteFsbd,
        getVehicleList, createVehicle, updateVehicle, getVehicleById, deleteVehicle,
        getMadeList, createMade, updateMade, getMadeById, deleteMade,
        getMecrReports, createMecrReport, deleteMecrReport,
        getTripTickets, createTripTicket, deleteTripTicket,
        getRioList, createRio, updateRio, getRioById, deleteRio,
        getPpaList, createPpa, updatePpa, getPpaById, deletePpa,
        getUserList, updateUserRole, updateUserPermissions, getDefaultPermissions, updateDefaultPermissions,
        checkSampleDataExists, createSampleData, deleteSampleData,
        getSeuList, createSeu, deleteSeu
    };
}

// --- Consumption Report Functions (MECR) ---

/**
 * Fetches electricity consumption reports.
 * @param {string|null} fsbdId Optional building ID to filter by.
 * @returns {Promise<Array>}
 */
async function getMecrReports(fsbdId = null) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = fsbdId ? `cache_mecr_${fsbdId}` : 'cache_mecr_all';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        let query = db.collection('mecr_reports');
        if (fsbdId) {
            query = query.where('fsbdId', '==', fsbdId);
        }
        const snapshot = await query.get();
        const reportList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Client-side sort: Year desc, then Month desc
        reportList.sort((a, b) => (b.reporting_year - a.reporting_year) || (b.reporting_month - a.reporting_month));
        
        console.log("Fetched MECR reports:", reportList);
        _setCachedData(cacheKey, reportList);
        return reportList;
    } catch (error) {
        console.error("Error fetching MECR reports:", error);
        return [];
    }
}

/**
 * Creates a new electricity consumption report document in Firestore.
 * @param {object} data The report data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createMecrReport(data) {
    _requireWrite('consumption');
    // Note: MECR/MFCR require deeper Organization validation via the parent asset (FSBD/Vehicle)
    // For now, we validate if the report object itself has an organizationId if provided.
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('mecr_reports').add(data);
        console.log("Created new MECR report with ID:", docRef.id);
        _invalidateCache('cache_mecr_all');
        if (data.fsbdId) _invalidateCache(`cache_mecr_${data.fsbdId}`);
        return docRef.id;
    } catch (error) {
        console.error("Error creating MECR report:", error);
        return null;
    }
}

/**
 * Deletes a MECR report.
 * @param {string} docId 
 */
async function deleteMecrReport(docId) {
    _requireWrite('consumption');
    if (!window.db) return false;
    try {
        // Need to invalidate scoped cache too, but we might not have fsbdId.
        // For safety, clear all MECR caches starting with 'cache_mecr_' or just clear all as it's rare.
        // Better: Fetch doc briefly or accept fsbdId as param. 
        // Simple fix: clear the 'all' cache and any common ones.
        await db.collection('mecr_reports').doc(docId).delete();
        _invalidateCache('cache_mecr_all');
        // We could iterate localStorage keys to find matching prefixes if we really wanted to be surgical.
        return true;
    } catch (error) {
        console.error("Error deleting MECR report:", error);
        return false;
    }
}

// --- Trip Tickets Functions (Fuel) ---

/**
 * Fetches all Trip Tickets for a specific vehicle.
 * @param {string} vehicleId The ID of the vehicle.
 * @returns {Promise<Array>} A promise that resolves to an array of Trip Ticket objects.
 */
/**
 * Fetches Trip Tickets.
 * @param {string|null} vehicleId Optional vehicle ID to filter by.
 * @returns {Promise<Array>}
 */
async function getTripTickets(vehicleId = null) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }

    const cacheKey = vehicleId ? `cache_trips_${vehicleId}` : 'cache_trips_all';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;

    try {
        let query = db.collection('trip_tickets');
        if (vehicleId) {
            query = query.where('vehicleId', '==', vehicleId);
        }
        const snapshot = await query.get();
        const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Sort by date descending
        tickets.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        console.log("Fetched Trip Tickets:", tickets);
        _setCachedData(cacheKey, tickets);
        return tickets;
    } catch (error) {
        console.error("Error fetching Trip Tickets:", error);
        return [];
    }
}

/**
 * Creates a new Trip Ticket document in Firestore.
 * @param {object} data The Trip Ticket data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createTripTicket(data) {
    _requireWrite('consumption');
    _requireOrganizationMatch(data.organizationId);
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('trip_tickets').add(data);
        console.log("Created new Trip Ticket with ID:", docRef.id);
        _invalidateCache('cache_trips_all');
        if (data.vehicleId) _invalidateCache(`cache_trips_${data.vehicleId}`);
        return docRef.id;
    } catch (error) {
        console.error("Error creating Trip Ticket:", error);
        return null;
    }
}

/**
 * Deletes a Trip Ticket.
 * @param {string} docId 
 */
async function deleteTripTicket(docId) {
    _requireWrite('consumption');
    if (!window.db) return false;
    try {
        await db.collection('trip_tickets').doc(docId).delete();
        _invalidateCache('cache_trips_all');
        return true;
    } catch (error) {
        console.error("Error deleting Trip Ticket:", error);
        return false;
    }
}

// --- RIO Functions ---

/**
 * Fetches the list of all RIOs from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of RIO objects.
 */
async function getRioList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_rios';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('rios').get();
        const rioList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched RIOs:", rioList);
        _setCachedData(cacheKey, rioList);
        return rioList;
    } catch (error) {
        console.error("Error fetching RIO list:", error);
        return [];
    }
}

/**
 * Creates a new RIO document in Firestore.
 * @param {object} data The RIO data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createRio(data) {
    _requireWrite('rios');
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('rios').add(data);
        console.log("Created new RIO with ID:", docRef.id);
        _invalidateCache('cache_rios');
        return docRef.id;
    } catch (error) {
        console.error("Error creating RIO:", error);
        return null;
    }
}

/**
 * Updates an existing RIO document in Firestore.
 * @param {string} docId The ID of the document to update.
 * @param {object} data The data to update.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on error.
 */
async function updateRio(docId, data) {
    _requireWrite('rios');
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('rios').doc(docId).update(data);
        console.log("Updated RIO with ID:", docId);
        _invalidateCache('cache_rios');
        return true;
    } catch (error) {
        console.error("Error updating RIO:", error);
        return false;
    }
}

/**
 * Gets a single RIO document from Firestore.
 * @param {string} docId The ID of the document to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the document data or null if not found.
 */
async function getRioById(docId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await db.collection('rios').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.error("No such RIO document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting RIO document:", error);
        return null;
    }
}

/**
 * Deletes a RIO document.
 * @param {string} docId 
 */
async function deleteRio(docId) {
    _requireWrite('rios');
    if (!window.db) return false;
    try {
        await db.collection('rios').doc(docId).delete();
        _invalidateCache('cache_rios');
        return true;
    } catch (error) {
        console.error("Error deleting RIO:", error);
        return false;
    }
}

// --- PPA Functions ---

/**
 * Fetches the list of all PPAs from Firestore.
 * @returns {Promise<Array>} A promise that resolves to an array of PPA objects.
 */
async function getPpaList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    
    const cacheKey = 'cache_ppas';
    const cached = _getCachedData(cacheKey);
    if (cached) return cached;
    
    try {
        const snapshot = await db.collection('ppas').get();
        const ppaList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched PPAs:", ppaList);
        _setCachedData(cacheKey, ppaList);
        return ppaList;
    } catch (error) {
        console.error("Error fetching PPA list:", error);
        return [];
    }
}

/**
 * Creates a new PPA document in Firestore.
 * @param {object} data The PPA data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createPpa(data) {
    _requireWrite('ppas');
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('ppas').add(data);
        console.log("Created new PPA with ID:", docRef.id);
        _invalidateCache('cache_ppas');
        return docRef.id;
    } catch (error) {
        console.error("Error creating PPA:", error);
        return null;
    }
}

/**
 * Updates an existing PPA document in Firestore.
 * @param {string} docId The ID of the document to update.
 * @param {object} data The data to update.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on error.
 */
async function updatePpa(docId, data) {
    _requireWrite('ppas');
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('ppas').doc(docId).update(data);
        console.log("Updated PPA with ID:", docId);
        _invalidateCache('cache_ppas');
        return true;
    } catch (error) {
        console.error("Error updating PPA:", error);
        return false;
    }
}

/**
 * Gets a single PPA document from Firestore.
 * @param {string} docId The ID of the document to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the document data or null if not found.
 */
async function getPpaById(docId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await db.collection('ppas').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.error("No such PPA document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting PPA document:", error);
        return null;
    }
}

/**
 * Deletes a PPA document.
 * @param {string} docId 
 */
async function deletePpa(docId) {
    _requireWrite('ppas');
    if (!window.db) return false;
    try {
        await db.collection('ppas').doc(docId).delete();
        _invalidateCache('cache_ppas');
        return true;
    } catch (error) {
        console.error("Error deleting PPA:", error);
        return false;
    }
}
