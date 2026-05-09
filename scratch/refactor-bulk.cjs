const fs = require('fs');

// --- StudyNotes.jsx ---
let file = 'src/pages/StudyNotes.jsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { loadData, saveData } from '../utils/storage';`,
  `import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';`
);

content = content.replace(
  `const StudyNotes = () => {\n    const [notes, setNotes] = useState(() => loadData('study_notes_data', []));`,
  `const StudyNotes = () => {\n    const { currentStudent } = useStudent();\n    const [notes, setNotes] = useState([]);\n    const [loading, setLoading] = useState(true);`
);

content = content.replace(
  `    useEffect(() => {\n        saveData('study_notes_data', notes);\n    }, [notes]);`,
  `    useEffect(() => {\n        if (currentStudent?.id) {\n            api.getNotes(currentStudent.id).then(data => {\n                setNotes(data);\n                setLoading(false);\n            });\n        }\n    }, [currentStudent?.id]);\n\n    useEffect(() => {\n        if (!loading && currentStudent?.id) {\n            api.saveNotes(currentStudent.id, notes);\n        }\n    }, [notes, loading, currentStudent?.id]);`
);

content = content.replace(
  /return \(\n        <div className="space-y-8">/g,
  `if (loading) return <div className="text-center py-12 text-gray-500">Loading notes...</div>;\n\n    return (\n        <div className="space-y-8">`
);
fs.writeFileSync(file, content);


// --- DailyTracker.jsx ---
file = 'src/pages/DailyTracker.jsx';
content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { loadData, saveData } from '../utils/storage';`,
  `import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';`
);

content = content.replace(
  `const DailyTracker = () => {\n    const [tasks, setTasks] = useState(() => loadData('daily_tasks_data', []));`,
  `const DailyTracker = () => {\n    const { currentStudent } = useStudent();\n    const [tasks, setTasks] = useState([]);\n    const [loading, setLoading] = useState(true);`
);

content = content.replace(
  `    useEffect(() => {\n        saveData('daily_tasks_data', tasks);\n    }, [tasks]);`,
  `    useEffect(() => {\n        if (currentStudent?.id) {\n            api.getDailyTasks(currentStudent.id).then(data => {\n                setTasks(data);\n                setLoading(false);\n            });\n        }\n    }, [currentStudent?.id]);\n\n    useEffect(() => {\n        if (!loading && currentStudent?.id) {\n            api.saveDailyTasks(currentStudent.id, tasks);\n        }\n    }, [tasks, loading, currentStudent?.id]);`
);

content = content.replace(
  /return \(\n        <div className="space-y-8">/g,
  `if (loading) return <div className="text-center py-12 text-gray-500">Loading daily tasks...</div>;\n\n    return (\n        <div className="space-y-8">`
);
fs.writeFileSync(file, content);


// --- Gradebook.jsx ---
file = 'src/pages/Gradebook.jsx';
content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `import { loadData, saveData } from '../utils/storage';`,
  `import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';`
);

content = content.replace(
  `const Gradebook = () => {\n    const [grades, setGrades] = useState(() => loadData('gradebook_data', {}));`,
  `const Gradebook = () => {\n    const { currentStudent } = useStudent();\n    const [grades, setGrades] = useState({});\n    const [loading, setLoading] = useState(true);`
);

content = content.replace(
  `    useEffect(() => {\n        saveData('gradebook_data', grades);\n    }, [grades]);`,
  `    useEffect(() => {\n        if (currentStudent?.id) {\n            api.getGrades(currentStudent.id).then(data => {\n                setGrades(data || {});\n                setLoading(false);\n            });\n        }\n    }, [currentStudent?.id]);\n\n    useEffect(() => {\n        if (!loading && currentStudent?.id) {\n            api.saveGrades(currentStudent.id, grades);\n        }\n    }, [grades, loading, currentStudent?.id]);`
);

content = content.replace(
  /return \(\n        <div className="space-y-8 max-w-4xl mx-auto">/g,
  `if (loading) return <div className="text-center py-12 text-gray-500">Loading gradebook...</div>;\n\n    return (\n        <div className="space-y-8 max-w-4xl mx-auto">`
);
fs.writeFileSync(file, content);

console.log('Refactored StudyNotes, DailyTracker, Gradebook');
