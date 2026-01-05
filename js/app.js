import { getCurrentLguId, setCurrentLguId, getNextLoadId, getCurrentLoadId, setCurrentUser, getCurrentUser } from './views/state.js';
import { applyHeroHeader, initManualAccordion, populateLguSelector, updateSidebarVisibility } from './views/ui.js';
import { handleRouting } from './router.js';
import { loginWithGoogle, logout } from './auth.js';

// --- FUNCTIONS ---

export async function initLguSelector() {
    if (typeof document !== 'undefined') {
        const selector = document.getElementById('lgu-selector');
        const headerLguName = document.getElementById('header-lgu-name');
        const lgus = await populateLguSelector(selector, { includeEmpty: false });

        if (lgus.length > 0) {
            const user = getCurrentUser();
            
            if (user && user.assignedLguId) {
                // User is restricted to a specific LGU
                setCurrentLguId(user.assignedLguId);
                if (selector) selector.value = user.assignedLguId;
                if (selector) selector.disabled = true;
            } else {
                if (selector) selector.disabled = false;
                if (getCurrentLguId() && lgus.find(l => l.id === getCurrentLguId())) {
                    if (selector) selector.value = getCurrentLguId();
                } else {
                    setCurrentLguId(lgus[0].id);
                    if (selector) selector.value = getCurrentLguId();
                }
            }

            const updateHeaderText = () => {
                if (headerLguName) {
                    const selected = lgus.find(l => l.id === getCurrentLguId());
                    headerLguName.textContent = selected ? selected.name : 'Select LGU';
                }
            };
            updateHeaderText();
            
            if (selector) {
                selector.addEventListener('change', (e) => {
                    setCurrentLguId(e.target.value);
                    updateHeaderText();
                    handleRouting(); // Reload current view with new filter
                });
            }
        } else {
            selector.innerHTML = '<option value="">No LGUs Found</option>';
            if (headerLguName) headerLguName.textContent = 'No LGUs Found';
        }
    }
}
        
export async function loadContent(path, onContentReady) {
                const appContent = document.getElementById('app-content');
                if (!appContent) return;
                
    const myLoadId = getNextLoadId(); // Increment and capture ID for this request

    // Show loading spinner while fetching the view
    appContent.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p class="mt-4 text-gray-500 animate-pulse">Loading...</p>
        </div>
    `;

                try {
                    // Fetch content first before clearing DOM
                    const response = await fetch(`${path}?t=${Date.now()}`);
                    if (!response.ok) throw new Error(`Could not load ${path}`);
                    const html = await response.text();

                    // If a newer request has started, ignore this one
        if (myLoadId !== getCurrentLoadId()) return;

                    appContent.innerHTML = html;

                    // Apply gradient style to headers dynamically for views not manually updated
        applyHeroHeader(appContent);
                    initManualAccordion();
                    
                    if (onContentReady) {
                        await onContentReady(myLoadId); 
                    }
                } catch (error) {
                    // Only show error if this is still the active request
        if (myLoadId === getCurrentLoadId()) {
                        console.error('Error loading view:', error);
                        appContent.innerHTML = '<h1>Error</h1><p>Could not load page content.</p>';
                    }
                }
            }
        
export function initAuth() {
    const loginScreen = document.getElementById('login-screen');
    const googleBtn = document.getElementById('btn-google-login');
    const logoutBtn = document.getElementById('btn-logout');

    if (googleBtn) {
        googleBtn.addEventListener('click', loginWithGoogle);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    firebase.auth().onAuthStateChanged(async (user) => {
        const userInfo = document.getElementById('header-user-info');
        const userName = document.getElementById('header-user-name');
        const appContent = document.getElementById('app-content');

        if (user) {
            // User is signed in
            if (appContent) {
                appContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-[60vh]">
                        <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
                        <h2 class="mt-4 text-xl font-semibold text-gray-700">Verifying Permissions...</h2>
                        <p class="text-gray-500">Please wait while we prepare your dashboard.</p>
                    </div>
                `;
            }

            if (userInfo) userInfo.classList.remove('hidden');
            if (userName) userName.textContent = user.displayName || user.email;
            
            // Check if user profile exists in Firestore, if not create it with defaults
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            let userData;
            if (!userDoc.exists) {
                const defaults = await window.getDefaultPermissions();
                const { defaultLguId, ...modulePerms } = defaults || {};

                userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    role: 'Pending',
                    assignedLguId: defaultLguId || null,
                    permissions: modulePerms || {},
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                await window.db.collection('users').doc(user.uid).set(userData);
            } else {
                userData = { id: userDoc.id, ...userDoc.data() };
            }
            
            setCurrentUser(userData);

            if (loginScreen) loginScreen.classList.add('hidden');
            
            // Initialize app components
            updateSidebarVisibility();
            await initLguSelector();
            handleRouting();
        } else {
            // User is signed out
            setCurrentUser(null);
            if (userInfo) userInfo.classList.add('hidden');
            if (loginScreen) {
                loginScreen.classList.remove('hidden');
                initManualAccordion(); // Initialize the welcome page accordion
            }
        }
    });
}
                       
// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    window.addEventListener('hashchange', handleRouting);
    initAuth(); // Initialize Auth which will trigger LGU selector and Routing
});