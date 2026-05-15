const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
app.use(cors());

// Використовуємо порт, який надає хостинг (Render), або 5000 для локальної розробки [cite: 1618]
const PORT = process.env.PORT || 5000;

// Middleware для розпізнавання JSON у запитах [cite: 1621-1623]
app.use(express.json());

// --- ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ ---
// Рядок підключення: береться з налаштувань Render (Atlas) або використовується локальний [cite: 657-658, 731]
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartHire_DB';

mongoose.connect(dbURI)
    .then(() => console.log('Успішно підключено до MongoDB'))
    .catch(err => console.error('Помилка підключення до бази даних:', err));

// --- МОДЕЛІ ДАНИХ (СХЕМИ) ---
// Модель для кандидатів [cite: 732, 767]
const Candidate = mongoose.model('Candidate', {
    name: { type: String, required: true },
    email: { type: String, required: true },
    skills: [String],
    status: { type: String, default: 'New' }
});

// Модель для вакансій [cite: 732, 767]
const Vacancy = mongoose.model('Vacancy', {
    title: { type: String, required: true },
    description: String,
    status: { type: String, default: 'open' }
});

// --- ЕНДПОІНТИ API ---

// 1. АВТОРИЗАЦІЯ (Спрощена логіка для демонстрації) [cite: 1426-1438, 1654-1658]
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // В реальних системах тут проводиться пошук у БД та перевірка хешу пароля [cite: 539, 1432]
    if (email === "admin@test.com" && password === "12345") {
        res.status(200).json({ 
            message: "Вхід виконано успішно", 
            token: "fake-jwt-token",
            user: { email: email, role: "admin" } 
        });
    } else {
        res.status(401).json({ message: "Невірний email або пароль" }); // 401 Unauthorized [cite: 1330]
    }
});

// 2. ПОШУК КАНДИДАТІВ ЗА НАВИЧКАМИ (Метод GET) [cite: 681-685, 1460, 1718]
// Виклик: /api/candidates/search?skill=Node.js
app.get('/api/candidates/search', async (req, res) => {
    const { skill } = req.query;
    try {
        // Пошук документів, де в масиві skills є вказана навичка [cite: 685]
        const results = await Candidate.find({ skills: skill });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Помилка сервера при пошуку" });
    }
});

// 3. ОТРИМАТИ СПИСОК ВСІХ ВАКАНСІЙ [cite: 1460, 1719]
app.get('/api/vacancies', async (req, res) => {
    try {
        const vacancies = await Vacancy.find();
        res.json(vacancies);
    } catch (error) {
        res.status(500).json({ message: "Не вдалося отримати вакансії" });
    }
});

// 4. ЗМІНА СТАТУСУ ВАКАНСІЇ (Метод PATCH) [cite: 691-692, 1320, 1581-1582]
app.patch('/api/vacancies/:id', async (req, res) => {
    const { status } = req.body;
    try {
        const updatedVacancy = await Vacancy.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true } // Повертає вже оновлений документ
        );
        if (!updatedVacancy) return res.status(404).json({ message: "Вакансію не знайдено" });
        res.json(updatedVacancy);
    } catch (error) {
        res.status(400).json({ message: "Некоректний ID або дані" });
    }
});

// ЗАПУСК СЕРВЕРА
app.listen(PORT, () => {
    console.log(`Сервер SmartHire працює на http://localhost:${PORT}`);
});