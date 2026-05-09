const fs = require('fs');

function refactorFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
    for (let r of replacements) {
        content = content.replace(r.from, r.to);
    }
    fs.writeFileSync(file, content);
}

// 1. SyllabusTracker
refactorFile('src/pages/SyllabusTracker.jsx', [
    {
        from: `import { loadData, saveData } from '../utils/storage';`,
        to: `import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';`
    },
    {
        from: `const SyllabusTracker = () => {\n    const [subjects, setSubjects] = useState(() => loadData('syllabus_data', []));`,
        to: `const SyllabusTracker = () => {\n    const { currentStudent } = useStudent();\n    const [subjects, setSubjects] = useState([]);\n    const [loading, setLoading] = useState(true);`
    },
    {
        from: `    useEffect(() => {\n        const handleStorage = () => {\n            setSubjects(loadData('syllabus_data', []));\n        };\n        window.addEventListener('storage', handleStorage);\n        return () => window.removeEventListener('storage', handleStorage);\n    }, []);`,
        to: `    useEffect(() => {\n        if (currentStudent?.id) {\n            api.getSyllabus(currentStudent.id).then(data => {\n                setSubjects(data);\n                setLoading(false);\n            });\n        }\n    }, [currentStudent?.id]);`
    },
    { from: /saveData\('syllabus_data',\s*/g, to: 'api.saveSyllabus(currentStudent?.id, ' },
    { from: /saveData\('activities_data',\s*/g, to: 'api.saveActivities(currentStudent?.id, ' },
    { from: /let activities = loadData\('activities_data', \[\]\);/g, to: `let activities = await api.getActivities(currentStudent?.id);` },
    { from: /const loadCurriculum = \(\) => {/g, to: `const loadCurriculum = async () => {` },
    { from: /const activities = loadData\('activities_data', \[\]\);/g, to: `const activities = await api.getActivities(currentStudent?.id);` },
    { from: /const addTopic = useCallback\(\(subjectId\) => {/g, to: `const addTopic = useCallback(async (subjectId) => {` },
    { from: /return \(\n        <div className="space-y-8">/g, to: `if (loading) return <div className="text-center py-12 text-gray-500">Loading syllabus...</div>;\n\n    return (\n        <div className="space-y-8">` }
]);

// 2. ActivitiesTracker
refactorFile('src/pages/ActivitiesTracker.jsx', [
    {
        from: `import { loadData, saveData } from '../utils/storage';`,
        to: `import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';`
    },
    {
        from: `const ActivitiesTracker = () => {\n    const [activities, setActivities] = useState(() => loadData('activities_data', []));\n    const [newActivity, setNewActivity] = useState('');\n    const [category, setCategory] = useState('IXL'); // IXL, Sports, Music, etc.\n\n    const [syllabusData, setSyllabusData] = useState(() => loadData('syllabus_data', []));`,
        to: `const ActivitiesTracker = () => {\n    const { currentStudent } = useStudent();\n    const [activities, setActivities] = useState([]);\n    const [newActivity, setNewActivity] = useState('');\n    const [category, setCategory] = useState('IXL');\n\n    const [syllabusData, setSyllabusData] = useState([]);\n    const [loading, setLoading] = useState(true);`
    },
    {
        from: `    useEffect(() => {\n        const handleStorage = () => {\n            setActivities(loadData('activities_data', []));\n            setSyllabusData(loadData('syllabus_data', []));\n        };\n        window.addEventListener('storage', handleStorage);\n        return () => window.removeEventListener('storage', handleStorage);\n    }, []);`,
        to: `    useEffect(() => {\n        if (currentStudent?.id) {\n            Promise.all([\n                api.getActivities(currentStudent.id),\n                api.getSyllabus(currentStudent.id)\n            ]).then(([acts, syll]) => {\n                setActivities(acts);\n                setSyllabusData(syll);\n                setLoading(false);\n            });\n        }\n    }, [currentStudent?.id]);`
    },
    { from: /saveData\('activities_data',\s*/g, to: 'api.saveActivities(currentStudent?.id, ' },
    { from: /return \(\n        <div className="space-y-8">/g, to: `if (loading) return <div className="text-center py-12 text-gray-500">Loading activities...</div>;\n\n    return (\n        <div className="space-y-8">` }
]);

console.log("Fixed files!");
