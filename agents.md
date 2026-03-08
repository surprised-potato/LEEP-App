# LEEP-App Codebase Summary

## Overview
The LGU Energy Efficiency and Conservation (EEC) Platform is a serverless client-side web application designed to assist Local Government Units (LGUs) in the Philippines. It manages inventory (buildings, vehicles, equipment), tracks energy consumption, identifies Significant Energy Use (SEU), plans Recommendations for Improvement (RIO) and Projects (PPA), and generates compliance reports for the DOE. The application uses GitHub Pages for hosting and Google Firebase Firestore as its backend database.

## Architecture
- **Frontend**: HTML5, CSS3 (Bootstrap 5), Vanilla JavaScript (ES6+ Modules).
- **Backend/Database**: Firebase Firestore (NoSQL).
- **Hosting**: Firebase Hosting (`leep-energy-app.web.app`).
- **State Management**: Handled via `state.js` and local JavaScript variables.
- **Routing**: A custom hash-based front-end router (`router.js`).

## Core Functions Database API (`js/api.js`)
The data access layer consists of asynchronous CRUD wrappers over Firebase Firestore collections.
1. **LGU Management**: `getLguList`, `createLgu`, `updateLgu`, `getLguById`, `deleteLgu`
2. **Facilities (FSBD)**: `getFsbdList`, `createFsbd`, `updateFsbd`, `getFsbdById`, `deleteFsbd`
3. **Vehicles**: `getVehicleList`, `createVehicle`, `updateVehicle`, `getVehicleById`, `deleteVehicle`
4. **MADE Equipment**: `getMadeList`, `createMade`, `updateMade`, `getMadeById`, `deleteMade`
5. **Consumption Reporting (MECR & MFCR)**: Retrieves compiled monthly matrices for electricity (`mecr_reports`) and fuel (`mfcr_reports`), e.g., `getMecrReports`.
6. **Recommendations (RIO) & Projects (PPA)**: Tracks energy-saving initiatives, their priorities, and their financial implications (`createRio`, `createPpa`, etc.).
7. **Significant Energy Use (SEU)**: `getSeuList`, `createSeu`, `deleteSeu`.
8. **User Management & RBAC**: `getUserList`, `updateUserPermissions`, `getRolePreset`, and `checkPermission`. Manages roles (`System Admin`, `LGU Admin`, `LGU EEC Officer`, etc.) and granular module-level permissions.
23. **API Security Guards**: `_requireWrite` (checks module-specific write permissions) and `_requireLguMatch` (validates LGU data scoping for restricted roles). These ensure that any data manipulation is authorized at the function-entry point.
24. **Sample Data**: Functions to bootstrap the system with initial dummy data (`checkSampleDataExists`, `createSampleData`, `deleteSampleData`).

## Deployment
- **Platform**: Firebase Hosting.
- **Project ID**: `leep-energy-app`.
- **Command**: `firebase deploy --only hosting,firestore`.
- **Configuration**:
    - `firebase.json`: Defines the root as the public directory and ignores development files.
    - `.firebaserc`: Links the local environment to the active Firebase project.

## System Workflows
1. **Authentication & RBAC Lifecycle**:
   - Handled primarily by `initAuth` inside `app.js`. Monitors Firebase `onAuthStateChanged`.
   - **New Users**: Redirected to a registration form (`register.html`) to select their LGU.
   - **Pending Users**: Restricted to a "Pending Approval" screen (`pending-approval.html`) until an admin approves them.
   - **Authorized Users**: Dashboard access is guarded by `checkPermission()`.
   - **Route Guards**: `router.js` intercepts hash changes and blocks unauthorized module access at the front-end level.
   - **Backend Enforcement**: `firestore.rules` enforces RBAC server-side based on the user's role and permission fields stored in their Firestore document.
2. **Context Selection Workflow (LGU Selector)**:
   - Admins can swap their LGU context via the `#lgu-selector`.
   - LGU-restricted roles have this selector locked to their assigned LGU via `ui.js`.
3. **Asset & Data Management Workflow**:
   - The user visits a specific list module (e.g., `#fsbds` for Buildings).
   - `router.js` recognizes the `/fsbds` path and triggers the `renderFsbdList` controller.
   - The controller queries `api.js` to get the assets associated with `currentLguId` and seamlessly generates DOM table nodes for the `#app-content` area.
4. **Action Planning Workflow (RIO & PPA)**:
   - Identified energy inefficiencies are cataloged as SEU findings.
   - This catalyzes the creation of Recommendations for Improvement (RIO). Contextual data (historical MoM/YoY trends, highest consumer nodes) are displayed adjacent to the form.
   - Several RIOs mature into consolidated PPAs (Programs and Projects) encompassing budget, cost vs savings forecasts, and tracking.
5. **Automated Compliance Reporting Workflow**:
   - The Reporting mechanism pools together entities scoped to the LGU: Assets, monthly Electricity/Fuel Consumptions, planned RIOs, and PPAs. 
   - It outputs everything in a meticulously formatted printable format designed strictly for submission to national agencies.

## Application Cycles
1. **Routing Cycle**: 
   - Uses `window.addEventListener('hashchange', handleRouting)`.
   - The browser emits a hash change -> `router.js` parses the `location.hash` arguments against a mapped object of routes -> An HTML layout view is subsequently fetched via a standard `fetch()` API request -> Finally, the mapped controller binds the specific JavaScript logic to the freshly loaded DOM layout snippet.
2. **Rendering Cycle**: 
   - View DOM is injected inside `<main id="app-content">` -> Dynamic elements like the "Hero Header" gradient and accordion states are synced -> Event listeners logic binds context. 
3. **Lifecycle/Component Loading Cycle**: 
   - `app.js` employs a simplistic `getNextLoadId()` / `getCurrentLoadId()` lock pattern upon every route load. This mechanism protects the UI from race conditions wherein slightly delayed responses from slower queries overwrite entirely different, newer route changes.
