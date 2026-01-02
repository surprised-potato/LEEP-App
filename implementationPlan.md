# Implementation Plan: LGU EEC Platform (Firestore & GitHub Pages)

This document outlines the technical plan for developing the LGU EEC Platform as a client-side web application using GitHub Pages for hosting and Firestore for the database.

## 1. Technology Stack

*   **Frontend**:
    *   HTML5
    *   CSS3 (with Bootstrap 5 for styling)
    *   JavaScript (ES6+, Vanilla)
*   **Backend Services (Firebase)**:
    *   **Firestore**: NoSQL database for all application data.
*   **Hosting**:
    *   **GitHub Pages**: For deploying and serving the web application.
*   **Development Tools**:
    *   Visual Studio Code
    *   Git & GitHub for version control

## 2. Project Setup

- [ ] **Firebase Project Creation**:
    - [x] Create a new project in the Firebase Console.
    - [x] Enable Firestore.
    - [x] Create a Web App within the Firebase project and copy the configuration credentials.
    - [x] **Important**: In the Firebase Console, go to the Firestore "Rules" tab and set the appropriate security rules.
    - [x] Also, in the "Authentication" > "Sign-in method" section, add the GitHub Pages domain to the list of authorized domains.
- [ ] **Local Development Environment**:
    - [x] Initialize a new project folder.
    - [x] Initialize a Git repository (`git init`).
    - [x] Create `js/` and `css/` and `views/` directories for frontend files.
    - [x] Create `js/firebase-config.js` to store the Firebase credentials.
- [ ] **Initial File Structure**:
    ```
    /
    ├── .gitignore
    ├── index.html         (Main app shell)
    ├── css/
    │   └── style.css
    ├── js/
    │   ├── firebase-config.js
    │   ├── app.js           (Main app logic, routing)
    │   └── api.js           (Firestore data interaction functions)
    └── views/             (HTML partials for different pages)
        ├── dashboard.html
        ├── fsbd-list.html
        ├── fsbd-form.html
        └── ... (other module views)
    ```

## 3. Iterative Development Plan

### Iteration 1: Application Shell & Routing
- [ ] `index.html` will serve as the main container with a header, navigation, and a main content area (`<main id="app-content"></main>`).
- [ ] In `js/app.js`, implement a simple hash-based router that dynamically loads HTML content from the `views/` directory into the `#app-content` area based on the URL hash (e.g., `#/dashboard`, `#/fsbds`).

### Iteration 2: Firestore Security Rules (Console Configuration)

#### Configure `firestore.rules` in Console
- [ ] Navigate to the Firestore "Rules" tab in the Firebase Console.
- [ ] For initial development, rules can be set to be open.
- [ ] **This is insecure and should be revisited before production.**
- [ ] **Example Rule**:
        ```
        rules_version = '2';
        service cloud.firestore {
          match /databases/{database}/documents {
            // Allow read/write access.
            // Warning: This is not secure.
            match /{document=**} {
              allow read, write: if true;
            }
          }
        }
        ```

### Iteration 3: Core Data Modules (FSBD Example)

#### List View
- [ ] Create `views/fsbd-list.html`.
- [ ] In `js/api.js`, create `getFsbdList()`.
- [ ] In `js/app.js`, call `getFsbdList` and render the results.

#### Form View (Create/Update)
- [ ] Create `views/fsbd-form.html`.
- [ ] In `js/api.js`, create `createFsbd(data)` and `updateFsbd(docId, data)`.
- [ ] In `js/app.js`, handle form loading and submission.

#### Repeat for all modules
- [ ] Follow the same pattern for Vehicles, MADE, Consumption, RIO, PPA, etc.
- [ ] **Future Implementation**: Modules requiring file uploads (like bills or logos) will be implemented in a future iteration when a file storage solution is added.

### Iteration 4: Reporting & Dashboard

(No changes from previous plan)

### Iteration 5: Deployment to GitHub Pages

#### Final Testing
- [ ] Thoroughly test all features locally.
- [ ] Ensure Firestore rules are correctly configured in the Firebase Console.

#### Deploy Application
- [ ] Create a new public repository on GitHub.
- [ ] Connect the local project to the GitHub repository.
- [ ] In the repository settings under "Pages", select the `main` branch (or `master`) and the `/` (root) folder as the source.
- [ ] Push the code to the `main` branch. GitHub Pages will automatically build and deploy the site from the project root.