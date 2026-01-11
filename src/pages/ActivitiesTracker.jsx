import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Trophy, Star, Activity as ActivityIcon, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';

const ActivitiesTracker = () => {
    const [activities, setActivities] = useState([]);
    const [newActivity, setNewActivity] = useState('');
    const [category, setCategory] = useState('IXL'); // IXL, Sports, Music, etc.

    const [syllabusData, setSyllabusData] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        setActivities(loadData('activities_data', []));
        setSyllabusData(loadData('syllabus_data', []));
    }, []);

    useEffect(() => {
        // Combine recent activity (Syllabus completions + Activity updates)
        const syllabusActivity = syllabusData.flatMap(subject =>
            subject.topics
                .filter(topic => topic.status === 'completed' && topic.completedAt)
                .map(topic => ({
                    id: topic.id,
                    name: topic.name,
                    detail: subject.name,
                    date: topic.completedAt,
                    type: 'syllabus'
                }))
        );

        const progressActivity = activities.flatMap(activity =>
            (activity.history || []).map(h => ({
                id: `${activity.id}-${h.timestamp || h.date}`,
                name: activity.name,
                detail: `${h.from}% → ${h.to}%`,
                date: h.timestamp || h.date,
                type: 'activity'
            }))
        );

        const combined = [...syllabusActivity, ...progressActivity]
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        setRecentActivity(combined);
    }, [activities, syllabusData]);

    useEffect(() => {
        saveData('activities_data', activities);
    }, [activities]);

    const addActivity = () => {
        if (!newActivity.trim()) return;
        setActivities([...activities, {
            id: Date.now(),
            name: newActivity,
            category,
            progress: 0,
            notes: ''
        }]);
        setNewActivity('');
    };

    const deleteActivity = (id) => {
        setActivities(activities.filter(a => a.id !== id));
    };

    const updateProgress = (id, progress) => {
        const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
        setActivities(activities.map(a => {
            if (a.id === id) {
                const newProgress = Math.min(100, Math.max(0, progress));
                const history = a.history || [];

                // Only add history if progress actually changed
                if (newProgress !== a.progress) {
                    // Update or add history entry for today
                    const existingEntryIndex = history.findIndex(h => h.date === today);
                    let newHistory;
                    if (existingEntryIndex >= 0) {
                        newHistory = history.map((h, i) => i === existingEntryIndex ? { ...h, to: newProgress, timestamp: new Date().toISOString() } : h);
                    } else {
                        newHistory = [...history, { date: today, from: a.progress, to: newProgress, timestamp: new Date().toISOString() }];
                    }
                    return { ...a, progress: newProgress, history: newHistory };
                }
            }
            return a;
        }));
    };

    const updateNotes = (id, notes) => {
        setActivities(activities.map(a => a.id === id ? { ...a, notes } : a));
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Activities & Extracurriculars</h1>
                <p className="text-gray-400">Track your progress in IXL, sports, and other skills.</p>
            </div>

            {/* Add Activity */}
            <div className="bg-surface/30 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4">
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary text-white"
                >
                    <option value="IXL" className="bg-[#1a1c20] text-white">IXL</option>
                    <option value="Sports" className="bg-[#1a1c20] text-white">Sports</option>
                    <option value="Music" className="bg-[#1a1c20] text-white">Music</option>
                    <option value="Coding" className="bg-[#1a1c20] text-white">Coding</option>
                    <option value="Other" className="bg-[#1a1c20] text-white">Other</option>
                </select>
                <input
                    type="text"
                    value={newActivity}
                    onChange={(e) => setNewActivity(e.target.value)}
                    placeholder="Activity name (e.g., Algebra 1 - Section B)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                    onKeyDown={(e) => e.key === 'Enter' && addActivity()}
                />
                <button
                    onClick={addActivity}
                    className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 justify-center"
                >
                    <Plus size={20} /> Add Activity
                </button>
            </div>

            {/* Activities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                    {activities.map((activity) => (
                        <motion.div
                            key={activity.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 relative group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                    ${activity.category === 'IXL' ? 'bg-green-500/20 text-green-500' :
                                            activity.category === 'Sports' ? 'bg-orange-500/20 text-orange-500' :
                                                activity.category === 'Music' ? 'bg-purple-500/20 text-purple-500' :
                                                    'bg-blue-500/20 text-blue-500'
                                        }`}
                                    >
                                        {activity.category === 'IXL' ? <Trophy size={20} /> :
                                            activity.category === 'Sports' ? <ActivityIcon size={20} /> :
                                                <Star size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold">{activity.name}</h3>
                                        <p className="text-xs text-gray-400">{activity.category}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteActivity(activity.id)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-400">Progress</span>
                                        <span className="font-medium">{activity.progress}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={activity.progress}
                                        onChange={(e) => updateProgress(activity.id, parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>

                                <textarea
                                    value={activity.notes}
                                    onChange={(e) => updateNotes(activity.id, e.target.value)}
                                    placeholder="Add notes or details..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:border-primary resize-none h-20"
                                />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Comprehensive Recent Activity */}
            <div className="bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <TrendingUp size={22} className="text-primary" /> Comprehensive Activity Log
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((item) => (
                            <div key={item.id} className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-transparent hover:border-white/5 hover:bg-white/[0.08] transition-all group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110
                                    ${item.type === 'syllabus' ? 'bg-green-500/10 text-green-500' : 'bg-primary/10 text-primary'}
                                `}>
                                    {item.type === 'syllabus' ? <CheckCircle size={20} /> : <TrendingUp size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-100">{item.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                                    <p className="text-[10px] text-gray-500 mt-2 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Clock size={10} /> {new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                <ActivityIcon size={32} />
                            </div>
                            <p className="text-gray-500 font-bold mb-1">No activity logged yet</p>
                            <p className="text-sm text-gray-600">Start completing topics or updating activity progress to see your history!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivitiesTracker;
