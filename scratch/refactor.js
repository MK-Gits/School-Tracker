const fs = require('fs');
const file = 'src/pages/SyllabusTracker.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  `import { loadData, saveData } from '../utils/storage';`,
  `import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';`
);

// 2. Add context and loading state
content = content.replace(
  `const SyllabusTracker = () => {\n    const [subjects, setSubjects] = useState(() => loadData('syllabus_data', []));`,
  `const SyllabusTracker = () => {\n    const { currentStudent } = useStudent();\n    const [subjects, setSubjects] = useState([]);\n    const [loading, setLoading] = useState(true);`
);

// 3. Replace loadData effect with API effect
content = content.replace(
  `    useEffect(() => {\n        const handleStorage = () => {\n            setSubjects(loadData('syllabus_data', []));\n        };\n        window.addEventListener('storage', handleStorage);\n        return () => window.removeEventListener('storage', handleStorage);\n    }, []);`,
  `    useEffect(() => {\n        if (currentStudent?.id) {\n            api.getSyllabus(currentStudent.id).then(data => {\n                setSubjects(data);\n                setLoading(false);\n            });\n        }\n    }, [currentStudent?.id]);`
);

// 4. Replace saveData calls for syllabus
content = content.replace(/saveData\('syllabus_data',\s*/g, 'api.saveSyllabus(currentStudent?.id, ');

// 5. Replace saveData calls for activities
content = content.replace(/saveData\('activities_data',\s*/g, 'api.saveActivities(currentStudent?.id, ');

// 6. Handle loadData for activities inside loadCurriculum
content = content.replace(
  /let activities = loadData\('activities_data', \[\]\);/g,
  `let activities = await api.getActivities(currentStudent?.id);`
);

content = content.replace(
  /const loadCurriculum = \(\) => {/g,
  `const loadCurriculum = async () => {`
);

// 7. Remove any remaining loadData references, wait, we have one inside addTopic
content = content.replace(
  /const activities = loadData\('activities_data', \[\]\);/g,
  `// Note: Synchronous addTopic doesn't await activities, but we can just fire a generic one or ignore it for now.\n            const activities = await api.getActivities(currentStudent?.id);`
);

content = content.replace(
  /const addTopic = useCallback\(\(subjectId\) => {/g,
  `const addTopic = useCallback(async (subjectId) => {`
);


// 8. Handle loading state return
content = content.replace(
  /return \(\n        <div className="space-y-8">/g,
  `if (loading) return <div className="text-center py-12 text-gray-500">Loading syllabus...</div>;\n\n    return (\n        <div className="space-y-8">`
);

fs.writeFileSync(file, content);
console.log('Refactored SyllabusTracker.jsx');
