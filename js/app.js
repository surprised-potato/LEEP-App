import { getCurrentLguId, setCurrentLguId, getNextLoadId, getCurrentLoadId } from './views/state.js';
import { applyHeroHeader } from './views/ui.js';
import { handleRouting } from './router.js';

// --- FUNCTIONS ---

export async function initLguSelector() {
    if (typeof document !== 'undefined') {
        const selector = document.getElementById('lgu-selector');
        const headerLguName = document.getElementById('header-lgu-name');
        const lgus = await window.getLguList();

        if (lgus.length > 0) {
            selector.innerHTML = lgus.map(lgu => `<option value="${lgu.id}">${lgu.name}</option>`).join('');
            
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
        
                       
// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    window.addEventListener('hashchange', handleRouting);
    await initLguSelector(); // Initialize LGU selector before routing
    handleRouting(); // Initial load
});