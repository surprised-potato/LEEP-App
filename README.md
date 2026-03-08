# LGU Energy Dashboard (LEEP App)

This is a single-page web application built with HTML5, Vanilla JavaScript (ES6 Modules), TailwindCSS, and Firebase (Firestore & Authentication) to help Local Government Units (LGUs) track and manage energy usage for their facilities and vehicles.

## Prerequisites

Before deploying or running the project, make sure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli) (installed globally via `npm install -g firebase-tools`)

## Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/surprised-potato/LEEP-App.git
   cd LEEP-App
   ```

2. Install the necessary testing dependencies:
   ```bash
   npm install
   ```

## Running Tests

The application uses **Jest** equipped with `jsdom` for UI testing and `@babel/preset-env` for ES6 modules parsing.

To run the automated test suite locally:
```bash
npm test
```
*This command runs the configured tests in `js/api.test.js` and `js/views.test.js`.*

## Firebase Configuration

The application interacts with Firebase Cloud Firestore for its database and Firebase Authentication for RBAC (Role-Based Access Control). 

To interact with the project:
1. Ensure you have authorized the Firebase CLI:
   ```bash
   firebase login
   ```
2. Verify that you are working within the correct Firebase project (configured in `.firebaserc` as `leep-energy-app`):
   ```bash
   firebase use default
   ```

## How to Deploy to Firebase

Firebase Hosting expects static files directly at the project root as specified by `firebase.json` (`"public": "."`). Note that Firebase will correctly ignore `node_modules`, `tests`, and other unnecessary directories.

To deploy the production-ready code to Firebase Hosting and update Firestore security rules/indexes:

```bash
firebase deploy
```

If you only want to deploy the hosting files without touching Firestore rules:
```bash
firebase deploy --only hosting
```

Once deployment finishes, Firebase CLI will output your live Web Hosting URL!
