// js/state.js

// Ensure localStorage is available (for testing environments)
const storage = typeof localStorage !== 'undefined' ? localStorage : null;

let currentLguId = storage ? storage.getItem('currentLguId') : null;
let currentLoadId = 0; // Track the latest view load request
let currentUser = null;

export function getCurrentLguId() {
    return currentLguId;
}

export function setCurrentLguId(id) {
    currentLguId = id;
    if (storage) {
        storage.setItem('currentLguId', id);
    }
}

export function getCurrentLoadId() {
    return currentLoadId;
}

export function getNextLoadId() {
    return ++currentLoadId;
}

export function setCurrentUser(user) {
    currentUser = user;
}

export function getCurrentUser() {
    return currentUser;
}

export function checkPermission(moduleId, type = 'read') {
    if (!currentUser) return false;
    // Admins have full access to everything
    if (currentUser.role === 'Admin') return true;
    return currentUser.permissions?.[moduleId]?.[type] ?? false;
}