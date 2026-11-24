const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const DATA_DIR = path.join(__dirname, 'data');
const JOURNAL_FILE = path.join(DATA_DIR, 'journal.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function initDB() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(JOURNAL_FILE)) {
        const students = [
            "Абрамов Артем", "Белова Мария", "Волков Дмитрий", "Гусева Алина", "Дмитриев Иван",
            "Егорова София", "Жуков Максим", "Зайцева Полина", "Иванов Никита", "Козлов Алексей",
            "Лебедева Виктория", "Морозов Кирилл", "Новикова Ева", "Орлов Даниил", "Петрова Анастасия",
            "Романов Михаил", "Соколова Дарья", "Тихонов Арсений", "Устинова Ксения", "Фролов Егор",
            "Хохлова Валерия", "Царев Матвей", "Чернова Алиса", "Шишкин Лев", "Щукина Анна",
            "Яковлев Тимур", "Яковлева Есения", "Антонов Марк", "Борисова Варвара", "Виноградов Владислав"
        ].map((name, id) => ({ id: id + 1, name }));

        // Структура: subjects -> { students, grades, homeworks, tests }
        const initialData = {
            class: "5В",
            subjects: {
                "Математика": { 
                    students, grades: {}, 
                    homework: "Повторить параграф 24, решить задачи № 15, 16 на стр. 45",
                    tests: [] // формат: { date: "12.02", type: "Контрольная работа", theme: "..." }
                },
                "Русский язык": { students, grades: {}, homework: "Упражнение 154, выучить словарные слова", tests: [] },
                "Литература": { students, grades: {}, homework: "Прочитать главу 3", tests: [] },
                "История": { students, grades: {}, homework: "Параграф 12", tests: [] },
                "Биология": { students, grades: {}, homework: "§ 24, вопросы устно", tests: [] },
                "География": { students, grades: {}, homework: "Нанести на контурную карту", tests: [] },
                "Труд": { students, grades: {}, homework: "Принести ткань", tests: [] },
                "Физкультура": { students, grades: {}, homework: "Комплекс упражнений", tests: [] }
            }
        };
        fs.writeFileSync(JOURNAL_FILE, JSON.stringify(initialData, null, 2));
    }
}

// API: получить всё
app.get('/api/data', (req, res) => {
    const data = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'));
    res.json(data);
});

// API: ДЗ
app.post('/api/homework', (req, res) => {
    const { subject, text } = req.body;
    const data = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'));
    if (data.subjects[subject]) {
        data.subjects[subject].homework = text;
        fs.writeFileSync(JOURNAL_FILE, JSON.stringify(data, null, 2));
        res.json({ success: true, text });
    } else {
        res.status(404).json({ error: 'Предмет не найден' });
    }
});

// API: Оценка (создать/изменить/удалить)
app.post('/api/grade', (req, res) => {
    const { subject, studentId, date, grade, type, comment, isDot, dueDate } = req.body;
    const data = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'));
    if (!data.subjects[subject]) return res.status(404).json({ error: 'Предмет не найден' });
    
    const key = `${studentId}-${date}`;
    // Если grade == null, удаляем
    if (grade === null || grade === undefined) {
        delete data.subjects[subject].grades[key];
    } else {
        data.subjects[subject].grades[key] = { grade, type, comment, isDot, dueDate };
    }
    
    fs.writeFileSync(JOURNAL_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true });
});

// API: Контрольная
app.post('/api/test', (req, res) => {
    const { subject, date, theme, action } = req.body;
    const data = JSON.parse(fs.readFileSync(JOURNAL_FILE, 'utf-8'));
    if (!data.subjects[subject]) return res.status(404).json({ error: 'Предмет не найден' });

    const subjectData = data.subjects[subject];
    if (!subjectData.tests) subjectData.tests = [];

    if (action === 'add') {
        // Добавляем, если ещё нет
        if (!subjectData.tests.find(t => t.date === date)) {
            subjectData.tests.push({ date, theme, type: 'Контрольная работа' });
        }
    } else if (action === 'remove') {
        subjectData.tests = subjectData.tests.filter(t => t.date !== date);
    }

    fs.writeFileSync(JOURNAL_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, tests: subjectData.tests });
});

initDB();
app.listen(PORT, () => console.log(`Сервер запущен: http://localhost:${PORT}`));
