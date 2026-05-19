const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 5000;

// Middleware для розпізнавання JSON у запитах
app.use(express.json());

// --- ПІДКЛЮЧЕННЯ ДО БАЗИ ДАНИХ ---
// Рядок підключення: береться з налаштувань Render (Atlas)
const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartHire_DB';

mongoose.connect(dbURI)
    .then(() => console.log('Успішно підключено до MongoDB'))
    .catch(err => console.error('Помилка підключення до бази даних:', err));

// --- МОДЕЛІ ДАНИХ ---
const Candidate = mongoose.model('Candidate', {
    name: { type: String, required: true },
    email: { type: String, required: true },
    skills: [String],
    status: { type: String, default: 'New' },
    location: String,
    vacancyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vacancy', default: null } // Зв'язок з вакансією
});

const Vacancy = mongoose.model('Vacancy', {
    title: { type: String, required: true },
    description: String,
    status: { type: String, default: 'open' }
});

const User = mongoose.model('User', {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'recruiter'] }
});

// --- ЕНДПОІНТИ API ---

// 1. УНІВЕРСАЛЬНИЙ ПОШУК
app.get('/api/candidates/search', async (req, res) => {
    const { query } = req.query;
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

// 2. РЕДАГУВАННЯ ДАНИХ КАНДИДАТА
app.patch('/api/candidates/:id', async (req, res) => {
    try {
        const updated = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Не вдалося оновити дані" });
    }
});

// 3. РІВНІ ДОСТУПУ
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) {
            return res.status(401).json({ message: "Невірний email або пароль" });
        }
        res.json({ role: user.role, token: `secret-${user.role}-token` });
    } catch (error) {
        res.status(500).json({ message: "Помилка авторизації" });
    }
});

// Керування користувачами
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Помилка отримання користувачів" });
    }
});

app.post('/api/users', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.status(201).json(newUser);
    } catch (error) {
        res.status(400).json({ message: "Не вдалося створити користувача" });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "Користувача видалено" });
    } catch (error) {
        res.status(400).json({ message: "Помилка видалення" });
    }
});

// 3. ОТРИМАТИ СПИСОК ВСІХ ВАКАНСІЙ
app.get('/api/vacancies', async (req, res) => {
    try {
        const vacancies = await Vacancy.find().lean(); // .lean() дозволяє модифікувати об'єкти Mongoose

        // Для кожної вакансії шукаємо кандидатів, які до неї прив'язані
        const vacanciesWithCandidates = await Promise.all(vacancies.map(async (vacancy) => {
            const candidates = await Candidate.find({ vacancyId: vacancy._id }, 'name email status');
            return {
                ...vacancy,
                linkedCandidates: candidates // Додаємо масив кандидатів прямо у об'єкт вакансії
            };
        }));

        res.json(vacanciesWithCandidates);
    } catch (error) {
        res.status(500).json({ message: "Не вдалося отримати вакансії" });
    }
});

// 4. ЗМІНА СТАТУСУ ВАКАНСІЇ
app.patch('/api/vacancies/:id', async (req, res) => {
    const { status } = req.body;
    try {
        const updatedVacancy = await Vacancy.findByIdAndUpdate(
            req.params.id, 
            { status: status }, 
            { new: true }
        );
        if (!updatedVacancy) return res.status(404).json({ message: "Вакансію не знайдено" });
        res.json(updatedVacancy);
    } catch (error) {
        res.status(400).json({ message: "Некоректний ID або дані" });
    }
});

app.patch('/api/candidates/:id', async (req, res) => {
    try {
        const updated = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: "Не вдалося оновити дані кандидата" });
    }
});

// ЗАПУСК СЕРВЕРА
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Сервер SmartHire працює на http://localhost:${PORT}`);
    });
}

module.exports = app;