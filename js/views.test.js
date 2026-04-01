/**
 * @jest-environment jsdom
 */

// Mock API functions globally
global.window = global;

window.getOrganizationList = jest.fn().mockResolvedValue([]);
window.createOrganization = jest.fn();
window.updateOrganization = jest.fn();
window.getFsbdList = jest.fn().mockResolvedValue([]);
window.getVehicleList = jest.fn().mockResolvedValue([]);
window.getMadeList = jest.fn().mockResolvedValue([]);
window.getRioList = jest.fn().mockResolvedValue([]);
window.getPpaList = jest.fn().mockResolvedValue([]);
window.getUserList = jest.fn().mockResolvedValue([]);
window.getMecrReports = jest.fn().mockResolvedValue([]);
window.getTripTickets = jest.fn().mockResolvedValue([]);
window.getSeuList = jest.fn().mockResolvedValue([]);
window.getDefaultPermissions = jest.fn().mockResolvedValue({});

// Mock Firestore db for dashboard
window.db = {
    collection: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ docs: [] }),
        add: jest.fn(),
        doc: jest.fn()
    }))
};

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => store[key] = value.toString(),
        clear: () => store = {}
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock state permissions
jest.mock('./views/state.js', () => ({
    checkPermission: jest.fn().mockReturnValue(true),
    getCurrentOrganizationId: jest.fn().mockReturnValue(null),
    getCurrentUser: jest.fn().mockReturnValue({ role: 'System Admin', assignedOrganizationId: null })
}));

import { renderOrganizationList, initOrganizationForm } from './views/organizations.js';
import { renderFsbdList } from './views/fsbds.js';
import { renderDashboard } from './views/dashboard.js';
import { renderVehicleList } from './views/vehicles.js';
import { renderMadeList } from './views/made.js';
import { renderRioList } from './views/rios.js';
import { renderPpaList } from './views/ppas.js';
import { renderAdmin } from './views/admin.js';

describe('View Logic Tests', () => {
    
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('renderOrganizationList should populate table', async () => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="organization-table-body"></div>
            <div id="organization-empty-state" class="hidden"></div>
            <div id="organization-loading"></div>
        `;
        
        // Mock Data
        window.getOrganizationList.mockResolvedValue([
            { id: '1', name: 'Manila', region: 'NCR' }
        ]);

        // Act
        await renderOrganizationList();

        // Assert
        const tableBody = document.getElementById('organization-table-body');
        expect(tableBody.innerHTML).toContain('Manila');
        expect(tableBody.innerHTML).toContain('NCR');
    });

    test('renderFsbdList should populate table', async () => {
        // Setup DOM
        document.body.innerHTML = `
            <div id="fsbd-table-body"></div>
            <div id="fsbd-empty-state" class="hidden"></div>
            <div id="fsbd-loading"></div>
        `;
        
        // Mock Data
        window.getFsbdList.mockResolvedValue([
            { id: '1', name: 'City Hall', fsbd_type: 'Office' }
        ]);

        // Act
        await renderFsbdList();

        // Assert
        const tableBody = document.getElementById('fsbd-table-body');
        expect(tableBody.innerHTML).toContain('City Hall');
    });

    test('renderDashboard should call API functions', async () => {
        // Setup DOM elements expected by dashboard
        document.body.innerHTML = `
            <div id="stats-total-buildings"></div>
            <div id="stats-total-vehicles"></div>
            <div id="stats-high-rios"></div>
            <div id="stats-ongoing-ppas"></div>
            <div id="stats-total-electricity"></div>
            <div id="stats-total-fuel"></div>
            <div id="stats-total-savings"></div>
            <div id="stats-total-investment"></div>
            <tbody id="dashboard-recent-consumption-body"></tbody>
        `;

        await renderDashboard();

        expect(window.getFsbdList).toHaveBeenCalled();
        expect(window.getVehicleList).toHaveBeenCalled();
    });

    test('renderVehicleList should populate table', async () => {
        document.body.innerHTML = `
            <div id="vehicle-table-body"></div>
            <div id="vehicle-empty-state" class="hidden"></div>
            <div id="vehicle-loading"></div>
        `;
        window.getVehicleList.mockResolvedValue([
            { id: 'v1', plate_number: 'ABC-123', make: 'Toyota' }
        ]);

        await renderVehicleList();

        const tableBody = document.getElementById('vehicle-table-body');
        expect(tableBody.innerHTML).toContain('ABC-123');
        expect(tableBody.innerHTML).toContain('Toyota');
    });

    test('renderMadeList should populate table with building names', async () => {
        document.body.innerHTML = `
            <div id="made-table-body"></div>
            <div id="made-empty-state" class="hidden"></div>
            <div id="made-loading"></div>
        `;
        window.getMadeList.mockResolvedValue([
            { id: 'm1', description_of_equipment: 'AC Unit', fsbdId: 'b1' }
        ]);
        window.getFsbdList.mockResolvedValue([
            { id: 'b1', name: 'Main Office' }
        ]);

        await renderMadeList();

        const tableBody = document.getElementById('made-table-body');
        expect(tableBody.innerHTML).toContain('AC Unit');
        expect(tableBody.innerHTML).toContain('Main Office');
    });

    test('renderRioList should populate table with asset names', async () => {
        document.body.innerHTML = `
            <div id="rio-table-body"></div>
            <div id="rio-empty-state" class="hidden"></div>
            <div id="rio-loading"></div>
        `;
        window.getRioList.mockResolvedValue([
            { id: 'r1', proposed_action: 'Install LED', fsbdId: 'b1' }
        ]);
        window.getFsbdList.mockResolvedValue([
            { id: 'b1', name: 'Main Office' }
        ]);
        window.getVehicleList.mockResolvedValue([]);

        await renderRioList();

        const tableBody = document.getElementById('rio-table-body');
        expect(tableBody.innerHTML).toContain('Install LED');
        expect(tableBody.innerHTML).toContain('Main Office');
    });

    test('renderPpaList should populate table', async () => {
        document.body.innerHTML = `
            <div id="ppa-table-body"></div>
            <div id="ppa-empty-state" class="hidden"></div>
            <div id="ppa-loading"></div>
        `;
        window.getPpaList.mockResolvedValue([
            { id: 'p1', project_name: 'Solar Panel Install' }
        ]);

        await renderPpaList();

        const tableBody = document.getElementById('ppa-table-body');
        expect(tableBody.innerHTML).toContain('Solar Panel Install');
    });

    test('renderAdmin should fetch all data', async () => {
        document.body.innerHTML = `
        <div id="table-organizations"><tbody></tbody></div>
        <div id="table-fsbds"><tbody></tbody></div>
        <div id="admin-user-table-body"></div>
        <div id="admin-default-modules"></div>
        `;
        await renderAdmin();
        expect(window.getOrganizationList).toHaveBeenCalled();
    });

    test('initOrganizationForm should handle form submission', async () => {
        // Setup DOM with form elements and the selector (needed by initOrganizationSelector)
        document.body.innerHTML = `
            <form id="organization-form">
                <h2 id="form-title"></h2>
                <input type="hidden" id="organization-id">
                <input type="text" id="name" value="Test City">
                <input type="text" id="region" value="Test Region">
                <input type="text" id="province" value="Test Province">
                <button type="submit">Save</button>
            </form>
            <select id="organization-selector"></select>
            <div id="form-error" class="hidden"></div>
            <div id="form-success" class="hidden"></div>
            <div id="submit-btn-text"></div>
            <div id="submit-btn-spinner" class="hidden"></div>
        `;

        // Mock successful creation and list fetch
        window.createOrganization.mockResolvedValue('new-id');
        window.getOrganizationList.mockResolvedValue([]); 

        // Initialize form logic
        await initOrganizationForm();

        // Simulate submit
        const form = document.getElementById('organization-form');
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        expect(window.createOrganization).toHaveBeenCalledWith({
            name: 'Test City',
            region: 'Test Region',
            province: 'Test Province'
        });
    });
});