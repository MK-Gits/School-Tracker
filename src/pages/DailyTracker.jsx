import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Circle, Plus, Calendar as CalendarIcon, Clock, ArrowRight, ChevronLeft, ChevronRight, Book, Trophy, TrendingUp, AlertCircle } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';
import { Link } from 'react-router-dom';

const DailyTracker = () => {
    const [syllabusData, setSyllabusData] = useState(() => loadData('syllabus_data', []));
    const [activitiesData, setActivitiesData] = useState(() => loadData('activities_data', []));
    const [allDailyTasks, setAllDailyTasks] = useState(() => {
        const stored = loadData('daily_tasks_data', {});
        // Migration: If stored tasks is an array (old structure), move it to today
        if (Array.isArray(stored)) {
            const today = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
            return { [today]: stored };
        }
        return stored;
    });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newTask, setNewTask] = useState('');
    const [viewDate, setViewDate] = useState(new Date()); // For calendar navigation
    const [newTest, setNewTest] = useState({ subject: '', name: '', date: '' });

    const formatDateKey = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const dateKey = formatDateKey(selectedDate);

    useEffect(() => {
        // We sync from storage if and only if it changes externally
        const handleStorage = () => {
            setSyllabusData(loadData('syllabus_data', []));
            setActivitiesData(loadData('activities_data', []));
            const stored = loadData('daily_tasks_data', {});
            setAllDailyTasks(Array.isArray(stored) ? { [formatDateKey(new Date())]: stored } : stored);
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    // No longer using useEffect for saving to avoid race conditions on mount/unmount
    // Each action now saves directly

    const dailyTasks = allDailyTasks[dateKey] || [];

    // Filter auto-logged items for the selected date
    const completedTopics = syllabusData.flatMap(s =>
        s.topics.filter(t => t.completedAt && formatDateKey(t.completedAt) === dateKey)
            .map(t => ({ ...t, subjectName: s.name, type: 'syllabus' }))
    );

    const activityUpdates = activitiesData.flatMap(a => {
        const historyEntry = (a.history || []).find(h => h.date === dateKey);
        if (historyEntry) {
            return [{ ...a, ...historyEntry, type: 'activity' }];
        }
        return [];
    });

    const toggleHomework = (subjectId, topicId, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        const updatedSyllabus = syllabusData.map(s => {
            if (s.id === subjectId) {
                return {
                    ...s,
                    topics: s.topics.map(t => t.id === topicId ? {
                        ...t,
                        status: newStatus,
                        completedAt: newStatus === 'completed' ? new Date().toISOString() : null
                    } : t)
                };
            }
            return s;
        });
        setSyllabusData(updatedSyllabus);
        saveData('syllabus_data', updatedSyllabus);
    };

    const addDailyTask = () => {
        if (!newTask.trim()) return;
        const updatedTasks = {
            ...allDailyTasks,
            [dateKey]: [...dailyTasks, { id: Date.now(), text: newTask, completed: false }]
        };
        setAllDailyTasks(updatedTasks);
        saveData('daily_tasks_data', updatedTasks);
        setNewTask('');
    };

    const toggleDailyTask = (id) => {
        const updatedTasks = {
            ...allDailyTasks,
            [dateKey]: dailyTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
        };
        setAllDailyTasks(updatedTasks);
        saveData('daily_tasks_data', updatedTasks);
    };

    const deleteDailyTask = (id) => {
        const updatedTasks = {
            ...allDailyTasks,
            [dateKey]: dailyTasks.filter(t => t.id !== id)
        };
        setAllDailyTasks(updatedTasks);
        saveData('daily_tasks_data', updatedTasks);
    };

    const addTest = (e) => {
        e.preventDefault();
        if (!newTest.subject || !newTest.name || !newTest.date) return;

        const storedTests = loadData('tests_data', []);
        const updatedTests = [...storedTests, { id: Date.now(), ...newTest }];
        saveData('tests_data', updatedTests);
        setNewTest({ subject: '', name: '', date: '' });
        alert('Test scheduled successfully! Check it on your Dashboard.');
    };

    const pendingHomework = syllabusData.flatMap(subject =>
        subject.topics
            .filter(topic => topic.status !== 'completed' && topic.homework)
            .map(topic => ({ ...topic, subjectName: subject.name, subjectId: subject.id }))
    );

    const completedCount = dailyTasks.filter(t => t.completed).length + completedTopics.length + activityUpdates.length;
    const totalCount = dailyTasks.length + completedTopics.length + activityUpdates.length;
    const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    // Calendar logic
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    const { days, firstDay } = getDaysInMonth(viewDate);
    const monthYear = viewDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    const changeMonth = (offset) => {
        setViewDate(new Date(viewDate.setMonth(viewDate.getMonth() + offset)));
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Daily Tracker</h1>
                    <p className="text-gray-400">Manage your day and stay on top of everything.</p>
                </div>
                <div className="bg-surface/50 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/5 flex items-center gap-3">
                    <CalendarIcon size={18} className="text-primary" />
                    <span className="font-medium">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Calendar & Progress */}
                <div className="space-y-6">
                    {/* Progress Card */}
                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold mb-1">Day Activity</h2>
                            <p className="text-sm text-gray-400">{completedCount} tasks/updates tracked</p>
                        </div>
                        <div className="text-3xl font-bold text-primary">{progress}%</div>
                    </div>

                    {/* Premium Calendar */}
                    <div className="bg-surface/50 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-lg">{monthYear}</h3>
                            <div className="flex gap-2">
                                <button onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={() => changeMonth(1)} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors border border-white/5">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1 text-center mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <span key={d} className="text-[10px] font-bold text-gray-500 uppercase">{d}</span>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
                            {[...Array(days)].map((_, i) => {
                                const day = i + 1;
                                const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === viewDate.getMonth() && selectedDate.getFullYear() === viewDate.getFullYear();
                                const isToday = new Date().getDate() === day && new Date().getMonth() === viewDate.getMonth() && new Date().getFullYear() === viewDate.getFullYear();

                                // Check if there are tasks for this day
                                const dateStr = formatDateKey(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                                const hasTasks = (allDailyTasks[dateStr] && allDailyTasks[dateStr].length > 0) ||
                                    syllabusData.some(s => s.topics.some(t => t.completedAt && formatDateKey(t.completedAt) === dateStr)) ||
                                    activitiesData.some(a => (a.history || []).some(h => h.date === dateStr));

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), day))}
                                        className={`
                                            relative h-10 w-full flex items-center justify-center rounded-xl text-sm font-medium transition-all
                                            ${isSelected ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105 z-10' :
                                                isToday ? 'bg-primary/10 text-primary border border-primary/20' :
                                                    'hover:bg-white/5 text-gray-400 hover:text-white'}
                                        `}
                                    >
                                        {day}
                                        {hasTasks && !isSelected && (
                                            <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Add Test Section */}
                    <div className="bg-surface/50 backdrop-blur-xl p-5 rounded-2xl border border-white/5 shadow-2xl space-y-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <AlertCircle size={20} className="text-purple-500" /> Schedule Test
                        </h3>
                        <form onSubmit={addTest} className="space-y-3">
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">Subject</label>
                                <select
                                    value={newTest.subject}
                                    onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-white"
                                    required
                                >
                                    <option value="" className="bg-[#1a1c20]">Select Subject</option>
                                    {syllabusData.map(s => (
                                        <option key={s.id} value={s.name} className="bg-[#1a1c20]">{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">Test Name</label>
                                <input
                                    type="text"
                                    value={newTest.name}
                                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                                    placeholder="e.g. Unit Test 1"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] text-gray-500 mb-1 uppercase font-bold tracking-wider">Date</label>
                                <input
                                    type="date"
                                    value={newTest.date}
                                    onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-xl font-bold transition-all active:scale-95 text-xs"
                            >
                                Schedule Test
                            </button>
                        </form>
                    </div>
                </div>

                {/* Middle Column: Daily Goals & Auto-logged items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 min-h-[500px] flex flex-col">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <CalendarIcon size={20} className="text-accent" /> Activity Log
                            </h2>
                            <span className="text-sm text-gray-500 font-medium">{dateKey === formatDateKey(new Date()) ? 'Today' : selectedDate.toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Add a temporary goal or note for this day..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-white"
                                onKeyDown={(e) => e.key === 'Enter' && addDailyTask()}
                            />
                            <button
                                onClick={addDailyTask}
                                className="bg-primary hover:bg-primary/80 text-white px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center"
                            >
                                <Plus size={24} />
                            </button>
                        </div>

                        <div className="space-y-4 overflow-y-auto pr-2">
                            <AnimatePresence mode="popLayout">
                                {/* Manual Daily Goals */}
                                {dailyTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        layout
                                        className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl group hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/5"
                                    >
                                        <button
                                            onClick={() => toggleDailyTask(task.id)}
                                            className={`flex-shrink-0 transition-all duration-300 ${task.completed ? 'text-green-500 scale-110' : 'text-gray-500 hover:text-white'}`}
                                        >
                                            {task.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
                                        </button>
                                        <span className={`flex-1 text-[15px] font-medium transition-all ${task.completed ? 'text-gray-500 line-through decoration-2' : 'text-gray-100'}`}>
                                            {task.text}
                                        </span>
                                        <button
                                            onClick={() => deleteDailyTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <Plus size={20} className="rotate-45" />
                                        </button>
                                    </motion.div>
                                ))}

                                {/* Completed Syllabus Topics */}
                                {completedTopics.map((topic) => (
                                    <motion.div
                                        key={topic.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-4 p-4 bg-primary/10 rounded-2xl border border-primary/20"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                            <Book size={18} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-primary font-bold uppercase tracking-wider">{topic.subjectName}</p>
                                            <p className="text-[15px] font-bold text-gray-100">Completed: {topic.name}</p>
                                        </div>
                                        <div className="flex items-center gap-1 text-green-500">
                                            <CheckCircle size={20} />
                                        </div>
                                    </motion.div>
                                ))}

                                {/* Activity Updates */}
                                {activityUpdates.map((update) => (
                                    <motion.div
                                        key={update.id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex items-center gap-4 p-4 bg-secondary/10 rounded-2xl border border-secondary/20"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                            ${update.category === 'IXL' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}
                                        >
                                            {update.category === 'IXL' ? <Trophy size={18} /> :
                                                update.category === 'Sports' ? <Clock size={18} /> : <TrendingUp size={18} />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{update.category}</p>
                                            <p className="text-[15px] font-bold text-gray-100">{update.name}</p>
                                            <div className="mt-1 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-primary h-full transition-all duration-1000"
                                                    style={{ width: `${update.to}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-primary">{update.to}%</p>
                                            <p className="text-[10px] text-gray-500">+{update.to - update.from}%</p>
                                        </div>
                                    </motion.div>
                                ))}

                                {dailyTasks.length === 0 && completedTopics.length === 0 && activityUpdates.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-20 flex flex-col items-center"
                                    >
                                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
                                            <CalendarIcon size={32} />
                                        </div>
                                        <p className="text-gray-500 font-medium">Nothing tracked for this date.</p>
                                        <p className="text-sm text-gray-600 mt-1">Activities and syllabus updates will appear here automatically.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Pending Homework Column (Moved to bottom or kept side if needed) */}
                <div className="lg:col-span-3">
                    <div className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Clock size={20} className="text-orange-500" /> Pending Homework
                            </h2>
                            <Link to="/syllabus" className="text-sm text-primary hover:underline font-medium">
                                Refresh from Syllabus
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {pendingHomework.length > 0 ? (
                                pendingHomework.map((item) => (
                                    <div key={item.id} className="p-4 bg-white/5 rounded-2xl border-l-4 border-orange-500/50 hover:bg-white/[0.08] transition-colors group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{item.subjectName}</span>
                                            <button
                                                onClick={() => toggleHomework(item.subjectId, item.id, item.status)}
                                                className="text-gray-500 hover:text-green-500 transition-colors"
                                            >
                                                <Circle size={18} />
                                            </button>
                                        </div>
                                        <p className="font-bold text-gray-100 mb-1 group-hover:text-primary transition-colors">{item.name}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">{item.homework}</p>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                    <p className="text-gray-500 font-medium">No pending homework! Enjoy your time. ✨</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DailyTracker;
