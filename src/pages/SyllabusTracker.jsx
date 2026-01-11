import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, Book, CheckCircle, Circle, Trophy, Download, Edit2, X, Save, GripVertical } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';
import { georgia8thGradeData } from '../data/georgia8thGrade';

const SyllabusTracker = () => {
    const [subjects, setSubjects] = useState(() => loadData('syllabus_data', []));
    const [newSubject, setNewSubject] = useState('');
    const [expandedSubject, setExpandedSubject] = useState(null);

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

    useEffect(() => {
        saveData('syllabus_data', subjects);
    }, [subjects]);

    const addSubject = () => {
        if (!newSubject.trim()) return;
        setSubjects([...subjects, {
            id: Date.now(),
            name: newSubject,
            topics: []
        }]);
        setNewSubject('');
    };

    const deleteSubject = (id) => {
        setSubjects(subjects.filter(s => s.id !== id));
    };

    const addTopic = (subjectId) => {
        if (!newTopicName.trim()) return;

        const topicId = Date.now();
        const ixlCode = newTopicIXL.trim();

        // Add topic to syllabus
        setSubjects(subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: [...s.topics, {
                        id: topicId,
                        name: newTopicName,
                        ixl: ixlCode,
                        status: 'pending',
                        homework: ''
                    }]
                };
            }
            return s;
        }));

        // If IXL code is present, auto-create activity
        if (ixlCode) {
            const activities = loadData('activities_data', []);
            const newActivity = {
                id: Date.now() + 1, // Ensure unique ID
                name: `${newTopicName} (IXL ${ixlCode})`,
                category: 'IXL',
                progress: 0,
                notes: `Auto-generated from Syllabus: ${ixlCode}`
            };
            saveData('activities_data', [...activities, newActivity]);
        }

        setNewTopicName('');
        setNewTopicIXL('');
    };

    const updateTopicStatus = (subjectId, topicId, status) => {
        setSubjects(subjects.map(s => {
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
        }));
    };

    const updateTopicHomework = (subjectId, topicId, homework) => {
        setSubjects(subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => t.id === topicId ? { ...t, homework } : t)
                };
            }
            return s;
        }));
    };

    const deleteTopic = (subjectId, topicId) => {
        setSubjects(subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.filter(t => t.id !== topicId)
                };
            }
            return s;
        }));
    };

    // Assignment Handlers
    const addAssignment = (subjectId, topicId, text) => {
        if (!text.trim()) return;
        setSubjects(subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => {
                        if (t.id === topicId) {
                            const newAssignments = [...(t.assignments || []), { id: Date.now(), text, completed: false }];
                            return { ...t, assignments: newAssignments };
                        }
                        return t;
                    })
                };
            }
            return s;
        }));
    };

    const toggleAssignment = (subjectId, topicId, assignmentId) => {
        setSubjects(subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => {
                        if (t.id === topicId) {
                            const newAssignments = (t.assignments || []).map(a =>
                                a.id === assignmentId ? { ...a, completed: !a.completed } : a
                            );

                            // Auto-complete topic if all assignments are done
                            const allCompleted = newAssignments.length > 0 && newAssignments.every(a => a.completed);

                            return {
                                ...t,
                                assignments: newAssignments,
                                status: allCompleted ? 'completed' : 'pending',
                                completedAt: allCompleted ? new Date().toISOString() : (t.status === 'completed' ? null : t.completedAt)
                            };
                        }
                        return t;
                    })
                };
            }
            return s;
        }));
    };

    const deleteAssignment = (subjectId, topicId, assignmentId) => {
        setSubjects(subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => {
                        if (t.id === topicId) {
                            return {
                                ...t,
                                assignments: (t.assignments || []).filter(a => a.id !== assignmentId)
                            };
                        }
                        return t;
                    })
                };
            }
            return s;
        }));
    };

    // Edit Handlers
    const startEditingSubject = (subject) => {
        setEditingSubjectId(subject.id);
        setEditSubjectName(subject.name);
    };

    const saveSubject = (id) => {
        if (!editSubjectName.trim()) return;
        setSubjects(subjects.map(s => s.id === id ? { ...s, name: editSubjectName } : s));
        setEditingSubjectId(null);
    };

    const startEditingTopic = (topic) => {
        setEditingTopicId(topic.id);
        setEditTopicName(topic.name);
        setEditTopicIXL(topic.ixl || '');
    };

    const saveTopic = (subjectId, topicId) => {
        if (!editTopicName.trim()) return;
        setSubjects(subjects.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => t.id === topicId ? {
                        ...t,
                        name: editTopicName,
                        ixl: editTopicIXL
                    } : t)
                };
            }
            return s;
        }));
        setEditingTopicId(null);
    };

    const reorderTopics = (subjectId, newTopics) => {
        setSubjects(subjects.map(s => s.id === subjectId ? { ...s, topics: newTopics } : s));
    };

    const loadCurriculum = () => {
        const newSubjects = [...subjects];
        let activities = loadData('activities_data', []);

        georgia8thGradeData.forEach(gradeSubject => {
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
                    subject.topics.push({
                        id: topicId,
                        name: gradeTopic.name,
                        ixl: gradeTopic.ixl || '',
                        status: 'pending',
                        homework: ''
                    });

                    // Auto-create activity if IXL exists
                    if (gradeTopic.ixl) {
                        activities.push({
                            id: Date.now() + Math.random(),
                            name: `${gradeTopic.name} (IXL ${gradeTopic.ixl})`,
                            category: 'IXL',
                            progress: 0,
                            notes: `Auto-generated from Georgia Curriculum`
                        });
                    }
                }
            });
        });

        setSubjects(newSubjects);
        saveData('activities_data', activities);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Syllabus & Homework</h1>
                    <p className="text-gray-400">Track your course progress and assignments.</p>
                </div>
                <button
                    onClick={loadCurriculum}
                    className="bg-secondary hover:bg-secondary/80 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
                >
                    <Download size={18} /> Load Georgia 8th Grade Curriculum
                </button>
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

                                                {/* Topics List */}
                                                <Reorder.Group
                                                    axis="y"
                                                    values={subject.topics}
                                                    onReorder={(newTopics) => reorderTopics(subject.id, newTopics)}
                                                    className="space-y-3"
                                                >
                                                    {subject.topics
                                                        .filter(topic => topic.name.toLowerCase().includes(searchTerm.toLowerCase()) || (topic.ixl && topic.ixl.toLowerCase().includes(searchTerm.toLowerCase())))
                                                        .map((topic) => (
                                                            <Reorder.Item
                                                                key={topic.id}
                                                                value={topic}
                                                                className="bg-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 md:items-center justify-between group"
                                                                dragListener={!searchTerm} // Disable drag when searching
                                                            >
                                                                {editingTopicId === topic.id ? (
                                                                    <div className="flex items-center gap-2 flex-1 w-full">
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
                                                                ) : (
                                                                    <>
                                                                        <div className="flex items-center gap-4 flex-1">
                                                                            <div className={`p-1 text-gray-500 transition-colors ${searchTerm ? 'opacity-20 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing hover:text-white'}`}>
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

                                                                            {/* Assignments List */}
                                                                            <div className="space-y-1">
                                                                                {topic.assignments && topic.assignments.map((assignment) => (
                                                                                    <div key={assignment.id} className="flex items-center gap-2 group/item">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={assignment.completed}
                                                                                            onChange={() => toggleAssignment(subject.id, topic.id, assignment.id)}
                                                                                            className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                                                                                        />
                                                                                        <span className={`text-sm ${assignment.completed ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                                                                            {assignment.text}
                                                                                        </span>
                                                                                        <button
                                                                                            onClick={() => deleteAssignment(subject.id, topic.id, assignment.id)}
                                                                                            className="opacity-0 group-hover/item:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                                                                                        >
                                                                                            <X size={12} />
                                                                                        </button>
                                                                                    </div>
                                                                                ))}
                                                                            </div>

                                                                            {/* Add Assignment Input */}
                                                                            <div className="flex items-center gap-2 mt-2">
                                                                                <Plus size={14} className="text-gray-500" />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Add task (e.g., Read p.10)"
                                                                                    className="flex-1 bg-transparent border-b border-white/10 focus:border-primary px-2 py-1 text-sm focus:outline-none"
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === 'Enter') {
                                                                                            addAssignment(subject.id, topic.id, e.target.value);
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
                                                                )}
                                                            </Reorder.Item>
                                                        ))}
                                                </Reorder.Group>
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
