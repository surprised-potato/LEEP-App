// js/router.js
import { updateSidebarActiveState } from './views/ui.js';
import { loadContent } from './app.js';
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
        // The original app.js passed the ID as an argument to the controller.
        // We replicate that behavior here for the 'edit' routes.
        const controller = route.params?.id 
            ? () => route.controller(route.params.id) 
            : route.controller;
        await loadContent(route.view, controller);
    } else {
        const appContent = document.getElementById('app-content');
        if (appContent) {
            appContent.innerHTML = '<h1>404 - Not Found</h1><p>The page you are looking for does not exist.</p>';
        }
    }
}