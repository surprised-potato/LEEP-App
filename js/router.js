// js/router.js
import { updateSidebarActiveState } from './views/ui.js';
import { loadContent } from './app.js';
import { checkPermission } from './views/state.js';
import { renderDashboard } from './views/dashboard.js';
import { renderLguList, initLguForm } from './views/lgus.js';
import { renderFsbdList, initFsbdForm } from './views/fsbds.js';
import { renderVehicleList, initVehicleForm } from './views/vehicles.js';
import { renderMadeList, initMadeForm } from './views/made.js';
import { initConsumptionPage } from './views/consumption.js';
import { renderSeuPage } from './views/seu.js';
import { renderRioList, initRioForm } from './views/rios.js';
import { renderPpaList, initPpaForm } from './views/ppas.js';
import { renderReporting } from './views/reporting.js';
import { renderAdmin } from './views/admin.js';
import { renderUserManagement } from './views/user-management.js';

const routes = {
    '/dashboard': { view: 'views/dashboard.html', controller: renderDashboard },
    '/lgus': { view: 'views/lgu-list.html', controller: renderLguList },
    '/lgus/new': { view: 'views/lgu-form.html', controller: initLguForm },
    '/lgus/edit/:id': { view: 'views/lgu-form.html', controller: initLguForm },
    '/fsbds': { view: 'views/fsbd-list.html', controller: renderFsbdList },
    '/fsbds/new': { view: 'views/fsbd-form.html', controller: initFsbdForm },
    '/fsbds/edit/:id': { view: 'views/fsbd-form.html', controller: initFsbdForm },
    '/vehicles': { view: 'views/vehicle-list.html', controller: renderVehicleList },
    '/vehicles/new': { view: 'views/vehicle-form.html', controller: initVehicleForm },
    '/vehicles/edit/:id': { view: 'views/vehicle-form.html', controller: initVehicleForm },
    '/made': { view: 'views/made-list.html', controller: renderMadeList },
    '/made/new': { view: 'views/made-form.html', controller: initMadeForm },
    '/made/edit/:id': { view: 'views/made-form.html', controller: initMadeForm },
    '/consumption': { view: 'views/consumption.html', controller: initConsumptionPage },
    '/seu': { view: 'views/seu.html', controller: renderSeuPage },
    '/rios': { view: 'views/rio-list.html', controller: renderRioList },
    '/rios/new': { view: 'views/rio-form.html', controller: initRioForm },
    '/rios/edit/:id': { view: 'views/rio-form.html', controller: initRioForm },
    '/ppas': { view: 'views/ppa-list.html', controller: renderPpaList },
    '/ppas/new': { view: 'views/ppa-form.html', controller: initPpaForm },
    '/ppas/edit/:id': { view: 'views/ppa-form.html', controller: initPpaForm },
    '/reporting': { view: 'views/reporting.html', controller: renderReporting },
    '/admin': { view: 'views/admin.html', controller: renderAdmin },
    '/users': { view: 'views/user-management.html', controller: renderUserManagement },
    '/manual': { view: 'views/user-manual.html', controller: null },
};

function parsePath(path) {
    // This is a simple parser. For more complex needs, a library might be better.
    const pathParts = path.split('/');
    
    for (const routePath in routes) {
        const routeParts = routePath.split('/');
        if (routeParts.length !== pathParts.length) continue;

        const params = {};
        let match = true;
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith(':')) {
                params[routeParts[i].substring(1)] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                match = false;
                break;
            }
        }

        if (match) {
            return { ...routes[routePath], params };
        }
    }
    return null;
}

export async function handleRouting() {
    if (typeof location === 'undefined') return;

    updateSidebarActiveState();
    
    const path = location.hash.slice(1) || '/dashboard';
    const route = parsePath(path);

    if (route) {
        // --- ROUTE GUARD ---
        // Extract the core module ID (e.g., "fsbds" from "/fsbds" or "/fsbds/123")
        const moduleId = path.startsWith('/') ? path.split('/')[1] : path.split('/')[0];
        
        // Modules that don't need distinct permission checks (like logout) or 
        // routes that should always be accessible if logged in.
        const publicModules = ['logout', 'dashboard', 'profile', 'manual']; // Added 'manual' as it's a static page
        
        if (moduleId && !publicModules.includes(moduleId) && !checkPermission(moduleId, 'read')) {
            console.warn(`Access denied to module: ${moduleId}`);
            const appContent = document.getElementById('app-content');
            if (appContent) {
                appContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-[60vh] text-center px-4">
                        <div class="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                            <svg class="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h2 class="text-3xl font-black text-gray-800 mb-2">403 — Access Denied</h2>
                        <p class="text-gray-500 max-w-md mx-auto mb-8">
                            You do not have the necessary permissions to access the <strong>${moduleId.toUpperCase()}</strong> module. 
                            Please contact your supervisor if you believe this is an error.
                        </p>
                        <a href="#/dashboard" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all">
                            Return to Dashboard
                        </a>
                    </div>
                `;
            }
            return;
        }
        // --- END ROUTE GUARD ---

        // The original app.js passed the ID as an argument to the controller.
        // Wrap the controller to handle parameters and the loadId correctly.
        // - For edit routes (:id), we pass the ID as the first argument.
        // - For "new" routes, we pass null as the first argument so it defaults correctly.
        // - For all routes, we can pass loadId as an additional argument if they need it.
        const wrappedController = route.controller ? async (loadId) => {
            if (route.params?.id) {
                return await route.controller(route.params.id, loadId);
            } else if (path.endsWith('/new')) {
                return await route.controller(null, loadId);
            } else {
                return await route.controller(loadId);
            }
        } : null;
            
        await loadContent(route.view, wrappedController);
    } else {
        console.error("No route found for path:", path);
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = '<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>';
        }
    }
}