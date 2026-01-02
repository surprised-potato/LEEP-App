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
        const snapshot = await db.collection('mecr_reports').where('fsbdId', '==', fsbdId).orderBy('reporting_year', 'desc').orderBy('reporting_month', 'desc').get();
        const reportList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const snapshot = await db.collection('mfcr_reports').where('vehicleId', '==', vehicleId).orderBy('reporting_year', 'desc').orderBy('reporting_month', 'desc').get();
        const reportList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
