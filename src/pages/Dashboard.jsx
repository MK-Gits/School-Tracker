import React, { useState, useEffect, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Clock, TrendingUp, AlertCircle, BookOpen, Download, Upload, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '../utils/api';
import { useStudent } from '../context/StudentContext';
import { parseLocalDate, formatDateKey, startOfLocalDate } from '../utils/dateUtils';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, subtitle, icon, color }) => {
    const Icon = icon;
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={100} />
            </div>
            <div className="relative z-10">
                <div className={`p-3 rounded-xl w-fit mb-4 ${color} bg-opacity-20`}>
                    <Icon size={24} />
                </div>
                <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-3xl font-bold mb-2">{value}</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
        </motion.div>
    );
};

const Dashboard = () => {
    const { currentStudent } = useStudent();
    const [tests, setTests] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [dailyTasksData, setDailyTasksData] = useState({});
    const [activitiesData, setActivitiesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCompletedTestsOpen, setIsCompletedTestsOpen] = useState(false);

    // 1. Initial Data Load from Database
    useEffect(() => {
        if (!currentStudent?.id) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const [testsRes, syllabusRes, dailyRes, activitiesRes] = await Promise.all([
                    api.getGrades(currentStudent.id),
                    api.getSyllabus(currentStudent.id),
                    api.getDailyTasks(currentStudent.id),
                    api.getActivities(currentStudent.id)
                ]);
                
                setTests(testsRes || []);
                setSubjects(syllabusRes || []);
                setDailyTasksData(dailyRes || {});
                setActivitiesData(activitiesRes || []);
            } catch (err) {
                console.error("Failed to fetch dashboard data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentStudent?.id]);

    // 2. Derive Stats and Activity via useMemo for efficiency and to avoid loops
    const dashboardData = useMemo(() => {
        const todayKey = formatDateKey(new Date());
        const now = startOfLocalDate(new Date());

        let pendingCount = 0;
        let completedCount = 0;
        let totalCount = 0;
        let allPending = [];

        // Process Syllabus
        subjects.forEach(subject => {
            subject.topics.forEach(topic => {
                totalCount++;
                if (topic.status === 'completed') {
                    completedCount++;
                } else if (topic.homework) {
                    pendingCount++;
                    allPending.push({
                        id: topic.id,
                        name: topic.homework,
                        detail: `${topic.name} • ${subject.name}`,
                        type: 'topic'
                    });
                }
            });
        });

        // Process Daily Tasks
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

        // Process Tests via current state
        const upcoming = tests
            .filter(t => {
                const date = parseLocalDate(t.date);
                const hasScore = t.score !== undefined && t.score !== null && t.score !== '';
                return date >= now && !hasScore;
            })
            .sort((a, b) => parseLocalDate(a.date) - parseLocalDate(b.date))
            .map(t => ({
                ...t,
                formattedDate: parseLocalDate(t.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
            }));

        const completedArr = tests
            .filter(t => {
                const date = parseLocalDate(t.date);
                const hasScore = t.score !== undefined && t.score !== null && t.score !== '';
                return date < now || hasScore;
            })
            .sort((a, b) => parseLocalDate(b.date) - parseLocalDate(a.date))
            .map(t => ({
                ...t,
                formattedDate: parseLocalDate(t.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
            }));

        // Calculate Grades - Only count tests that HAVE a score
        const testsWithScores = tests.filter(t => t.score !== undefined && t.score !== null && t.score !== '');
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

        // Recent Activity
        const progressActivity = activitiesData.flatMap(activity =>
            (activity.history || []).map(h => ({
                id: `${activity.id}-${h.timestamp || h.date}`,
                name: activity.name,
                subjectName: `${h.from}% → ${h.to}%`,
                completedAt: h.timestamp || h.date,
                type: 'activity'
            }))
        );
        const combinedActivity = [...progressActivity].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        // Next Test
        let next = null;
        if (upcoming.length > 0) {
            const nearest = upcoming[0];
            const diffTime = Math.abs(parseLocalDate(nearest.date) - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            next = {
                ...nearest,
                daysRemaining: diffDays === 0 ? 'Today' : diffDays === 1 ? '1 Day' : `${diffDays} Days`
            };
        }

        return {
            stats: { pending: pendingCount, completed: completedCount, totalTopics: totalCount, avgGrade: avgLetter, avgPercent: avgPct },
            recentActivity: combinedActivity.slice(0, 3),
            pendingAssignments: allPending.slice(0, 5),
            upcomingTests: upcoming,
            completedTests: completedArr,
            nextTest: next
        };
    }, [tests, subjects, dailyTasksData, activitiesData]);

    const { stats, recentActivity, pendingAssignments, upcomingTests, completedTests, nextTest } = dashboardData;


    const updateTestScore = async (id, score) => {
        const updatedTests = tests.map(t => t.id === id ? { ...t, score } : t);
        setTests(updatedTests);
        await api.saveGrades(currentStudent?.id, updatedTests);
    };

    const deleteTest = async (id) => {
        const updatedTests = tests.filter(t => t.id !== id);
        setTests(updatedTests);
        await api.saveGrades(currentStudent?.id, updatedTests);
    };

    const exportData = async () => {
        const data = {
            syllabus: subjects,
            activities: activitiesData,
            notes: await api.getNotes(currentStudent?.id),
            daily: dailyTasksData,
            tests: tests
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
                if (data.syllabus) api.saveSyllabus(currentStudent?.id, data.syllabus);
                if (data.activities) api.saveActivities(currentStudent?.id, data.activities);
                if (data.notes) api.saveNotes(currentStudent?.id, data.notes);
                if (data.daily) api.saveDailyTasks(currentStudent?.id, data.daily);
                if (data.tests) api.saveGrades(currentStudent?.id, data.tests);

                alert('Data restored to database successfully! The page will now reload.');
                window.location.reload();
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Failed to import data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium italic">Loading your education dashboard...</p>
            </div>
        </div>
    );

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
                        <AlertCircle size={22} className="text-purple-500" /> Tests Overview
                    </h2>
                    <div className="space-y-8">
                        {/* Upcoming Tests */}
                        <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Clock size={16} /> Upcoming Tests
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {upcomingTests.map(test => {
                                    return (
                                        <div key={test.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 group relative hover:bg-white/[0.08] transition-all">
                                            <button
                                                onClick={() => deleteTest(test.id)}
                                                className="absolute top-3 right-3 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                                                        <AlertCircle size={24} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-bold text-lg text-gray-100 leading-tight">{test.name}</p>
                                                        <p className="text-sm text-gray-400 mt-0.5">{test.subject}</p>
                                                        <p className="text-xs text-primary mt-2 font-bold uppercase tracking-wider">
                                                            {test.formattedDate}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {upcomingTests.length === 0 && (
                                    <p className="text-sm text-gray-500 italic">No upcoming tests. Relax! ✨</p>
                                )}
                            </div>
                        </div>

                        {/* Completed & Past Tests */}
                        <div>
                            <button
                                onClick={() => setIsCompletedTestsOpen(!isCompletedTestsOpen)}
                                className="w-full flex items-center justify-between text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 hover:text-gray-300 transition-colors group"
                            >
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={16} /> Completed & Past Tests
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] lowercase font-normal opacity-0 group-hover:opacity-100 transition-opacity">
                                        {isCompletedTestsOpen ? 'click to collapse' : 'click to expand'}
                                    </span>
                                    {isCompletedTestsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                            </button>

                            <AnimatePresence>
                                {isCompletedTestsOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        className="overflow-hidden"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
                                            {completedTests.map(test => (
                                                <div key={test.id} className="p-5 bg-white/5 rounded-2xl border border-primary/20 group relative hover:bg-white/[0.08] transition-all">
                                                    <button
                                                        onClick={() => deleteTest(test.id)}
                                                        className="absolute top-3 right-3 p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    <div className="flex flex-col gap-4">
                                                        <div className="flex items-start gap-3">
                                                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                                <CheckCircle size={24} />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="font-bold text-lg text-gray-100 leading-tight">{test.name}</p>
                                                                <p className="text-sm text-gray-400 mt-0.5">{test.subject}</p>
                                                                <p className="text-xs text-primary mt-2 font-bold uppercase tracking-wider">
                                                                    {test.formattedDate}
                                                                </p>
                                                            </div>
                                                        </div>

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
                                                    </div>
                                                </div>
                                            ))}
                                            {completedTests.length === 0 && (
                                                <p className="text-sm text-gray-500 italic">No completed tests yet.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div >

                        {
                            tests.length === 0 && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-600">
                                        <AlertCircle size={32} />
                                    </div>
                                    <p className="text-gray-500 font-bold mb-1">No tests scheduled</p>
                                    <p className="text-sm text-gray-600 text-balance px-4">Head over to the Daily Tracker to add your first test schedule!</p>
                                </div>
                            )
                        }
                    </div >
                </div >

                {/* Pending Assignments (1/3 width) */}
                < div className="lg:col-span-1 bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col" >
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
                </div >
            </div >

            {/* Recent Activity Section (Full Width) */}
            < div className="bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5" >
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
            </div >
        </div >
    );
};

export default Dashboard;
