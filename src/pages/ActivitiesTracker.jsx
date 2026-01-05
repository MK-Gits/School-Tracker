import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Trophy, Star, Activity as ActivityIcon } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';

const ActivitiesTracker = () => {
    const [activities, setActivities] = useState([]);
    const [newActivity, setNewActivity] = useState('');
    const [category, setCategory] = useState('IXL'); // IXL, Sports, Music, etc.

    useEffect(() => {
        setActivities(loadData('activities_data', []));
    }, []);

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
        setActivities(activities.map(a => a.id === id ? { ...a, progress: Math.min(100, Math.max(0, progress)) } : a));
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
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                >
                    <option value="IXL">IXL</option>
                    <option value="Sports">Sports</option>
                    <option value="Music">Music</option>
                    <option value="Coding">Coding</option>
                    <option value="Other">Other</option>
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
        </div>
    );
};

export default ActivitiesTracker;
