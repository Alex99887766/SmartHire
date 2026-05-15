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

// 1. УНІВЕРСАЛЬНИЙ ПОШУК (за навичкою, ім'ям або статусом) [cite: 93, 1127]
app.get('/api/candidates/search', async (req, res) => {
    const { query } = req.query; // Отримуємо загальний рядок пошуку
    try {
        const results = await Candidate.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { skills: { $in: [new RegExp(query, 'i')] } },
                { status: { $regex: query, $options: 'i' } }
            ]
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: "Помилка пошуку" });
    }
});

// 2. РЕДАГУВАННЯ ДАНИХ КАНДИДАТА (PATCH) [cite: 721, 1289]
app.patch('/api/candidates/:id', async (req, res) => {
    try {
        const updated = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Не вдалося оновити дані" });
    }
});

// 3. РІВНІ ДОСТУПУ (RBAC) [cite: 832, 845, 1088]
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    
    // Імітація бази користувачів з ролями
    if (email === "admin@test.com" && password === "12345") {
        res.json({ role: "admin", token: "secret-admin-token" });
    } else if (email === "recruiter@test.com" && password === "12345") {
        res.json({ role: "recruiter", token: "secret-recruiter-token" });
    } else {
        res.status(401).json({ message: "Доступ заборонено" });
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

module.exports = app;