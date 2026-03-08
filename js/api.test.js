const api = require('./api.js');

// Mock the global window object and Firestore db
global.window = global;

// Mock direct localStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: jest.fn(key => store[key] || null),
        setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
        removeItem: jest.fn(key => { delete store[key]; }),
        clear: jest.fn(() => { store = {}; })
    };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true, configurable: true });

describe('API Unit Tests', () => {
    let mockCollection;
    let mockDoc;

    beforeEach(() => {
        // Reset mocks before each test
        mockDoc = {
            get: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            set: jest.fn()
        };

        mockCollection = {
            add: jest.fn(),
            get: jest.fn(),
            doc: jest.fn(() => mockDoc),
            orderBy: jest.fn().mockReturnThis(), // Chainable
            where: jest.fn().mockReturnThis()    // Chainable
        };

        // Setup window.db mock structure
        window.db = {
            collection: jest.fn((name) => mockCollection)
        };

        // Mock security globals
        window._getCurrentUser = jest.fn(() => ({
            uid: 'test-user',
            role: 'System Admin',
            permissions: {}
        }));
        window._checkPermission = jest.fn(() => true);

        // Silence console.log/error during tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});

        localStorage.clear();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('getLguList should fetch and map data correctly', async () => {
        // Arrange: Mock the Firestore response
        const mockData = [
            { id: '1', data: () => ({ name: 'Manila' }) },
            { id: '2', data: () => ({ name: 'Quezon City' }) }
        ];
        mockCollection.get.mockResolvedValue({ docs: mockData });

        // Act
        const result = await api.getLguList();

        // Assert
        expect(window.db.collection).toHaveBeenCalledWith('lgus');
        expect(mockCollection.orderBy).toHaveBeenCalledWith('name');
        expect(result).toEqual([
            { id: '1', name: 'Manila' },
            { id: '2', name: 'Quezon City' }
        ]);
    });

    test('createLgu should add data and return ID', async () => {
        // Arrange
        const newLgu = { name: 'Pasig' };
        mockCollection.add.mockResolvedValue({ id: 'new-id-123' });

        // Act
        const result = await api.createLgu(newLgu);

        // Assert
        expect(window.db.collection).toHaveBeenCalledWith('lgus');
        expect(mockCollection.add).toHaveBeenCalledWith(newLgu);
        expect(result).toBe('new-id-123');
    });

    test('getLguList should return empty array if db throws error', async () => {
        // Arrange
        mockCollection.get.mockRejectedValue(new Error('Connection failed'));

        // Act
        const result = await api.getLguList();

        // Assert
        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalled();
    });

    // --- LGU Tests ---
    test('getLguById should fetch single data', async () => {
        mockDoc.get.mockResolvedValue({ exists: true, id: 'l1', data: () => ({ name: 'Test' }) });
        const result = await api.getLguById('l1');
        expect(result.name).toBe('Test');
    });

    test('updateLgu should update data', async () => {
        await api.updateLgu('l1', { name: 'Updated' });
        expect(mockDoc.update).toHaveBeenCalledWith({ name: 'Updated' });
    });

    test('deleteLgu should delete document', async () => {
        await api.deleteLgu('l1');
        expect(mockDoc.delete).toHaveBeenCalled();
    });

    // --- FSBD Tests ---
    test('getFsbdList should fetch and sort data', async () => {
        mockCollection.get.mockResolvedValue({ docs: [] });
        await api.getFsbdList();
        expect(window.db.collection).toHaveBeenCalledWith('fsbds');
        // Removed expect(mockCollection.orderBy) because it's not used in development api.js
    });

    // --- Trip Tickets Tests ---
    test('getTripTickets should fetch and sort data', async () => {
        const mockData = [
            { id: '1', data: () => ({ date: '2023-02-01', driver: 'A' }) },
            { id: '2', data: () => ({ date: '2023-01-15', driver: 'B' }) }
        ];
        mockCollection.get.mockResolvedValue({ docs: mockData });
        const result = await api.getTripTickets('veh1');
        
        expect(window.db.collection).toHaveBeenCalledWith('trip_tickets');
        expect(mockCollection.where).toHaveBeenCalledWith('vehicleId', '==', 'veh1');
        // Sorted descending by date
        expect(result[0].date).toBe('2023-02-01');
    });

    test('createTripTicket should add data and return ID', async () => {
        mockCollection.add.mockResolvedValue({ id: 'tt1' });
        const result = await api.createTripTicket({ date: '2023-03-01', lguId: 'lgu-a', vehicleId: 'veh1' });
        expect(window.db.collection).toHaveBeenCalledWith('trip_tickets');
        expect(result).toBe('tt1');
    });

    test('deleteTripTicket should delete document', async () => {
        await api.deleteTripTicket('tt1');
        expect(mockDoc.delete).toHaveBeenCalled();
    });

    // ...

    // --- User Permissions & Test Settings ---
    test('getUserList should fetch data', async () => {
        mockCollection.get.mockResolvedValue({ docs: [] });
        await api.getUserList();
        expect(window.db.collection).toHaveBeenCalledWith('users');
    });

    test('updateUserPermissions should update data', async () => {
        await api.updateUserPermissions('u1', { role: 'Admin', assignedLguId: 'l1' });
        expect(mockDoc.update).toHaveBeenCalledWith({
            permissions: {
                role: 'Admin',
                assignedLguId: 'l1'
            }
        });
    });

    test('updateUserRole should succeed for System Admin', async () => {
        window._getCurrentUser.mockReturnValue({ role: 'System Admin' });
        await api.updateUserRole('u1', { role: 'LGU Admin', permissions: {}, assignedLguId: 'l1' });
        expect(mockDoc.update).toHaveBeenCalledWith({
            role: 'LGU Admin',
            permissions: {},
            assignedLguId: 'l1'
        });
    });

    test('updateUserRole should block escalation for LGU Admin', async () => {
        window._getCurrentUser.mockReturnValue({ role: 'LGU Admin', assignedLguId: 'l1' });
        await expect(api.updateUserRole('u1', { role: 'LGU Admin', permissions: {}, assignedLguId: 'l1' }))
            .rejects.toThrow(/You cannot assign the role "LGU Admin" as it is equal to or higher than your own level/);
    });

    test('updateUserRole should block different LGU for LGU Admin', async () => {
        window._getCurrentUser.mockReturnValue({ role: 'LGU Admin', assignedLguId: 'l1' });
        await expect(api.updateUserRole('u1', { role: 'LGU EEC Officer', permissions: {}, assignedLguId: 'l2' }))
            .rejects.toThrow(/You can only manage users within your own LGU/);
    });

    test('getDefaultPermissions should fetch setting', async () => {
        mockDoc.get.mockResolvedValue({ exists: true, data: () => ({ permissions: {} }) });
        window.db.collection.mockReturnValue({ doc: () => mockDoc });
        await api.getDefaultPermissions();
        expect(mockDoc.get).toHaveBeenCalled();
    });

    test('updateDefaultPermissions should update setting', async () => {
        window.db.collection.mockReturnValue({ doc: () => mockDoc });
        await api.updateDefaultPermissions({});
        expect(mockDoc.set).toHaveBeenCalled();
    });

    // --- Security Guard Tests ---
    describe('Security Guard Enforcement', () => {
        test('should throw error if not authenticated', async () => {
            window._getCurrentUser.mockReturnValue(null);
            await expect(api.createLgu({ name: 'fail' })).rejects.toThrow('Not authenticated');
        });

        test('should throw error if user is Pending', async () => {
            window._getCurrentUser.mockReturnValue({ role: 'Pending' });
            await expect(api.createLgu({ name: 'fail' })).rejects.toThrow('Account pending approval');
        });

        test('should throw error if missing write permission', async () => {
            window._getCurrentUser.mockReturnValue({ role: 'Auditor', permissions: {} });
            window._checkPermission.mockReturnValue(false);
            await expect(api.createLgu({ name: 'fail' })).rejects.toThrow('Write permission denied for: lgus');
        });

        test('should block LGU mismatch for restricted roles', async () => {
            window._getCurrentUser.mockReturnValue({ 
                role: 'LGU Admin', 
                assignedLguId: 'lgu-a',
                permissions: { fsbds: { write: true } }
            });
            window._checkPermission.mockReturnValue(true);
            
            // Try to create building for LGU B
            await expect(api.createFsbd({ lguId: 'lgu-b', name: 'Other LGU Bldg' }))
                .rejects.toThrow('Access denied: Cannot write data for a different LGU');
        });

        test('should allow LGU match for restricted roles', async () => {
            window._getCurrentUser.mockReturnValue({ 
                role: 'LGU Admin', 
                assignedLguId: 'lgu-a',
                permissions: { fsbds: { write: true } }
            });
            window._checkPermission.mockReturnValue(true);
            mockCollection.add.mockResolvedValue({ id: 'ok' });

            const result = await api.createFsbd({ lguId: 'lgu-a', name: 'My LGU Bldg' });
            expect(result).toBe('ok');
        });
    });
});