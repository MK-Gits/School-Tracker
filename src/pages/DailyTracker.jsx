import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Plus, Calendar, Clock, ArrowRight } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';
import { Link } from 'react-router-dom';

const DailyTracker = () => {
    const [syllabusData, setSyllabusData] = useState([]);
    const [dailyTasks, setDailyTasks] = useState([]);
    const [newTask, setNewTask] = useState('');

    useEffect(() => {
        setSyllabusData(loadData('syllabus_data', []));
        setDailyTasks(loadData('daily_tasks_data', []));
    }, []);

    useEffect(() => {
        saveData('daily_tasks_data', dailyTasks);
    }, [dailyTasks]);

    // Helper to update syllabus data when a homework item is checked
    const toggleHomework = (subjectId, topicId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        const updatedSyllabus = syllabusData.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => t.id === topicId ? { ...t, status: newStatus } : t)
                };
            }
            return s;
        });
        setSyllabusData(updatedSyllabus);
        saveData('syllabus_data', updatedSyllabus);
    };

    const addDailyTask = () => {
        if (!newTask.trim()) return;
        setDailyTasks([...dailyTasks, { id: Date.now(), text: newTask, completed: false }]);
        setNewTask('');
    };

    const toggleDailyTask = (id) => {
        setDailyTasks(dailyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteDailyTask = (id) => {
        setDailyTasks(dailyTasks.filter(t => t.id !== id));
    };

    // Aggregate pending homework
    const pendingHomework = syllabusData.flatMap(subject =>
        subject.topics
            .filter(topic => topic.status !== 'completed' && topic.homework)
            .map(topic => ({ ...topic, subjectName: subject.name, subjectId: subject.id }))
    );

    const completedCount = dailyTasks.filter(t => t.completed).length;
    const totalCount = dailyTasks.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Daily Tracker</h1>
                <p className="text-gray-400">Manage your day and stay on top of everything.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Daily Goals */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Progress Card */}
                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold mb-1">Today's Progress</h2>
                            <p className="text-gray-400">{completedCount} of {totalCount} tasks completed</p>
                        </div>
                        <div className="text-4xl font-bold text-primary">{progress}%</div>
                    </div>

                    {/* Custom Tasks */}
                    <div className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Calendar size={20} className="text-accent" /> Daily Goals
                        </h2>

                        <div className="flex gap-4 mb-6">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Add a new goal for today..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                onKeyDown={(e) => e.key === 'Enter' && addDailyTask()}
                            />
                            <button
                                onClick={addDailyTask}
                                className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl font-medium transition-colors"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence>
                                {dailyTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="flex items-center gap-4 p-3 bg-white/5 rounded-xl group"
                                    >
                                        <button
                                            onClick={() => toggleDailyTask(task.id)}
                                            className={`flex-shrink-0 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                                        </button>
                                        <span className={`flex-1 ${task.completed ? 'text-gray-500 line-through' : ''}`}>
                                            {task.text}
                                        </span>
                                        <button
                                            onClick={() => deleteDailyTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                        >
                                            <Plus size={20} className="rotate-45" />
                                        </button>
                                    </motion.div>
                                ))}
                                {dailyTasks.length === 0 && (
                                    <p className="text-center text-gray-500 py-4">No goals set for today.</p>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Right Column: Pending Homework & Quick Links */}
                <div className="space-y-6">
                    <div className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Clock size={20} className="text-orange-500" /> Pending Homework
                        </h2>
                        <div className="space-y-3">
                            {pendingHomework.length > 0 ? (
                                pendingHomework.map((item) => (
                                    <div key={item.id} className="p-3 bg-white/5 rounded-xl border-l-2 border-orange-500">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-xs text-orange-400 font-medium">{item.subjectName}</span>
                                            <button
                                                onClick={() => toggleHomework(item.subjectId, item.id, item.status)}
                                                className="text-gray-500 hover:text-green-500 transition-colors"
                                            >
                                                <Circle size={16} />
                                            </button>
                                        </div>
                                        <p className="text-sm font-medium mb-1">{item.name}</p>
                                        <p className="text-xs text-gray-400">{item.homework}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No pending homework! Great job.</p>
                            )}
                        </div>
                        <Link to="/syllabus" className="block mt-4 text-center text-sm text-primary hover:underline">
                            View Syllabus Tracker
                        </Link>
                    </div>

                    <div className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
                        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                        <div className="space-y-2">
                            <Link to="/activities" className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <span>Update Activities</span>
                                <ArrowRight size={16} />
                            </Link>
                            <Link to="/notes" className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                                <span>Add Study Note</span>
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyTracker;
