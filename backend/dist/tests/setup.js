import { seedDatabase } from '../utils/seed.js';
beforeAll(async () => {
    // Seed database before running tests
    try {
        await seedDatabase();
    }
    catch (error) {
        console.error('Failed to seed database:', error);
    }
});
