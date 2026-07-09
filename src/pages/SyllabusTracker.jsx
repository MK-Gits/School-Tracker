import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, Book, CheckCircle, Circle, Trophy, Download, Edit2, X, Save, GripVertical } from 'lucide-react';
import { api } from '../utils/api';
import { useStudent } from '../context/StudentContext';
import { georgia8thGradeData } from '../data/georgia8thGrade';
import { forsyth3rdGradeData } from '../data/forsyth3rdGrade';
import { sawnee3rdGradeData } from '../data/sawnee3rdGrade';
import { westForsyth9thGradeData } from '../data/westForsyth9thGrade';
import { summerPythonCourseData } from '../data/summerPythonCourse';

const SyllabusTracker = () => {
    const { currentStudent } = useStudent();
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSubject, setNewSubject] = useState('');
    const [expandedSubject, setExpandedSubject] = useState(null);
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);

    // Editing State
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [editSubjectName, setEditSubjectName] = useState('');

    const [editingTopicId, setEditingTopicId] = useState(null);
    const [editTopicName, setEditTopicName] = useState('');
    const [editTopicIXL, setEditTopicIXL] = useState('');

    // Topic input state
    const [newTopicName, setNewTopicName] = useState('');
    const [newTopicIXL, setNewTopicIXL] = useState('');

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [showCompletedMap, setShowCompletedMap] = useState({});

    useEffect(() => {
        if (currentStudent?.id) {
            api.getSyllabus(currentStudent.id).then(data => {
                setSubjects(data);
                setLoading(false);
            });
        }
    }, [currentStudent?.id]);

    const addSubject = useCallback(() => {
        if (!newSubject.trim()) return;
        const updatedSubjects = [...subjects, {
            id: Date.now(),
            name: newSubject,
            topics: []
        }];
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
        setNewSubject('');
    }, [subjects, newSubject, currentStudent?.id]);

    const deleteSubject = (id) => {
        const updatedSubjects = subjects.filter(s => s.id !== id);
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
    };

    const addTopic = useCallback(async (subjectId) => {
        if (!newTopicName.trim()) return;

        const topicId = Date.now();
        const ixlCode = newTopicIXL.trim();

        // Add topic to syllabus
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: [...s.topics, {
                        id: topicId,
                        name: newTopicName,
                        ixl: ixlCode,
                        status: 'pending',
                        homework: '',
                        tasks: []
                    }]
                };
            }
            return s;
        });
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);

        // If IXL code is present, auto-create activity
        if (ixlCode) {
            // Note: Synchronous addTopic doesn't await activities, but we can just fire a generic one or ignore it for now.
            const activities = await api.getActivities(currentStudent?.id);
            const newActivity = {
                id: Date.now() + 1, // Ensure unique ID
                name: `${newTopicName} (IXL ${ixlCode})`,
                category: 'IXL',
                progress: 0,
                notes: `Auto-generated from Syllabus: ${ixlCode}`
            };
            api.saveActivities(currentStudent?.id, [...activities, newActivity]);
        }

        setNewTopicName('');
        setNewTopicIXL('');
    }, [subjects, newTopicName, newTopicIXL, currentStudent?.id]);

    const updateTopicStatus = (subjectId, topicId, status) => {
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => t.id === topicId ? {
                        ...t,
                        status,
                        completedAt: status === 'completed' ? new Date().toISOString() : null
                    } : t)
                };
            }
            return s;
        });
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
    };

    const deleteTopic = (subjectId, topicId) => {
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.filter(t => t.id !== topicId)
                };
            }
            return s;
        });
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
    };


    // Topic Task Handlers (Internal for organization)
    const addTopicTask = (subjectId, topicId, text) => {
        if (!text.trim()) return;
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => {
                        if (t.id === topicId) {
                            const newTasks = [...(t.tasks || []), { id: Date.now(), text, completed: false }];
                            return { ...t, tasks: newTasks };
                        }
                        return t;
                    })
                };
            }
            return s;
        });
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
    };

    const toggleTopicTask = (subjectId, topicId, taskId) => {
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => {
                        if (t.id === topicId) {
                            const newTasks = (t.tasks || []).map(task =>
                                task.id === taskId ? { ...task, completed: !task.completed } : task
                            );
                            return { ...t, tasks: newTasks };
                        }
                        return t;
                    })
                };
            }
            return s;
        });
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
    };

    const deleteTopicTask = (subjectId, topicId, taskId) => {
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => {
                        if (t.id === topicId) {
                            return {
                                ...t,
                                tasks: (t.tasks || []).filter(task => task.id !== taskId)
                            };
                        }
                        return t;
                    })
                };
            }
            return s;
        });
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
    };

    // Edit Handlers
    const startEditingSubject = (subject) => {
        setEditingSubjectId(subject.id);
        setEditSubjectName(subject.name);
    };

    const saveSubject = (id) => {
        if (!editSubjectName.trim()) return;
        const updatedSubjects = subjects.map(s => s.id === id ? { ...s, name: editSubjectName } : s);
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
        setEditingSubjectId(null);
    };

    const startEditingTopic = (topic) => {
        setEditingTopicId(topic.id);
        setEditTopicName(topic.name);
        setEditTopicIXL(topic.ixl || '');
    };

    const saveTopic = (subjectId, topicId) => {
        if (!editTopicName.trim()) return;
        const updatedSubjects = subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => t.id === topicId ? { ...t, name: editTopicName, ixl: editTopicIXL } : t)
                };
            }
            return s;
        });
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
        setEditingTopicId(null);
    };
    const renderTopic = (subject, topic) => {
        if (editingTopicId === topic.id) {
            return (
                <div className="flex items-center gap-2 flex-1 w-full" onClick={e => e.stopPropagation()}>
                    <input
                        type="text"
                        value={editTopicName}
                        onChange={(e) => setEditTopicName(e.target.value)}
                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primary"
                        placeholder="Topic Name"
                    />
                    <input
                        type="text"
                        value={editTopicIXL}
                        onChange={(e) => setEditTopicIXL(e.target.value)}
                        className="w-24 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-primary"
                        placeholder="IXL Code"
                    />
                    <button onClick={() => saveTopic(subject.id, topic.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                        <Save size={18} />
                    </button>
                    <button onClick={() => setEditingTopicId(null)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                        <X size={18} />
                    </button>
                </div>
            );
        }

        return (
            <>
                <div className="flex items-center gap-4 flex-1">
                    <div className={`p-1 text-gray-500 transition-colors ${searchTerm || topic.status === 'completed' ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:text-white'}`}>
                        <GripVertical size={18} />
                    </div>
                    <button
                        onClick={() => updateTopicStatus(subject.id, topic.id, topic.status === 'completed' ? 'pending' : 'completed')}
                        className={`flex-shrink-0 transition-colors ${topic.status === 'completed' ? 'text-green-500' : 'text-gray-500 hover:text-white'}`}
                    >
                        {topic.status === 'completed' ? <CheckCircle size={24} /> : <Circle size={24} />}
                    </button>
                    <div>
                        <span className={`font-medium block ${topic.status === 'completed' ? 'text-gray-500 line-through' : ''}`}>
                            {topic.name}
                        </span>
                        {topic.ixl && (
                            <span className="text-xs text-accent flex items-center gap-1 mt-1">
                                <Trophy size={12} /> IXL: {topic.ixl}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-1 space-y-2">
                    {/* Existing Homework (Migration Support) */}
                    {topic.homework && (
                        <div className="text-sm text-gray-400 italic mb-2">
                            Legacy Note: {topic.homework}
                        </div>
                    )}

                    {/* Internal Topic Tasks */}
                    <div className="space-y-1">
                        {topic.tasks && topic.tasks.map((task) => (
                            <div key={task.id} className="flex items-center gap-2 group/item">
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTopicTask(subject.id, topic.id, task.id)}
                                    className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary h-3 w-3 cursor-pointer"
                                />
                                <span className={`text-xs ${task.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                    {task.text}
                                </span>
                                <button
                                    onClick={() => deleteTopicTask(subject.id, topic.id, task.id)}
                                    className="opacity-0 group-hover/item:opacity-100 p-0.5 text-red-500 hover:bg-red-500/10 rounded transition-all"
                                >
                                    <X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Task Input */}
                    <div className="flex items-center gap-2 mt-2">
                        <Plus size={12} className="text-gray-500" />
                        <input
                            type="text"
                            placeholder="Add task (e.g., Read p.10)"
                            className="flex-1 bg-transparent border-b border-white/10 focus:border-primary px-2 py-0.5 text-xs focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    addTopicTask(subject.id, topic.id, e.target.value);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button
                        onClick={() => startEditingTopic(topic)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => deleteTopic(subject.id, topic.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </>
        );
    };

    const reorderTopics = (subjectId, newTopics) => {
        // Find existing non-reordered topics (like completed ones) to maintain consistency if needed
        // But Reorder.Group usually handles the whole list.
        const updatedSubjects = subjects.map(s => s.id === subjectId ? { ...s, topics: newTopics } : s);
        setSubjects(updatedSubjects);
        api.saveSyllabus(currentStudent?.id, updatedSubjects);
    };

    const toggleShowCompleted = (subjectId) => {
        setShowCompletedMap(prev => ({
            ...prev,
            [subjectId]: !prev[subjectId]
        }));
    };

        const loadCurriculum = async (gradeData) => {
        const newSubjects = [...subjects];
        let activities = await api.getActivities(currentStudent?.id);

        gradeData.forEach(gradeSubject => {
            // Check if subject already exists
            let subject = newSubjects.find(s => s.name === gradeSubject.name);

            if (!subject) {
                subject = {
                    id: Date.now() + Math.random(),
                    name: gradeSubject.name,
                    topics: []
                };
                newSubjects.push(subject);
            }

            gradeSubject.topics.forEach(gradeTopic => {
                // Check if topic already exists
                if (!subject.topics.find(t => t.name === gradeTopic.name)) {
                    const topicId = Date.now() + Math.random();
                    // For Mathematics, preserve tasks defined in the template
                    const tasks = (gradeSubject.name === "Mathematics" && gradeTopic.tasks) ? gradeTopic.tasks.map(t => ({
                        id: Date.now() + Math.random(),
                        text: t.name,
                        completed: false
                    })) : [];
                    subject.topics.push({
                        id: topicId,
                        name: gradeTopic.name,
                        ixl: gradeTopic.ixl || '',
                        status: 'pending',
                        homework: '',
                        tasks // attach tasks array (empty for non‑Math subjects)
                    });

                    // Auto-create activity if IXL exists
                    if (gradeTopic.ixl) {
                        activities.push({
                            id: Date.now() + Math.random(),
                            name: `${gradeTopic.name} (IXL ${gradeTopic.ixl})`,
                            category: 'IXL',
                            progress: 0,
                            notes: `Auto-generated from Curriculum Template`
                        });
                    }
                }
            });
        });

        setSubjects(newSubjects);
        api.saveSyllabus(currentStudent?.id, newSubjects);
        api.saveActivities(currentStudent?.id, activities);
        setShowTemplateMenu(false);
    };

    if (loading) return <div className="text-center py-12 text-gray-500">Loading syllabus...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Syllabus & Homework</h1>
                    <p className="text-gray-400">Track your course progress and assignments.</p>
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowTemplateMenu(!showTemplateMenu)}
                        className="bg-secondary hover:bg-secondary/80 text-white px-4 py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-secondary/20 flex items-center gap-2"
                    >
                        <Download size={20} /> Load Template
                    </button>
                    
                    <AnimatePresence>
                        {showTemplateMenu && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-2 w-72 bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
                            >
                                <div className="p-3 border-b border-white/5 bg-white/5">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Select Curriculum or Course</span>
                                </div>
                                <div className="p-2 space-y-1">
                                    <button 
                                        onClick={() => loadCurriculum(forsyth3rdGradeData)}
                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors group flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-white group-hover:text-primary">3rd Grade</div>
                                            <div className="text-[10px] text-gray-500">Forsyth County / Georgia GSE</div>
                                        </div>
                                        <ChevronDown size={16} className="-rotate-90 opacity-40" />
                                    </button>
                                    <button 
                                         onClick={() => loadCurriculum(sawnee3rdGradeData)}
                                         className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors group flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-white group-hover:text-primary">Sawnee 3rd Grade</div>
                                            <div className="text-[10px] text-gray-500">Sawnee Elementary / Forsyth County</div>
                                        </div>
                                        <ChevronDown size={16} className="-rotate-90 opacity-40" />
                                    </button>
                                    <button 
                                        onClick={() => loadCurriculum(georgia8thGradeData)}
                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors group flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-white group-hover:text-primary">8th Grade</div>
                                            <div className="text-[10px] text-gray-500">Georgia Standards of Excellence</div>
                                        </div>
                                        <ChevronDown size={16} className="-rotate-90 opacity-40" />
                                    </button>
                                    <button 
                                        onClick={() => loadCurriculum(summerPythonCourseData)}
                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors group flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-white group-hover:text-primary">Summer Python Course</div>
                                            <div className="text-[10px] text-gray-500">Complete Python Mastery</div>
                                        </div>
                                        <ChevronDown size={16} className="-rotate-90 opacity-40" />
                                    </button>
                                    <button 
                                        onClick={() => loadCurriculum(westForsyth9thGradeData)}
                                        className="w-full text-left px-4 py-3 hover:bg-primary/10 rounded-xl transition-colors group flex items-center justify-between"
                                    >
                                        <div>
                                            <div className="font-bold text-white group-hover:text-primary">9th Grade</div>
                                            <div className="text-[10px] text-gray-500">West Forsyth High School</div>
                                        </div>
                                        <ChevronDown size={16} className="-rotate-90 opacity-40" />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Add Subject */}
            <div className="bg-surface/30 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex gap-4">
                <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="Enter new subject name (e.g., Mathematics)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary transition-colors"
                    onKeyDown={(e) => e.key === 'Enter' && addSubject()}
                />
                <button
                    onClick={addSubject}
                    className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                    <Plus size={20} /> Add Subject
                </button>
            </div>

            {/* Subjects List */}
            <div className="grid grid-cols-1 gap-6">
                <Reorder.Group axis="y" values={subjects} onReorder={setSubjects} className="space-y-6">
                    <AnimatePresence>
                        {subjects.map((subject) => (
                            <Reorder.Item
                                key={subject.id}
                                value={subject}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-surface/50 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden"
                            >
                                <div
                                    className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => {
                                        if (!editingSubjectId) {
                                            setExpandedSubject(expandedSubject === subject.id ? null : subject.id);
                                            setSearchTerm(''); // Clear search when toggling
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1 text-gray-500 cursor-grab active:cursor-grabbing hover:text-white transition-colors">
                                                <GripVertical size={20} />
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary flex-shrink-0">
                                                <Book size={24} />
                                            </div>
                                        </div>

                                        {editingSubjectId === subject.id ? (
                                            <div className="flex items-center gap-2 flex-1 mr-4" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editSubjectName}
                                                    onChange={(e) => setEditSubjectName(e.target.value)}
                                                    className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-1 text-lg font-bold focus:outline-none focus:border-primary"
                                                    autoFocus
                                                />
                                                <button onClick={() => saveSubject(subject.id)} className="p-1 text-green-500 hover:bg-green-500/10 rounded">
                                                    <Save size={20} />
                                                </button>
                                                <button onClick={() => setEditingSubjectId(null)} className="p-1 text-red-500 hover:bg-red-500/10 rounded">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div>
                                                <h3 className="text-xl font-bold">{subject.name}</h3>
                                                <p className="text-sm text-gray-400">
                                                    {subject.topics.filter(t => t.status === 'completed').length} / {subject.topics.length} topics completed
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!editingSubjectId && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditingSubject(subject); }}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteSubject(subject.id); }}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                {expandedSubject === subject.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                            </>
                                        )}
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {expandedSubject === subject.id && (
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: 'auto' }}
                                            exit={{ height: 0 }}
                                            className="overflow-hidden border-t border-white/5 bg-black/20"
                                        >
                                            <div className="p-6 space-y-4">
                                                {/* Add Topic Form & Search */}
                                                <div className="flex flex-col gap-4 mb-6">
                                                    {/* Search Bar */}
                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={searchTerm}
                                                            onChange={(e) => setSearchTerm(e.target.value)}
                                                            placeholder="Search topics..."
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 pl-10 text-sm focus:outline-none focus:border-primary transition-colors"
                                                        />
                                                        <div className="absolute left-3 top-2.5 text-gray-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                                        </div>
                                                    </div>

                                                    {/* Add Topic Inputs */}
                                                    <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-xl">
                                                        <input
                                                            type="text"
                                                            value={newTopicName}
                                                            onChange={(e) => setNewTopicName(e.target.value)}
                                                            placeholder="Topic Name (e.g., Quadratic Equations)"
                                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={newTopicIXL}
                                                            onChange={(e) => setNewTopicIXL(e.target.value)}
                                                            placeholder="IXL Code (e.g., BB.5)"
                                                            className="w-full md:w-48 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary"
                                                            onKeyDown={(e) => e.key === 'Enter' && addTopic(subject.id)}
                                                        />
                                                        <button
                                                            onClick={() => addTopic(subject.id)}
                                                            className="bg-primary/20 text-primary hover:bg-primary/30 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                                        >
                                                            Add Topic
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Topics List - Split into Open and Completed */}
                                                {(() => {
                                                    const filtered = subject.topics.filter(topic => 
                                                        topic.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                        (topic.ixl && topic.ixl.toLowerCase().includes(searchTerm.toLowerCase()))
                                                    );
                                                    const openTopics = filtered.filter(t => t.status !== 'completed');
                                                    const completedTopics = filtered.filter(t => t.status === 'completed');
                                                    const isShowingCompleted = showCompletedMap[subject.id];

                                                    return (
                                                        <div className="space-y-6">
                                                            {/* Open Topics */}
                                                            <Reorder.Group
                                                                axis="y"
                                                                values={subject.topics}
                                                                onReorder={(newTopics) => reorderTopics(subject.id, newTopics)}
                                                                className="space-y-3"
                                                            >
                                                                {openTopics.map((topic) => (
                                                                    <Reorder.Item
                                                                        key={topic.id}
                                                                        value={topic}
                                                                        className="bg-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between group border border-transparent hover:border-white/10 transition-colors"
                                                                        dragListener={!searchTerm}
                                                                    >
                                                                        {renderTopic(subject, topic)}
                                                                    </Reorder.Item>
                                                                ))}
                                                            </Reorder.Group>

                                                            {/* Completed Topics Section */}
                                                            {completedTopics.length > 0 && (
                                                                <div className="pt-4 border-t border-white/5">
                                                                    <button
                                                                        onClick={() => toggleShowCompleted(subject.id)}
                                                                        className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-green-500 transition-colors group"
                                                                    >
                                                                        <CheckCircle size={14} className={isShowingCompleted ? "text-green-500" : ""} />
                                                                        {isShowingCompleted ? 'Hide' : 'Show'} Completed Topics ({completedTopics.length})
                                                                        <ChevronDown size={14} className={`transition-transform duration-300 ${isShowingCompleted ? 'rotate-180' : ''}`} />
                                                                    </button>

                                                                    <AnimatePresence>
                                                                        {isShowingCompleted && (
                                                                            <motion.div
                                                                                initial={{ opacity: 0, height: 0 }}
                                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                                exit={{ opacity: 0, height: 0 }}
                                                                                className="overflow-hidden"
                                                                            >
                                                                                <div className="space-y-3 mt-4">
                                                                                    {completedTopics.map((topic) => (
                                                                                        <div
                                                                                            key={topic.id}
                                                                                            className="bg-green-500/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between group border border-green-500/10 opacity-70 hover:opacity-100 transition-all"
                                                                                        >
                                                                                            {renderTopic(subject, topic)}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })()}
                                                {subject.topics.length === 0 && (
                                                    <p className="text-center text-gray-500 py-4">No topics added yet.</p>
                                                )}
                                                {subject.topics.length > 0 && subject.topics.filter(topic => topic.name.toLowerCase().includes(searchTerm.toLowerCase()) || (topic.ixl && topic.ixl.toLowerCase().includes(searchTerm.toLowerCase()))).length === 0 && (
                                                    <p className="text-center text-gray-500 py-4">No topics match your search.</p>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Reorder.Item>
                        ))}
                    </AnimatePresence>
                </Reorder.Group>

                {subjects.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Book size={48} className="mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No subjects added yet. Start by adding one above!</p>
                    </div>
                )}
            </div>
        </div >
    );
};

export default SyllabusTracker;
