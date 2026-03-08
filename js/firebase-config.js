// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------
// This file is automatically updated by the agent.
// ------------------------------------------------------------------

const firebaseConfig = {
  apiKey: "AIzaSyBd39Mrwsc6pGT2mO0j-DO-Rbu2MHRkE3g",
  authDomain: "leep-energy-app.firebaseapp.com",
  projectId: "leep-energy-app",
  storageBucket: "leep-energy-app.firebasestorage.app",
  messagingSenderId: "244180149129",
  appId: "1:244180149129:web:f348509fa85d5b921f3758"
};

// Initialize Firebase
if (firebaseConfig && firebaseConfig.apiKey) {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.db = firebase.firestore(); // Assign to window.db for global access
    console.log("Firebase initialized successfully for " + firebaseConfig.projectId);
} else {
    console.error("Firebase configuration is missing. Please update js/firebase-config.js");
}
