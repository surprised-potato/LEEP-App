// Firestore data interaction functions

// --- LGU Functions ---

/**
 * Fetches the list of all LGUs.
 * @returns {Promise<Array>} A promise that resolves to an array of LGU objects.
 */
async function getLguList() {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    try {
        const snapshot = await db.collection('lgus').orderBy('name').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching LGU list:", error);
        return [];
    }
}

/**
 * Creates a new LGU document in Firestore.
 * @param {object} data The LGU data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createLgu(data) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('lgus').add(data);
        console.log("Created new LGU with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error creating LGU:", error);
        return null;
    }
}

/**
 * Updates an existing LGU document in Firestore.
 * @param {string} docId The ID of the document to update.
 * @param {object} data The data to update.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on error.
 */
async function updateLgu(docId, data) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('lgus').doc(docId).update(data);
        console.log("Updated LGU with ID:", docId);
        return true;
    } catch (error) {
        console.error("Error updating LGU:", error);
        return false;
    }
}

/**
 * Gets a single LGU document from Firestore.
 * @param {string} docId The ID of the document to fetch.
 * @returns {Promise<object|null>} A promise that resolves to the document data or null if not found.
 */
async function getLguById(docId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const doc = await db.collection('lgus').doc(docId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            console.error("No such LGU document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting LGU document:", error);
        return null;
    }
}

/**
 * Deletes an LGU document.
 * @param {string} docId 
 */
async function deleteLgu(docId) {
    if (!window.db) return false;
    try {
        await db.collection('lgus').doc(docId).delete();
        return true;
    } catch (error) {
        console.error("Error deleting LGU:", error);
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
    try {
        const snapshot = await db.collection('fsbds').get();
        const fsbdList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched FSBDs:", fsbdList);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('fsbds').add(data);
        console.log("Created new FSBD with ID:", docRef.id);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('fsbds').doc(docId).update(data);
        console.log("Updated FSBD with ID:", docId);
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
    if (!window.db) return false;
    try {
        await db.collection('fsbds').doc(docId).delete();
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
    try {
        const snapshot = await db.collection('vehicles').get();
        const vehicleList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched Vehicles:", vehicleList);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('vehicles').add(data);
        console.log("Created new Vehicle with ID:", docRef.id);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('vehicles').doc(docId).update(data);
        console.log("Updated Vehicle with ID:", docId);
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
    if (!window.db) return false;
    try {
        await db.collection('vehicles').doc(docId).delete();
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
    try {
        const snapshot = await db.collection('made_equipment').get();
        const madeList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched MADE Equipment:", madeList);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('made_equipment').add(data);
        console.log("Created new MADE Equipment with ID:", docRef.id);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('made_equipment').doc(docId).update(data);
        console.log("Updated MADE Equipment with ID:", docId);
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
    if (!window.db) return false;
    try {
        await db.collection('made_equipment').doc(docId).delete();
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
    try {
        const snapshot = await db.collection('users').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
async function updateUserPermissions(uid, permissions) {
    if (!window.db) return false;
    try {
        await db.collection('users').doc(uid).update({ permissions });
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
    lgus: [
        { id: 'sample_lgu_1', name: 'City of Pasig', region: 'NCR', province: 'Metro Manila', date_registered: new Date() },
        { id: 'sample_lgu_2', name: 'Municipality of Cainta', region: 'Region 4A', province: 'Rizal', date_registered: new Date() },
        { id: 'sample_lgu_3', name: 'Quezon City', region: 'NCR', province: 'Metro Manila', date_registered: new Date() }
    ],
    fsbds: [
        // Pasig Assets (Existing)
        { id: 'sample_fsbd_1', lguId: 'sample_lgu_1', name: 'Pasig City Hall', fsbd_type: 'Office Building', address: 'Caruncho Ave, Pasig', construction_year: 1990, floor_area_sqm: 15000 },
        { id: 'sample_fsbd_2', lguId: 'sample_lgu_1', name: 'Pasig Sports Center', fsbd_type: 'Sports Complex', address: 'Pasig City', construction_year: 2000, floor_area_sqm: 8000 },
        { id: 'sample_fsbd_3', lguId: 'sample_lgu_1', name: 'Pasig General Hospital', fsbd_type: 'Hospital', address: 'Maybunga, Pasig', construction_year: 1995, floor_area_sqm: 12000 },
        // Cainta Assets (Expanded)
        { id: 'sample_fsbd_4', lguId: 'sample_lgu_2', name: 'Cainta Municipal Hall', fsbd_type: 'Office Building', address: 'Cainta, Rizal', construction_year: 1985, floor_area_sqm: 3000 },
        { id: 'sample_fsbd_5', lguId: 'sample_lgu_2', name: 'Cainta Public Market', fsbd_type: 'Market', address: 'Cainta, Rizal', construction_year: 2010, floor_area_sqm: 5000 },
        { id: 'sample_fsbd_6', lguId: 'sample_lgu_2', name: 'Cainta Elementary School', fsbd_type: 'School', address: 'Sto. Domingo, Cainta', construction_year: 1998, floor_area_sqm: 4500 },
        // Quezon City Assets (New)
        { id: 'sample_fsbd_7', lguId: 'sample_lgu_3', name: 'Quezon City Hall', fsbd_type: 'Office Building', address: 'Elliptical Road, QC', construction_year: 1970, floor_area_sqm: 25000 },
        { id: 'sample_fsbd_8', lguId: 'sample_lgu_3', name: 'Quezon City General Hospital', fsbd_type: 'Hospital', address: 'Seminary Rd, QC', construction_year: 1980, floor_area_sqm: 15000 },
        { id: 'sample_fsbd_9', lguId: 'sample_lgu_3', name: 'Amoranto Sports Complex', fsbd_type: 'Sports Complex', address: 'Roces Ave, QC', construction_year: 1960, floor_area_sqm: 10000 }
    ],
    vehicles: [
        // Pasig Fleet (Existing)
        { id: 'sample_veh_1', lguId: 'sample_lgu_1', plate_number: 'SAA-1111', make: 'Toyota', model: 'Innova', year_model: 2020, fuel_type: 'Diesel' },
        { id: 'sample_veh_2', lguId: 'sample_lgu_1', plate_number: 'SBB-2222', make: 'Nissan', model: 'Urvan', year_model: 2019, fuel_type: 'Diesel' },
        { id: 'sample_veh_3', lguId: 'sample_lgu_1', plate_number: 'SCC-3333', make: 'Isuzu', model: 'N-Series', year_model: 2018, fuel_type: 'Diesel' },
        // Cainta Fleet (Expanded)
        { id: 'sample_veh_4', lguId: 'sample_lgu_2', plate_number: 'SDD-4444', make: 'Mitsubishi', model: 'L300', year_model: 2021, fuel_type: 'Diesel' },
        { id: 'sample_veh_5', lguId: 'sample_lgu_2', plate_number: 'SEE-5555', make: 'Toyota', model: 'Vios', year_model: 2017, fuel_type: 'Gasoline' },
        { id: 'sample_veh_6', lguId: 'sample_lgu_2', plate_number: 'SFF-6666', make: 'Toyota', model: 'Hiace Ambulance', year_model: 2022, fuel_type: 'Diesel' },
        // Quezon City Fleet (New)
        { id: 'sample_veh_7', lguId: 'sample_lgu_3', plate_number: 'SGG-7777', make: 'Hino', model: 'Bus', year_model: 2019, fuel_type: 'Diesel' },
        { id: 'sample_veh_8', lguId: 'sample_lgu_3', plate_number: 'SHH-8888', make: 'Toyota', model: 'Vios Patrol', year_model: 2020, fuel_type: 'Gasoline' },
        { id: 'sample_veh_9', lguId: 'sample_lgu_3', plate_number: 'SII-9999', make: 'Isuzu', model: 'Garbage Compactor', year_model: 2018, fuel_type: 'Diesel' }
    ],
    made_equipment: [
        // Pasig (Existing)
        { id: 'sample_made_1', fsbdId: 'sample_fsbd_1', description_of_equipment: 'Centralized AC System', energy_use_category: 'ACU', location: 'Main Building', power_rating_kw: 150, time_of_use_hours_per_day: 10 },
        { id: 'sample_made_2', fsbdId: 'sample_fsbd_1', description_of_equipment: 'LED Lighting Fixtures', energy_use_category: 'Lighting', location: 'All Floors', power_rating_kw: 20, time_of_use_hours_per_day: 12 },
        { id: 'sample_made_3', fsbdId: 'sample_fsbd_3', description_of_equipment: 'MRI Machine', energy_use_category: 'Medical Equipment', location: 'Radiology', power_rating_kw: 30, time_of_use_hours_per_day: 8 },
        { id: 'sample_made_4', fsbdId: 'sample_fsbd_5', description_of_equipment: 'High Bay Lights', energy_use_category: 'Lighting', location: 'Market Area', power_rating_kw: 10, time_of_use_hours_per_day: 14 },
        // Cainta (New)
        { id: 'sample_made_5', fsbdId: 'sample_fsbd_4', description_of_equipment: 'Split Type AC Units', energy_use_category: 'ACU', location: 'Offices', power_rating_kw: 40, time_of_use_hours_per_day: 9 },
        { id: 'sample_made_6', fsbdId: 'sample_fsbd_5', description_of_equipment: 'Industrial Freezers', energy_use_category: 'Refrigeration', location: 'Meat Section', power_rating_kw: 15, time_of_use_hours_per_day: 24 },
        // QC (New)
        { id: 'sample_made_7', fsbdId: 'sample_fsbd_7', description_of_equipment: 'Chiller Plant', energy_use_category: 'ACU', location: 'Basement', power_rating_kw: 300, time_of_use_hours_per_day: 12 },
        { id: 'sample_made_8', fsbdId: 'sample_fsbd_8', description_of_equipment: 'CT Scan', energy_use_category: 'Medical Equipment', location: 'Imaging Dept', power_rating_kw: 50, time_of_use_hours_per_day: 24 },
        { id: 'sample_made_9', fsbdId: 'sample_fsbd_9', description_of_equipment: 'Stadium Floodlights', energy_use_category: 'Lighting', location: 'Field', power_rating_kw: 100, time_of_use_hours_per_day: 4 }
    ],
    mecr_reports: [
        // Pasig City Hall (6 months) - Existing
        { id: 'sample_mecr_1_1', fsbdId: 'sample_fsbd_1', reporting_year: 2023, reporting_month: 1, electricity_consumption_kwh: 45000, cost_php: 450000 },
        { id: 'sample_mecr_1_2', fsbdId: 'sample_fsbd_1', reporting_year: 2023, reporting_month: 2, electricity_consumption_kwh: 42000, cost_php: 420000 },
        { id: 'sample_mecr_1_3', fsbdId: 'sample_fsbd_1', reporting_year: 2023, reporting_month: 3, electricity_consumption_kwh: 48000, cost_php: 480000 },
        { id: 'sample_mecr_1_4', fsbdId: 'sample_fsbd_1', reporting_year: 2023, reporting_month: 4, electricity_consumption_kwh: 55000, cost_php: 550000 },
        { id: 'sample_mecr_1_5', fsbdId: 'sample_fsbd_1', reporting_year: 2023, reporting_month: 5, electricity_consumption_kwh: 58000, cost_php: 580000 },
        { id: 'sample_mecr_1_6', fsbdId: 'sample_fsbd_1', reporting_year: 2023, reporting_month: 6, electricity_consumption_kwh: 56000, cost_php: 560000 },
        // Pasig Hospital (6 months) - Existing
        { id: 'sample_mecr_3_1', fsbdId: 'sample_fsbd_3', reporting_year: 2023, reporting_month: 1, electricity_consumption_kwh: 80000, cost_php: 800000 },
        { id: 'sample_mecr_3_2', fsbdId: 'sample_fsbd_3', reporting_year: 2023, reporting_month: 2, electricity_consumption_kwh: 78000, cost_php: 780000 },
        { id: 'sample_mecr_3_3', fsbdId: 'sample_fsbd_3', reporting_year: 2023, reporting_month: 3, electricity_consumption_kwh: 82000, cost_php: 820000 },
        { id: 'sample_mecr_3_4', fsbdId: 'sample_fsbd_3', reporting_year: 2023, reporting_month: 4, electricity_consumption_kwh: 85000, cost_php: 850000 },
        { id: 'sample_mecr_3_5', fsbdId: 'sample_fsbd_3', reporting_year: 2023, reporting_month: 5, electricity_consumption_kwh: 88000, cost_php: 880000 },
        { id: 'sample_mecr_3_6', fsbdId: 'sample_fsbd_3', reporting_year: 2023, reporting_month: 6, electricity_consumption_kwh: 86000, cost_php: 860000 },
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
    mfcr_reports: [
        // Innova (6 months) - Existing
        { id: 'sample_mfcr_1_1', vehicleId: 'sample_veh_1', reporting_year: 2023, reporting_month: 1, fuel_consumed_liters: 150, distance_traveled_km: 1200, cost_php: 9000 },
        { id: 'sample_mfcr_1_2', vehicleId: 'sample_veh_1', reporting_year: 2023, reporting_month: 2, fuel_consumed_liters: 140, distance_traveled_km: 1100, cost_php: 8400 },
        { id: 'sample_mfcr_1_3', vehicleId: 'sample_veh_1', reporting_year: 2023, reporting_month: 3, fuel_consumed_liters: 160, distance_traveled_km: 1300, cost_php: 9600 },
        { id: 'sample_mfcr_1_4', vehicleId: 'sample_veh_1', reporting_year: 2023, reporting_month: 4, fuel_consumed_liters: 155, distance_traveled_km: 1250, cost_php: 9300 },
        { id: 'sample_mfcr_1_5', vehicleId: 'sample_veh_1', reporting_year: 2023, reporting_month: 5, fuel_consumed_liters: 145, distance_traveled_km: 1150, cost_php: 8700 },
        { id: 'sample_mfcr_1_6', vehicleId: 'sample_veh_1', reporting_year: 2023, reporting_month: 6, fuel_consumed_liters: 150, distance_traveled_km: 1200, cost_php: 9000 },
        // Garbage Truck (6 months) - Existing
        { id: 'sample_mfcr_3_1', vehicleId: 'sample_veh_3', reporting_year: 2023, reporting_month: 1, fuel_consumed_liters: 800, distance_traveled_km: 2000, cost_php: 48000 },
        { id: 'sample_mfcr_3_2', vehicleId: 'sample_veh_3', reporting_year: 2023, reporting_month: 2, fuel_consumed_liters: 780, distance_traveled_km: 1950, cost_php: 46800 },
        { id: 'sample_mfcr_3_3', vehicleId: 'sample_veh_3', reporting_year: 2023, reporting_month: 3, fuel_consumed_liters: 820, distance_traveled_km: 2100, cost_php: 49200 },
        { id: 'sample_mfcr_3_4', vehicleId: 'sample_veh_3', reporting_year: 2023, reporting_month: 4, fuel_consumed_liters: 810, distance_traveled_km: 2050, cost_php: 48600 },
        { id: 'sample_mfcr_3_5', vehicleId: 'sample_veh_3', reporting_year: 2023, reporting_month: 5, fuel_consumed_liters: 830, distance_traveled_km: 2150, cost_php: 49800 },
        { id: 'sample_mfcr_3_6', vehicleId: 'sample_veh_3', reporting_year: 2023, reporting_month: 6, fuel_consumed_liters: 800, distance_traveled_km: 2000, cost_php: 48000 },
        // Cainta Ambulance (6 months) - New
        { id: 'sample_mfcr_6_1', vehicleId: 'sample_veh_6', reporting_year: 2023, reporting_month: 1, fuel_consumed_liters: 200, distance_traveled_km: 1500, cost_php: 12000 },
        { id: 'sample_mfcr_6_2', vehicleId: 'sample_veh_6', reporting_year: 2023, reporting_month: 2, fuel_consumed_liters: 180, distance_traveled_km: 1350, cost_php: 10800 },
        { id: 'sample_mfcr_6_3', vehicleId: 'sample_veh_6', reporting_year: 2023, reporting_month: 3, fuel_consumed_liters: 220, distance_traveled_km: 1600, cost_php: 13200 },
        { id: 'sample_mfcr_6_4', vehicleId: 'sample_veh_6', reporting_year: 2023, reporting_month: 4, fuel_consumed_liters: 210, distance_traveled_km: 1550, cost_php: 12600 },
        { id: 'sample_mfcr_6_5', vehicleId: 'sample_veh_6', reporting_year: 2023, reporting_month: 5, fuel_consumed_liters: 230, distance_traveled_km: 1700, cost_php: 13800 },
        { id: 'sample_mfcr_6_6', vehicleId: 'sample_veh_6', reporting_year: 2023, reporting_month: 6, fuel_consumed_liters: 200, distance_traveled_km: 1500, cost_php: 12000 },
        // QC Bus (6 months) - New
        { id: 'sample_mfcr_7_1', vehicleId: 'sample_veh_7', reporting_year: 2023, reporting_month: 1, fuel_consumed_liters: 600, distance_traveled_km: 3000, cost_php: 36000 },
        { id: 'sample_mfcr_7_2', vehicleId: 'sample_veh_7', reporting_year: 2023, reporting_month: 2, fuel_consumed_liters: 580, distance_traveled_km: 2900, cost_php: 34800 },
        { id: 'sample_mfcr_7_3', vehicleId: 'sample_veh_7', reporting_year: 2023, reporting_month: 3, fuel_consumed_liters: 620, distance_traveled_km: 3100, cost_php: 37200 },
        { id: 'sample_mfcr_7_4', vehicleId: 'sample_veh_7', reporting_year: 2023, reporting_month: 4, fuel_consumed_liters: 650, distance_traveled_km: 3250, cost_php: 39000 },
        { id: 'sample_mfcr_7_5', vehicleId: 'sample_veh_7', reporting_year: 2023, reporting_month: 5, fuel_consumed_liters: 630, distance_traveled_km: 3150, cost_php: 37800 },
        { id: 'sample_mfcr_7_6', vehicleId: 'sample_veh_7', reporting_year: 2023, reporting_month: 6, fuel_consumed_liters: 600, distance_traveled_km: 3000, cost_php: 36000 },
        // Cainta L300 (6 months)
        { id: 'sample_mfcr_4_1', vehicleId: 'sample_veh_4', reporting_year: 2023, reporting_month: 1, fuel_consumed_liters: 180, distance_traveled_km: 1400, cost_php: 10800 },
        { id: 'sample_mfcr_4_2', vehicleId: 'sample_veh_4', reporting_year: 2023, reporting_month: 2, fuel_consumed_liters: 170, distance_traveled_km: 1300, cost_php: 10200 },
        { id: 'sample_mfcr_4_3', vehicleId: 'sample_veh_4', reporting_year: 2023, reporting_month: 3, fuel_consumed_liters: 190, distance_traveled_km: 1500, cost_php: 11400 },
        { id: 'sample_mfcr_4_4', vehicleId: 'sample_veh_4', reporting_year: 2023, reporting_month: 4, fuel_consumed_liters: 185, distance_traveled_km: 1450, cost_php: 11100 },
        { id: 'sample_mfcr_4_5', vehicleId: 'sample_veh_4', reporting_year: 2023, reporting_month: 5, fuel_consumed_liters: 200, distance_traveled_km: 1600, cost_php: 12000 },
        { id: 'sample_mfcr_4_6', vehicleId: 'sample_veh_4', reporting_year: 2023, reporting_month: 6, fuel_consumed_liters: 195, distance_traveled_km: 1550, cost_php: 11700 },
        // QC Garbage Compactor (6 months)
        { id: 'sample_mfcr_9_1', vehicleId: 'sample_veh_9', reporting_year: 2023, reporting_month: 1, fuel_consumed_liters: 900, distance_traveled_km: 1800, cost_php: 54000 },
        { id: 'sample_mfcr_9_2', vehicleId: 'sample_veh_9', reporting_year: 2023, reporting_month: 2, fuel_consumed_liters: 880, distance_traveled_km: 1750, cost_php: 52800 },
        { id: 'sample_mfcr_9_3', vehicleId: 'sample_veh_9', reporting_year: 2023, reporting_month: 3, fuel_consumed_liters: 920, distance_traveled_km: 1850, cost_php: 55200 },
        { id: 'sample_mfcr_9_4', vehicleId: 'sample_veh_9', reporting_year: 2023, reporting_month: 4, fuel_consumed_liters: 950, distance_traveled_km: 1900, cost_php: 57000 },
        { id: 'sample_mfcr_9_5', vehicleId: 'sample_veh_9', reporting_year: 2023, reporting_month: 5, fuel_consumed_liters: 980, distance_traveled_km: 1950, cost_php: 58800 },
        { id: 'sample_mfcr_9_6', vehicleId: 'sample_veh_9', reporting_year: 2023, reporting_month: 6, fuel_consumed_liters: 940, distance_traveled_km: 1880, cost_php: 56400 }
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
        { id: 'sample_seu_1', fsbdId: 'sample_fsbd_1', energy_use_category: 'ACU', finding_description: 'High consumption AC units', identification_method: 'Calculated', status: 'Identified' },
        { id: 'sample_seu_2', vehicleId: 'sample_veh_3', energy_use_category: 'Fuel Consumption', finding_description: 'Inefficient Garbage Truck', identification_method: 'Historical Average', status: 'Identified' },
        { id: 'sample_seu_3', fsbdId: 'sample_fsbd_6', energy_use_category: 'Lighting', finding_description: 'Old lighting fixtures', identification_method: 'Audit', status: 'Identified' },
        { id: 'sample_seu_4', fsbdId: 'sample_fsbd_7', energy_use_category: 'ACU', finding_description: 'Chiller plant optimization needed', identification_method: 'Calculated', status: 'Identified' }
    ]
};

async function checkSampleDataExists() {
    if (!window.db) return false;
    try {
        const doc = await db.collection('lgus').doc('sample_lgu_1').get();
        return doc.exists;
    } catch (error) {
        console.error("Error checking sample data:", error);
        return false;
    }
}

async function createSampleData() {
    if (!window.db) return false;
    const batch = db.batch();

    try {
        // Iterate over all collections in SAMPLE_DATA
        for (const [collectionName, items] of Object.entries(SAMPLE_DATA)) {
            items.forEach(item => {
                // Use specific IDs for sample data to make deletion easy
                const ref = db.collection(collectionName).doc(item.id);
                batch.set(ref, item);
            });
        }

        await batch.commit();
        console.log("Sample data created successfully.");
        return true;
    } catch (error) {
        console.error("Error creating sample data:", error);
        return false;
    }
}

async function deleteSampleData() {
    if (!window.db) return false;
    const batch = db.batch();

    try {
        // Iterate over all collections in SAMPLE_DATA
        for (const [collectionName, items] of Object.entries(SAMPLE_DATA)) {
            items.forEach(item => {
                const ref = db.collection(collectionName).doc(item.id);
                batch.delete(ref);
            });
        }

        await batch.commit();
        console.log("Sample data deleted successfully.");
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
    try {
        const snapshot = await db.collection('seu_findings').get();
        const seuList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched SEUs:", seuList);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('seu_findings').add(data);
        console.log("Created new SEU finding with ID:", docRef.id);
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
    if (!window.db) return false;
    try {
        await db.collection('seu_findings').doc(docId).delete();
        return true;
    } catch (error) {
        console.error("Error deleting SEU finding:", error);
        return false;
    }
}

// Export for Node.js testing environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getLguList, createLgu, updateLgu, getLguById, deleteLgu,
        getFsbdList, createFsbd, updateFsbd, getFsbdById, deleteFsbd,
        getVehicleList, createVehicle, updateVehicle, getVehicleById, deleteVehicle,
        getMadeList, createMade, updateMade, getMadeById, deleteMade,
        getMecrReports, createMecrReport, deleteMecrReport,
        getMfcrReports, createMfcrReport, deleteMfcrReport,
        getRioList, createRio, updateRio, getRioById, deleteRio,
        getPpaList, createPpa, updatePpa, getPpaById, deletePpa,
        getUserList, updateUserPermissions, getDefaultPermissions, updateDefaultPermissions,
        checkSampleDataExists, createSampleData, deleteSampleData,
        getSeuList, createSeu, deleteSeu
    };
}

// --- Consumption Report Functions (MECR) ---

/**
 * Fetches all electricity consumption reports for a specific building.
 * @param {string} fsbdId The ID of the building.
 * @returns {Promise<Array>} A promise that resolves to an array of MECR objects.
 */
async function getMecrReports(fsbdId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    try {
        // Removed orderBy to avoid needing a composite index during development. Sorting is done client-side.
        const snapshot = await db.collection('mecr_reports').where('fsbdId', '==', fsbdId).get();
        const reportList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Client-side sort: Year desc, then Month desc
        reportList.sort((a, b) => (b.reporting_year - a.reporting_year) || (b.reporting_month - a.reporting_month));
        
        console.log("Fetched MECR reports:", reportList);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('mecr_reports').add(data);
        console.log("Created new MECR report with ID:", docRef.id);
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
    if (!window.db) return false;
    try {
        await db.collection('mecr_reports').doc(docId).delete();
        return true;
    } catch (error) {
        console.error("Error deleting MECR report:", error);
        return false;
    }
}

// --- Consumption Report Functions (MFCR) ---

/**
 * Fetches all fuel consumption reports for a specific vehicle.
 * @param {string} vehicleId The ID of the vehicle.
 * @returns {Promise<Array>} A promise that resolves to an array of MFCR objects.
 */
async function getMfcrReports(vehicleId) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return [];
    }
    try {
        // Removed orderBy to avoid needing a composite index during development. Sorting is done client-side.
        const snapshot = await db.collection('mfcr_reports').where('vehicleId', '==', vehicleId).get();
        const reportList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Client-side sort: Year desc, then Month desc
        reportList.sort((a, b) => (b.reporting_year - a.reporting_year) || (b.reporting_month - a.reporting_month));
        
        console.log("Fetched MFCR reports:", reportList);
        return reportList;
    } catch (error) {
        console.error("Error fetching MFCR reports:", error);
        return [];
    }
}

/**
 * Creates a new fuel consumption report document in Firestore.
 * @param {object} data The report data to save.
 * @returns {Promise<string|null>} A promise that resolves to the new document ID or null on error.
 */
async function createMfcrReport(data) {
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('mfcr_reports').add(data);
        console.log("Created new MFCR report with ID:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("Error creating MFCR report:", error);
        return null;
    }
}

/**
 * Deletes a MFCR report.
 * @param {string} docId 
 */
async function deleteMfcrReport(docId) {
    if (!window.db) return false;
    try {
        await db.collection('mfcr_reports').doc(docId).delete();
        return true;
    } catch (error) {
        console.error("Error deleting MFCR report:", error);
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
    try {
        const snapshot = await db.collection('rios').get();
        const rioList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched RIOs:", rioList);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('rios').add(data);
        console.log("Created new RIO with ID:", docRef.id);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('rios').doc(docId).update(data);
        console.log("Updated RIO with ID:", docId);
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
    if (!window.db) return false;
    try {
        await db.collection('rios').doc(docId).delete();
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
    try {
        const snapshot = await db.collection('ppas').get();
        const ppaList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log("Fetched PPAs:", ppaList);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return null;
    }
    try {
        const docRef = await db.collection('ppas').add(data);
        console.log("Created new PPA with ID:", docRef.id);
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
    if (!window.db) {
        console.error("Firestore is not initialized.");
        return false;
    }
    try {
        await db.collection('ppas').doc(docId).update(data);
        console.log("Updated PPA with ID:", docId);
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
    if (!window.db) return false;
    try {
        await db.collection('ppas').doc(docId).delete();
        return true;
    } catch (error) {
        console.error("Error deleting PPA:", error);
        return false;
    }
}
