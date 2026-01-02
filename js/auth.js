// This file will handle user authentication logic

/**
 * Creates the initial System Administrator user.
 * This should only be run once from the setup page.
 * @param {string} displayName The user's full name.
 * @param {string} email The user's email.
 * @param {string} password The user's password.
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function createSystemAdmin(displayName, email, password) {
    if (!window.firebase || !window.db) {
        return { success: false, message: "Firebase is not initialized." };
    }

    const auth = firebase.auth();

    try {
        // Step 1: Create the user in Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Step 2: Create the user profile document in Firestore
        const userProfile = {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            role: 'System Admin',
            assignedLguId: null, // System Admin is not tied to one LGU
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(user.uid).set(userProfile);

        return { success: true, message: `Successfully created System Admin: ${displayName}. You can now log in.` };

    } catch (error) {
        let message = "An unknown error occurred. " + error.message;
        return { success: false, message: message };
    }
}
