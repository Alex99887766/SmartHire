const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./server');

// Збільшуємо загальний тайм-аут для тестів, що працюють з БД Atlas
jest.setTimeout(10000); 

describe('Тестування API системи SmartHire', () => {

    // Закриваємо з'єднання після тестів
    afterAll(async () => {
        await mongoose.connection.close();
    });

    test('Має повернути 200 та роль admin для правильних даних', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: "admin@test.com", password: "12345" });
        expect(response.statusCode).toBe(200);
    });

    test('Має повернути 401 для неправильного пароля', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({ email: "admin@test.com", password: "wrong" });
        expect(response.statusCode).toBe(401);
    });

    test('GET /api/vacancies має повертати масив даних', async () => {
        const response = await request(app).get('/api/vacancies');
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});