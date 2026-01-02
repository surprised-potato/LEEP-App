/**
 * @jest-environment jsdom
 */

// Mock API functions globally before requiring app.js
global.getLguList = jest.fn();
global.createLgu = jest.fn();
global.updateLgu = jest.fn();
global.getFsbdList = jest.fn();
global.getVehicleList = jest.fn();
global.getMadeList = jest.fn();
global.getRioList = jest.fn();
global.getPpaList = jest.fn();

// Mock Firestore db for dashboard
global.window = global;
global.window.db = {
    collection: jest.fn(() => ({
        get: jest.fn().mockResolvedValue({ docs: [] })
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

const app = require('./app.js');

describe('View Logic Tests', () => {
    
    beforeEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('renderLguList should populate table', async () => {
        // Setup DOM
        document.body.innerHTML = '<tbody id="lgu-table-body"></tbody>';
        
        // Mock Data
        global.getLguList.mockResolvedValue([
            { id: '1', name: 'Manila', region: 'NCR' }
        ]);

        // Act
        await app.renderLguList();

        // Assert
        const tableBody = document.getElementById('lgu-table-body');
        expect(tableBody.innerHTML).toContain('Manila');
        expect(tableBody.innerHTML).toContain('NCR');
    });

    test('renderFsbdList should populate table', async () => {
        // Setup DOM
        document.body.innerHTML = '<tbody id="fsbd-table-body"></tbody>';
        
        // Mock Data
        global.getFsbdList.mockResolvedValue([
            { id: '1', name: 'City Hall', fsbd_type: 'Office' }
        ]);

        // Act
        await app.renderFsbdList();

        // Assert
        const tableBody = document.getElementById('fsbd-table-body');
        expect(tableBody.innerHTML).toContain('City Hall');
    });

    test('renderDashboard should call API functions', async () => {
        // Setup DOM elements expected by dashboard
        document.body.innerHTML = '<div id="stats-total-buildings"></div><div id="stats-total-vehicles"></div><div id="stats-high-rios"></div><div id="stats-ongoing-ppas"></div>';

        await app.renderDashboard();

        expect(global.getFsbdList).toHaveBeenCalled();
        expect(global.getVehicleList).toHaveBeenCalled();
    });

    test('renderVehicleList should populate table', async () => {
        document.body.innerHTML = '<tbody id="vehicle-table-body"></tbody>';
        global.getVehicleList.mockResolvedValue([
            { id: 'v1', plate_number: 'ABC-123', make: 'Toyota' }
        ]);

        await app.renderVehicleList();

        const tableBody = document.getElementById('vehicle-table-body');
        expect(tableBody.innerHTML).toContain('ABC-123');
        expect(tableBody.innerHTML).toContain('Toyota');
    });

    test('renderMadeList should populate table with building names', async () => {
        document.body.innerHTML = '<tbody id="made-table-body"></tbody>';
        global.getMadeList.mockResolvedValue([
            { id: 'm1', description_of_equipment: 'AC Unit', fsbdId: 'b1' }
        ]);
        global.getFsbdList.mockResolvedValue([
            { id: 'b1', name: 'Main Office' }
        ]);

        await app.renderMadeList();

        const tableBody = document.getElementById('made-table-body');
        expect(tableBody.innerHTML).toContain('AC Unit');
        expect(tableBody.innerHTML).toContain('Main Office');
    });

    test('renderRioList should populate table with asset names', async () => {
        document.body.innerHTML = '<tbody id="rio-table-body"></tbody>';
        global.getRioList.mockResolvedValue([
            { id: 'r1', proposed_action: 'Install LED', fsbdId: 'b1' }
        ]);
        global.getFsbdList.mockResolvedValue([
            { id: 'b1', name: 'Main Office' }
        ]);
        global.getVehicleList.mockResolvedValue([]);

        await app.renderRioList();

        const tableBody = document.getElementById('rio-table-body');
        expect(tableBody.innerHTML).toContain('Install LED');
        expect(tableBody.innerHTML).toContain('Main Office');
    });

    test('renderPpaList should populate table', async () => {
        document.body.innerHTML = '<tbody id="ppa-table-body"></tbody>';
        global.getPpaList.mockResolvedValue([
            { id: 'p1', project_name: 'Solar Panel Install' }
        ]);

        await app.renderPpaList();

        const tableBody = document.getElementById('ppa-table-body');
        expect(tableBody.innerHTML).toContain('Solar Panel Install');
    });

    test('renderAdmin should fetch all data', async () => {
        document.body.innerHTML = '<div id="table-lgus"><tbody></tbody></div><div id="table-fsbds"><tbody></tbody></div>'; // Partial DOM
        await app.renderAdmin();
        expect(global.getLguList).toHaveBeenCalled();
    });

    test('initLguForm should handle form submission', async () => {
        // Setup DOM with form elements and the selector (needed by initLguSelector)
        document.body.innerHTML = `
            <form id="lgu-form">
                <h2 id="form-title"></h2>
                <input type="hidden" id="lgu-id">
                <input type="text" id="name">
                <input type="text" id="region">
                <input type="text" id="province">
                <button type="submit">Save</button>
            </form>
            <select id="lgu-selector"></select>
        `;

        // Mock successful creation and list fetch
        global.createLgu.mockResolvedValue('new-id');
        global.getLguList.mockResolvedValue([]); 

        // Initialize form logic
        await app.initLguForm();

        // Simulate user input
        document.getElementById('name').value = 'Test City';
        document.getElementById('region').value = 'Test Region';
        document.getElementById('province').value = 'Test Province';

        // Simulate submit
        const form = document.getElementById('lgu-form');
        form.dispatchEvent(new Event('submit'));

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Assert
        expect(global.createLgu).toHaveBeenCalledWith({
            name: 'Test City',
            region: 'Test Region',
            province: 'Test Province'
        });
    });
});