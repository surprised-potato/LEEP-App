// ------------------------------------------------------------------
// FIREBASE CONFIGURATION
// ------------------------------------------------------------------
// ACTION REQUIRED:
// 1. Go to your Firebase project console.
// 2. In the project settings, find your web app's configuration object.
// 3. Paste that configuration object here.
// ------------------------------------------------------------------

const firebaseConfig = {

  apiKey: "AIzaSyAhQH37Sen1KBPstihCuj4AJLPUWMKIQ9k",

  authDomain: "leep-c5473.firebaseapp.com",

  projectId: "leep-c5473",

  storageBucket: "leep-c5473.firebasestorage.app",

  messagingSenderId: "893452490886",

  appId: "1:893452490886:web:fcd29ac10bbf4cc6165907"

};


// Initialize Firebase
if (firebaseConfig && firebaseConfig.apiKey) {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore(); // Assign to window.db for global access
    console.log("Firebase initialized successfully.");
} else {
    console.error("Firebase configuration is missing. Please update js/firebase-config.js");
}
