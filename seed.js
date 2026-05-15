const mongoose = require('mongoose');

const dbURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/SmartHire_DB';

const Candidate = mongoose.model('Candidate', {
    name: String, email: String, skills: [String], status: String
});

const candidates = [
    { name: "Олексій Гнатецький", email: "alex@test.com", skills: ["Node.js", "React"], status: "New" },
    { name: "Марія Іванова", email: "maria@test.com", skills: ["Python", "Django"], status: "Interview" },
    { name: "Іван Петров", email: "petrov@test.com", skills: ["Node.js", "MongoDB"], status: "New" }
];

async function seedDB() {
    try {
        await mongoose.connect(dbURI);
        await Candidate.deleteMany({}); // Видаляємо старі дані, щоб не дублювати [cite: 701]
        await Candidate.insertMany(candidates); // Вставляємо нові [cite: 676, 752]
        console.log("База даних успішно наповнена тестовими кандидатами!");
        process.exit();
    } catch (err) {
        console.error("Помилка наповнення:", err);
        process.exit(1);
    }
}

seedDB();