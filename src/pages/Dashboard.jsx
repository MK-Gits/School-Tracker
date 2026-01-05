import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, TrendingUp, AlertCircle, BookOpen } from 'lucide-react';
import { loadData } from '../utils/storage';

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
        totalTopics: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [pendingAssignments, setPendingAssignments] = useState([]);

    useEffect(() => {
        const subjects = loadData('syllabus_data', []);

        let pendingCount = 0;
        let completedCount = 0;
        let totalCount = 0;
        let allCompleted = [];
        let allPending = [];

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
                    if (topic.homework) {
                        pendingCount++;
                        allPending.push({
                            ...topic,
                            subjectName: subject.name
                        });
                    }
                }
            });
        });

        // Sort recent activity by date desc
        allCompleted.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

        setStats({
            pending: pendingCount,
            completed: completedCount,
            totalTopics: totalCount
        });
        setRecentActivity(allCompleted.slice(0, 5));
        setPendingAssignments(allPending.slice(0, 5));
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Welcome Back! 👋</h1>
                <p className="text-gray-400">Here's what's happening in your education journey today.</p>
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
                    value="A-"
                    subtitle="Top 10% of class"
                    icon={TrendingUp}
                    color="text-blue-500 bg-blue-500"
                />
                <StatCard
                    title="Next Test"
                    value="2 Days"
                    subtitle="Physics - Chapter 4"
                    icon={AlertCircle}
                    color="text-purple-500 bg-purple-500"
                />
            </div>

            {/* Recent Activity & Upcoming */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                    <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
                    <div className="space-y-4">
                        {recentActivity.length > 0 ? (
                            recentActivity.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                                        <CheckCircle size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-gray-400">
                                            Completed in {item.subjectName} • {new Date(item.completedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No completed tasks yet. Go finish some!</p>
                        )}
                    </div>
                </div>

                <div className="bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                    <h2 className="text-xl font-bold mb-6">Pending Assignments</h2>
                    <div className="space-y-4">
                        {pendingAssignments.length > 0 ? (
                            pendingAssignments.map((item, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-xl transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                                        <BookOpen size={18} />
                                    </div>
                                    <div>
                                        <p className="font-medium">{item.homework}</p>
                                        <p className="text-xs text-gray-400">{item.name} • {item.subjectName}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No pending homework. Great job!</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
