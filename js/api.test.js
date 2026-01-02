const api = require('./api.js');

// Mock the global window object and Firestore db
global.window = global;

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

        // Silence console.log/error during tests
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
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

    // --- FSBD Tests ---
    test('createFsbd should add data', async () => {
        mockCollection.add.mockResolvedValue({ id: 'fsbd-1' });
        const result = await api.createFsbd({ name: 'Building A' });
        expect(window.db.collection).toHaveBeenCalledWith('fsbds');
        expect(result).toBe('fsbd-1');
    });

    test('updateFsbd should update data', async () => {
        const result = await api.updateFsbd('fsbd-1', { name: 'Building B' });
        expect(window.db.collection).toHaveBeenCalledWith('fsbds');
        expect(mockDoc.update).toHaveBeenCalledWith({ name: 'Building B' });
        expect(result).toBe(true);
    });

    test('deleteFsbd should delete document', async () => {
        const result = await api.deleteFsbd('fsbd-1');
        expect(mockDoc.delete).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    // --- Vehicle Tests ---
    test('getVehicleList should fetch data', async () => {
        mockCollection.get.mockResolvedValue({ docs: [{ id: 'v1', data: () => ({ plate: 'ABC' }) }] });
        const result = await api.getVehicleList();
        expect(window.db.collection).toHaveBeenCalledWith('vehicles');
        expect(result).toHaveLength(1);
    });

    test('createVehicle should add data', async () => {
        mockCollection.add.mockResolvedValue({ id: 'v1' });
        await api.createVehicle({ plate: 'ABC' });
        expect(window.db.collection).toHaveBeenCalledWith('vehicles');
    });

    // --- MADE Tests ---
    test('getMadeList should fetch data', async () => {
        mockCollection.get.mockResolvedValue({ docs: [] });
        await api.getMadeList();
        expect(window.db.collection).toHaveBeenCalledWith('made_equipment');
    });

    // --- MECR Tests ---
    test('getMecrReports should fetch and sort data', async () => {
        const mockReports = [
            { id: 'r1', data: () => ({ reporting_year: 2022, reporting_month: 1 }) },
            { id: 'r2', data: () => ({ reporting_year: 2023, reporting_month: 1 }) }
        ];
        mockCollection.get.mockResolvedValue({ docs: mockReports });
        
        const result = await api.getMecrReports('bldg-1');
        
        expect(window.db.collection).toHaveBeenCalledWith('mecr_reports');
        expect(mockCollection.where).toHaveBeenCalledWith('fsbdId', '==', 'bldg-1');
        // Check client-side sorting (2023 before 2022)
        expect(result[0].reporting_year).toBe(2023);
    });

    test('createMecrReport should add data', async () => {
        mockCollection.add.mockResolvedValue({ id: 'r1' });
        await api.createMecrReport({ kwh: 100 });
        expect(window.db.collection).toHaveBeenCalledWith('mecr_reports');
    });

    // --- MFCR Tests ---
    test('getMfcrReports should fetch and sort data', async () => {
        mockCollection.get.mockResolvedValue({ docs: [] });
        await api.getMfcrReports('veh-1');
        expect(window.db.collection).toHaveBeenCalledWith('mfcr_reports');
        expect(mockCollection.where).toHaveBeenCalledWith('vehicleId', '==', 'veh-1');
    });

    // --- RIO Tests ---
    test('getRioList should fetch data', async () => {
        mockCollection.get.mockResolvedValue({ docs: [] });
        await api.getRioList();
        expect(window.db.collection).toHaveBeenCalledWith('rios');
    });

    test('createRio should add data', async () => {
        mockCollection.add.mockResolvedValue({ id: 'rio-1' });
        await api.createRio({ action: 'Save energy' });
        expect(window.db.collection).toHaveBeenCalledWith('rios');
    });

    // --- PPA Tests ---
    test('getPpaList should fetch data', async () => {
        mockCollection.get.mockResolvedValue({ docs: [] });
        await api.getPpaList();
        expect(window.db.collection).toHaveBeenCalledWith('ppas');
    });

    test('createPpa should add data', async () => {
        mockCollection.add.mockResolvedValue({ id: 'ppa-1' });
        await api.createPpa({ name: 'Project X' });
        expect(window.db.collection).toHaveBeenCalledWith('ppas');
    });
});