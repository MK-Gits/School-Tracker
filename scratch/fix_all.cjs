const fs = require('fs');
const path = require('path');

function fixFile(filePath, replacements) {
    console.log(`Processing ${filePath}...`);
    let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
    
    for (const r of replacements) {
        content = content.replace(r.from, r.to);
    }
    
    fs.writeFileSync(filePath, content);
}

// --- DAILY TRACKER ---
fixFile('src/pages/DailyTracker.jsx', [
    { from: "import { api } from '../utils/api';", to: "import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';" },
    { from: "const DailyTracker = () => {\n    const [syllabusData, setSyllabusData] = useState(() => loadData('syllabus_data', []));\n    const [activitiesData, setActivitiesData] = useState(() => loadData('activities_data', []));\n    const [allDailyTasks, setAllDailyTasks] = useState(() => {\n        const stored = loadData('daily_tasks_data', {});\n        // Migration: If stored tasks is an array (old structure), move it to today\n        if (Array.isArray(stored)) {\n            const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;\n            return { [today]: stored };\n        }\n        return stored;\n    });", 
      to: "const DailyTracker = () => {\n    const { currentStudent } = useStudent();\n    const [syllabusData, setSyllabusData] = useState([]);\n    const [activitiesData, setActivitiesData] = useState([]);\n    const [allDailyTasks, setAllDailyTasks] = useState({});\n    const [loading, setLoading] = useState(true);" 
    },
    { from: /    useEffect\(\(\) => {\n        \/\/ We sync from storage if and only if it changes externally\n        const handleStorage = \(\) => {\n            setSyllabusData\(loadData\('syllabus_data', \[\]\)\);\n            setActivitiesData\(loadData\('activities_data', \[\]\)\);\n            const stored = loadData\('daily_tasks_data', {}\);\n            setAllDailyTasks\(Array\.isArray\(stored\) \? { \[formatDateKey\(new Date\(\)\)\]: stored } : stored\);\n        };\n        window\.addEventListener\('storage', handleStorage\);\n        return \(\) => window\.removeEventListener\('storage', handleStorage\);\n    }, \[\]\);/g,
      to: `    useEffect(() => {
        if (currentStudent?.id) {
            setLoading(true);
            Promise.all([
                api.getSyllabus(currentStudent.id),
                api.getActivities(currentStudent.id),
                api.getDailyTasks(currentStudent.id)
            ]).then(([syllabus, activities, daily]) => {
                setSyllabusData(syllabus);
                setActivitiesData(activities);
                setAllDailyTasks(daily);
                setLoading(false);
            });
        }
    }, [currentStudent?.id]);`
    },
    { from: /saveData\('daily_tasks_data', updatedTasks\);/g, to: "api.saveDailyTasks(currentStudent?.id, updatedTasks);" },
    { from: /const storedTests = loadData\('tests_data', \[\]\);/g, to: "const storedTests = await api.getGrades(currentStudent?.id);" },
    { from: /saveData\('tests_data', updatedTests\);/g, to: "api.saveGrades(currentStudent?.id, updatedTests);" },
    { from: "const addTest = (e) => {", to: "const addTest = async (e) => {" },
    { from: "return (\n        <div className=\"space-y-8\">", to: "if (loading) return <div className=\"text-center py-12 text-gray-500\">Loading tracker...</div>;\n\n    return (\n        <div className=\"space-y-8\">" }
]);

// --- GRADEBOOK ---
fixFile('src/pages/Gradebook.jsx', [
    { from: "const Gradebook = () => {\n    const [tests, setTests] = useState(() => loadData('tests_data', []));\n    const [subjects, setSubjects] = useState(() => loadData('syllabus_data', []));",
      to: "const Gradebook = () => {\n    const { currentStudent } = useStudent();\n    const [tests, setTests] = useState([]);\n    const [subjects, setSubjects] = useState([]);\n    const [loading, setLoading] = useState(true);"
    },
    { from: /    useEffect\(\(\) => {\n        const handleStorage = \(\) => {\n            setTests\(loadData\('tests_data', \[\]\)\);\n            setSubjects\(loadData\('syllabus_data', \[\]\)\);\n        };\n        window\.addEventListener\('storage', handleStorage\);\n        return \(\) => window\.removeEventListener\('storage', handleStorage\);\n    }, \[\]\);/g,
      to: `    useEffect(() => {
        if (currentStudent?.id) {
            setLoading(true);
            Promise.all([
                api.getGrades(currentStudent.id),
                api.getSyllabus(currentStudent.id)
            ]).then(([grades, syllabus]) => {
                setTests(grades);
                setSubjects(syllabus);
                setLoading(false);
            });
        }
    }, [currentStudent?.id]);`
    },
    { from: /saveData\('tests_data', updatedTests\);/g, to: "api.saveGrades(currentStudent?.id, updatedTests);" },
    { from: "return (\n        <div className=\"space-y-8\">", to: "if (loading) return <div className=\"text-center py-12 text-gray-500\">Loading gradebook...</div>;\n\n    return (\n        <div className=\"space-y-8\">" }
]);

// --- STUDY NOTES ---
fixFile('src/pages/StudyNotes.jsx', [
    { from: "const StudyNotes = () => {\n    const [notes, setNotes] = useState(() => loadData('study_notes_data', []));",
      to: "const StudyNotes = () => {\n    const { currentStudent } = useStudent();\n    const [notes, setNotes] = useState([]);\n    const [loading, setLoading] = useState(true);"
    },
    { from: /    useEffect\(\(\) => {\n        const handleStorage = \(\) => {\n            setNotes\(loadData\('study_notes_data', \[\]\)\);\n        };\n        window\.addEventListener\('storage', handleStorage\);\n        return \(\) => window\.removeEventListener\('storage', handleStorage\);\n    }, \[\]\);/g,
      to: `    useEffect(() => {
        if (currentStudent?.id) {
            setLoading(true);
            api.getNotes(currentStudent.id).then(data => {
                setNotes(data);
                setLoading(false);
            });
        }
    }, [currentStudent?.id]);`
    },
    { from: /saveData\('study_notes_data', updatedNotes\);/g, to: "api.saveNotes(currentStudent?.id, updatedNotes);" },
    { from: "return (\n        <div className=\"space-y-8\">", to: "if (loading) return <div className=\"text-center py-12 text-gray-500\">Loading notes...</div>;\n\n    return (\n        <div className=\"space-y-8\">" }
]);

console.log("All pages fixed!");
