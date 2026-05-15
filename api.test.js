const request = require('supertest');
const app = require('./server'); // Імпортуємо наш додаток

describe('Тестування API системи SmartHire', () => {
    
    // Тест 1: Перевірка успішної авторизації
    test('Має повернути 200 та роль admin для правильних даних', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: "admin@test.com",
                password: "12345"
            });
        
        expect(response.statusCode).toBe(200);
        expect(response.body.role).toBe('admin');
    });

    // Тест 2: Перевірка помилки авторизації (401)
    test('Має повернути 401 для неправильного пароля', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email: "admin@test.com",
                password: "wrong_password"
            });
        
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Доступ заборонено');
    });

    // Тест 3: Перевірка ендпоінту вакансій
    test('GET /api/vacancies має повертати масив даних', async () => {
        const response = await request(app).get('/api/vacancies');
        
        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });
});