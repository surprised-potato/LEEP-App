import { getCurrentLguId, setCurrentLguId, getNextLoadId, getCurrentLoadId, setCurrentUser } from './views/state.js';
import { applyHeroHeader, initManualAccordion, populateLguSelector } from './views/ui.js';
import { handleRouting } from './router.js';
import { loginWithGoogle, logout } from './auth.js';

// --- FUNCTIONS ---

export async function initLguSelector() {
    if (typeof document !== 'undefined') {
        const selector = document.getElementById('lgu-selector');
        const headerLguName = document.getElementById('header-lgu-name');
        const lgus = await populateLguSelector(selector, { includeEmpty: false });

        if (lgus.length > 0) {
            // Set initial value
            if (getCurrentLguId() && lgus.find(l => l.id === getCurrentLguId())) {
                selector.value = getCurrentLguId();
            } else {
                // Default to first LGU if none selected or invalid
                setCurrentLguId(lgus[0].id);
                selector.value = getCurrentLguId();
            }

            const updateHeaderText = () => {
                if (headerLguName) {
                    const selected = lgus.find(l => l.id === getCurrentLguId());
                    headerLguName.textContent = selected ? selected.name : 'Select LGU';
                }
            };
            updateHeaderText();

            selector.addEventListener('change', (e) => {
                setCurrentLguId(e.target.value);
                updateHeaderText();
                handleRouting(); // Reload current view with new filter
            });
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
        if (user) {
            // User is signed in
            setCurrentUser(user);
            
            // Check if user profile exists in Firestore, if not create it (Pending role)
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            if (!userDoc.exists) {
                await window.db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    role: 'Pending',
                    assignedLguId: null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }

            if (loginScreen) loginScreen.classList.add('hidden');
            
            // Initialize app components
            await initLguSelector();
            handleRouting();
        } else {
            // User is signed out
            setCurrentUser(null);
            if (loginScreen) loginScreen.classList.remove('hidden');
        }
    });
}
                       
// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    window.addEventListener('hashchange', handleRouting);
    initAuth(); // Initialize Auth which will trigger LGU selector and Routing
});