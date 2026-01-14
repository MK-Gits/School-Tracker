import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, TrendingUp, AlertCircle, BookOpen, Download, Upload, Trash2 } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
            <Icon size={100} />
        </div>
        <div className="relative z-10">
            <div className={`p-3 rounded-xl w-fit mb-4 ${color} bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold mb-2">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
    </motion.div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        pending: 0,
        completed: 0,
        totalTopics: 0,
        avgGrade: 'N/A',
        avgPercent: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [pendingAssignments, setPendingAssignments] = useState([]);
    const [tests, setTests] = useState([]);
    const [nextTest, setNextTest] = useState(null);

    useEffect(() => {
        const subjects = loadData('syllabus_data', []);
        const dailyTasksData = loadData('daily_tasks_data', {});
        const todayKey = new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0');

        let pendingCount = 0;
        let completedCount = 0;
        let totalCount = 0;
        let allCompleted = [];
        let allPending = [];

        // 1. Process Syllabus Data
        subjects.forEach(subject => {
            subject.topics.forEach(topic => {
                totalCount++;
                if (topic.status === 'completed') {
                    completedCount++;
                    if (topic.completedAt) {
                        allCompleted.push({
                            ...topic,
                            subjectName: subject.name
                        });
                    }
                } else {
                    // Only topics with homework notes are counted as pending tasks on the dashboard
                    if (topic.homework) {
                        pendingCount++;
                        allPending.push({
                            id: topic.id,
                            name: topic.homework,
                            detail: `${topic.name} • ${subject.name}`,
                            type: 'topic'
                        });
                    }
                }
            });
        });

        // 2. Process Today's Daily Tasks
        const todaysTasks = dailyTasksData[todayKey] || [];
        todaysTasks.forEach(task => {
            if (!task.completed) {
                pendingCount++;
                allPending.push({
                    id: task.id,
                    name: task.text,
                    detail: 'Daily Goal',
                    type: 'daily'
                });
            }
        });

        // 3. Process Tests
        const storedTests = loadData('tests_data', []);
        if (tests.length === 0 && storedTests.length > 0) {
            setTests(storedTests);
        }

        const testsToProcess = tests.length > 0 ? tests : storedTests;

        const upcoming = testsToProcess
            .filter(t => new Date(t.date) >= new Date().setHours(0, 0, 0, 0))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcoming.length > 0) {
            const nearest = upcoming[0];
            const diffTime = Math.abs(new Date(nearest.date) - new Date().setHours(0, 0, 0, 0));
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setNextTest({
                ...nearest,
                daysRemaining: diffDays === 0 ? 'Today' : diffDays === 1 ? '1 Day' : `${diffDays} Days`
            });
        } else {
            setNextTest(null);
        }

        // 4. Calculate Grade Averages
        const testsWithScores = testsToProcess.filter(t => t.score !== undefined && t.score !== '');
        let avgLetter = 'N/A';
        let avgPct = 0;

        if (testsWithScores.length > 0) {
            const totalScore = testsWithScores.reduce((sum, t) => sum + Number(t.score), 0);
            avgPct = Math.round(totalScore / testsWithScores.length);

            if (avgPct >= 90) avgLetter = 'A';
            else if (avgPct >= 80) avgLetter = 'B';
            else if (avgPct >= 70) avgLetter = 'C';
            else if (avgPct >= 60) avgLetter = 'D';
            else avgLetter = 'F';
        }

        // 5. Combine and Sort Recent Activity (Activity Updates only)
        const activitiesData = loadData('activities_data', []);
        const progressActivity = activitiesData.flatMap(activity =>
            (activity.history || []).map(h => ({
                id: `${activity.id}-${h.timestamp || h.date}`,
                name: activity.name,
                subjectName: `${h.from}% → ${h.to}%`, // Reuse subjectName field for consistency in UI
                completedAt: h.timestamp || h.date,
                type: 'activity'
            }))
        );

        const combinedActivity = [...progressActivity]
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        setStats({
            pending: pendingCount,
            completed: completedCount,
            totalTopics: totalCount,
            avgGrade: avgLetter,
            avgPercent: avgPct
        });
        setRecentActivity(combinedActivity.slice(0, 3));
        setPendingAssignments(allPending.slice(0, 5));
    }, [tests]);

    const updateTestScore = (id, score) => {
        const updatedTests = tests.map(t => t.id === id ? { ...t, score } : t);
        setTests(updatedTests);
        saveData('tests_data', updatedTests);
    };

    const deleteTest = (id) => {
        const updatedTests = tests.filter(t => t.id !== id);
        setTests(updatedTests);
        saveData('tests_data', updatedTests);
    };

    const exportData = () => {
        const data = {
            syllabus: loadData('syllabus_data', []),
            activities: loadData('activities_data', []),
            notes: loadData('study_notes_data', []),
            daily: loadData('daily_tasks_data', []),
            tests: loadData('tests_data', [])
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const importData = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.syllabus) saveData('syllabus_data', data.syllabus);
                if (data.activities) saveData('activities_data', data.activities);
                if (data.notes) saveData('study_notes_data', data.notes);
                if (data.daily) saveData('daily_tasks_data', data.daily);
                if (data.tests) saveData('tests_data', data.tests);

                alert('Data restored successfully! The page will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Failed to import data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
                    <p className="text-gray-400">Here's what's happening in your education journey today.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportData}
                        className="bg-surface/50 hover:bg-surface border border-white/10 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm"
                    >
                        <Download size={18} /> Export Data
                    </button>
                    <label className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 text-sm cursor-pointer">
                        <Upload size={18} /> Import Data
                        <input
                            type="file"
                            accept=".json"
                            onChange={importData}
                            className="hidden"
                        />
                    </label>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Pending Homework"
                    value={stats.pending}
                    subtitle="Assignments to do"
                    icon={Clock}
                    color="text-orange-500 bg-orange-500"
                />
                <StatCard
                    title="Completed Topics"
                    value={stats.completed}
                    subtitle={`${stats.totalTopics > 0 ? Math.round((stats.completed / stats.totalTopics) * 100) : 0}% of total syllabus`}
                    icon={CheckCircle}
                    color="text-green-500 bg-green-500"
                />
                <StatCard
                    title="Average Grade"
                    value={stats.avgGrade}
                    subtitle={stats.avgGrade !== 'N/A' ? `Average: ${stats.avgPercent}%` : 'No tests graded yet'}
                    icon={TrendingUp}
                    color="text-blue-500 bg-blue-500"
                />
                <StatCard
                    title="Next Test"
                    value={nextTest ? nextTest.daysRemaining : 'No Tests'}
                    subtitle={nextTest ? `${nextTest.subject} - ${nextTest.name}` : 'Enjoy your free time!'}
                    icon={AlertCircle}
                    color="text-purple-500 bg-purple-500"
                />
            </div>

            {/* Tests & Tasks Overview Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming & Recent Tests (2/3 width) */}
                <div className="lg:col-span-2 bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <AlertCircle size={22} className="text-purple-500" /> Upcoming & Recent Tests
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {tests.sort((a, b) => new Date(b.date) - new Date(a.date))
                            .map(test => {
                                const isPassed = new Date(test.date) < new Date().setHours(0, 0, 0, 0);
                                return (
                                    <div key={test.id} className={`p-5 bg-white/5 rounded-2xl border border-white/5 group relative ${isPassed ? 'border-primary/20' : ''} hover:bg-white/[0.08] transition-all`}>
                                        <button
                                            onClick={() => deleteTest(test.id)}
                                            className="absolute top-3 right-3 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-xl ${isPassed ? 'bg-primary/10 text-primary' : 'bg-purple-500/10 text-purple-500'}`}>
                                                    <AlertCircle size={24} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-lg text-gray-100 leading-tight">{test.name}</p>
                                                    <p className="text-sm text-gray-400 mt-0.5">{test.subject}</p>
                                                    <p className="text-xs text-primary mt-2 font-bold uppercase tracking-wider">
                                                        {new Date(test.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>

                                            {isPassed && (
                                                <div className="flex items-center gap-3 mt-2 pt-4 border-t border-white/10">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Score:</span>
                                                    <div className="flex items-center flex-1">
                                                        <input
                                                            type="number"
                                                            placeholder="0"
                                                            value={test.score || ''}
                                                            onChange={(e) => updateTestScore(test.id, e.target.value)}
                                                            className="w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm font-bold text-primary focus:outline-none focus:border-primary text-center"
                                                            min="0"
                                                            max="100"
                                                        />
                                                        <span className="ml-2 text-sm font-bold text-primary">%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        {tests.length === 0 && (
                            <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                    <AlertCircle size={32} />
                                </div>
                                <p className="text-gray-500 font-bold mb-1">No tests scheduled</p>
                                <p className="text-sm text-gray-600 text-balance px-4">Head over to the Daily Tracker to add your first test schedule!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pending Assignments (1/3 width) */}
                <div className="lg:col-span-1 bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <BookOpen size={20} className="text-accent" /> Pending Tasks
                        </h2>
                        <Link to="/daily" className="text-xs text-primary hover:underline font-bold">Manage in Tracker</Link>
                    </div>
                    <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                        {pendingAssignments.length > 0 ? (
                            pendingAssignments.map((item) => (
                                <div key={item.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/5 group">
                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent flex-shrink-0 group-hover:scale-110 transition-transform">
                                        <BookOpen size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-100">{item.name}</p>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.detail}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-20 text-center flex flex-col items-center">
                                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 text-gray-600">
                                    <CheckCircle size={24} />
                                </div>
                                <p className="text-gray-500 font-bold">All caught up!</p>
                                <p className="text-xs text-gray-600 mt-1">No pending homework. Enjoy your time! ✨</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity Section (Full Width) */}
            <div className="bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp size={20} className="text-primary" /> Recent Activity
                    </h2>
                    <Link to="/activities" className="text-sm text-primary hover:underline font-bold flex items-center gap-1">
                        See All <Clock size={14} />
                    </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentActivity.length > 0 ? (
                        recentActivity.map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/[0.08] transition-all border border-transparent hover:border-white/5 group">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:rotate-12 transition-transform
                                    ${item.type === 'activity' ? 'bg-primary/10 text-primary' : 'bg-green-500/10 text-green-500'}
                                `}>
                                    {item.type === 'activity' ? <TrendingUp size={18} /> : <CheckCircle size={18} />}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-100">{item.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {item.subjectName} • {new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-gray-600 border border-dashed border-white/5 rounded-3xl">
                            No recent activity found. Start completing topics to see your progress here!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
