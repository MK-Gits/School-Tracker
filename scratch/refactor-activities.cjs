const fs = require('fs');
const file = 'src/pages/ActivitiesTracker.jsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  `import { loadData, saveData } from '../utils/storage';`,
  `import { api } from '../utils/api';\nimport { useStudent } from '../context/StudentContext';`
);

// 2. Add context and loading state
content = content.replace(
  `const ActivitiesTracker = () => {\n    const [activities, setActivities] = useState(() => loadData('activities_data', []));\n    const [newActivity, setNewActivity] = useState('');\n    const [category, setCategory] = useState('IXL'); // IXL, Sports, Music, etc.\n\n    const [syllabusData, setSyllabusData] = useState(() => loadData('syllabus_data', []));`,
  `const ActivitiesTracker = () => {\n    const { currentStudent } = useStudent();\n    const [activities, setActivities] = useState([]);\n    const [newActivity, setNewActivity] = useState('');\n    const [category, setCategory] = useState('IXL');\n\n    const [syllabusData, setSyllabusData] = useState([]);\n    const [loading, setLoading] = useState(true);`
);

// 3. Replace loadData effect with API effect
content = content.replace(
  `    useEffect(() => {\n        const handleStorage = () => {\n            setActivities(loadData('activities_data', []));\n            setSyllabusData(loadData('syllabus_data', []));\n        };\n        window.addEventListener('storage', handleStorage);\n        return () => window.removeEventListener('storage', handleStorage);\n    }, []);`,
  `    useEffect(() => {\n        if (currentStudent?.id) {\n            Promise.all([\n                api.getActivities(currentStudent.id),\n                api.getSyllabus(currentStudent.id)\n            ]).then(([acts, syll]) => {\n                setActivities(acts);\n                setSyllabusData(syll);\n                setLoading(false);\n            });\n        }\n    }, [currentStudent?.id]);`
);

// 4. Replace saveData calls for activities
content = content.replace(/saveData\('activities_data',\s*/g, 'api.saveActivities(currentStudent?.id, ');

// 5. Handle loading return
content = content.replace(
  /return \(\n        <div className="space-y-8">/g,
  `if (loading) return <div className="text-center py-12 text-gray-500">Loading activities...</div>;\n\n    return (\n        <div className="space-y-8">`
);

fs.writeFileSync(file, content);
console.log('Refactored ActivitiesTracker.jsx');
