import { getCurrentLguId, setCurrentLguId, getNextLoadId, getCurrentLoadId, setCurrentUser, getCurrentUser } from './views/state.js';
import { applyHeroHeader, initManualAccordion, populateLguSelector, updateSidebarVisibility } from './views/ui.js';
import { handleRouting } from './router.js';
import { loginWithGoogle, logout } from './auth.js';

// --- GLOBAL TOAST SYSTEM ---
window.showToast = (message, type = 'success') => {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgClass = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    
    toast.className = `${bgClass} text-white px-6 py-3 rounded-lg shadow-lg flex items-center justify-between min-w-[300px] animate-fade-in-up transition-opacity duration-300 transform`;
    toast.innerHTML = `
        <span class="font-semibold text-sm">${message}</span>
        <button class="ml-4 text-white hover:text-gray-200 focus:outline-none">&times;</button>
    `;

    container.appendChild(toast);

    const closeBtn = toast.querySelector('button');
    const removeToast = () => {
        toast.classList.add('opacity-0');
        setTimeout(() => toast.remove(), 300);
    };

    closeBtn.addEventListener('click', removeToast);
    setTimeout(removeToast, 5000); // Auto remove after 5 seconds
};

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
            if (userInfo) userInfo.classList.remove('hidden');
            if (userName) userName.textContent = user.displayName || user.email;

            // Step 1: Check if user profile exists in Firestore
            const userDoc = await window.db.collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                // Path A: New user - Show registration form
                if (loginScreen) loginScreen.classList.add('hidden');
                return showRegistrationScreen(user);
            }

            const userData = { id: userDoc.id, ...userDoc.data() };
            setCurrentUser(userData);

            if (userData.role === 'Pending') {
                // Path B: Waiting for approval
                if (loginScreen) loginScreen.classList.add('hidden');
                return showPendingScreen();
            }

            // Path C: Approved user - Proceed to app
            if (loginScreen) loginScreen.classList.add('hidden');
            
            // Show sidebar for approved users
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.remove('hidden');

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

async function showRegistrationScreen(user) {
    await loadContent('views/register.html', async () => {
        const nameInput = document.getElementById('register-name');
        const emailInput = document.getElementById('register-email');
        const lguSelect = document.getElementById('register-lgu-select');
        const logoutBtn = document.getElementById('btn-register-logout');
        const form = document.getElementById('registration-form');

        if (nameInput) nameInput.value = user.displayName || '';
        if (emailInput) emailInput.value = user.email || '';
        if (logoutBtn) logoutBtn.addEventListener('click', logout);

        await populateLguSelector(lguSelect, { 
            includeEmpty: true, 
            emptyText: 'Select your LGU...',
            filterByUser: false 
        });

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const dpaConsent = document.getElementById('register-dpa-consent');
                if (!dpaConsent || !dpaConsent.checked) {
                    if (window.showToast) window.showToast('You must agree to the Data Privacy Notice to register.', 'error');
                    else alert('You must agree to the Data Privacy Notice to register.');
                    return;
                }

                const btn = document.getElementById('btn-register-submit');
                btn.disabled = true;
                btn.textContent = 'Submitting...';

                const formData = {
                    lguId: lguSelect.value,
                    position: document.getElementById('register-position').value,
                    contactNumber: document.getElementById('register-contact').value,
                    dpaConsent: true
                };

                await createUserProfile(user, formData);
            });
        }
    });
}

async function createUserProfile(user, formData) {
    try {
        const defaults = await window.getDefaultPermissions();
        const { defaultLguId, ...modulePerms } = defaults || {};

        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: 'Pending',
            assignedLguId: formData.lguId || null,
            position: formData.position || '',
            contactNumber: formData.contactNumber || '',
            permissions: modulePerms || {},
            dpaConsent: formData.dpaConsent || false,
            dpaConsentTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            registeredAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        await window.db.collection('users').doc(user.uid).set(userData);
        setCurrentUser(userData);
        showPendingScreen();
    } catch (error) {
        console.error("Error creating user profile:", error);
        alert("Failed to submit registration. Please try again.");
        const btn = document.getElementById('btn-register-submit');
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Submit Registration Request';
        }
    }
}

async function showPendingScreen() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('hidden');
    
    await loadContent('views/pending-approval.html', (loadId) => {
        const logoutBtn = document.getElementById('btn-pending-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', logout);
    });
}
                       
// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    window.addEventListener('hashchange', handleRouting);
    initAuth(); // Initialize Auth which will trigger LGU selector and Routing
});