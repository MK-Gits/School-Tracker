import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Activity, Calculator, Menu, X, Calendar, User, Plus, Trash2, Edit2, Database, Wifi, WifiOff, CloudOff, RefreshCw } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useStudent } from '../context/StudentContext';
const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);
    const [editingId, setEditingId] = React.useState(null);
    const [newName, setNewName] = React.useState('');
    const [newGrade, setNewGrade] = React.useState('');
    const { students, currentStudent, switchStudent, addStudent, updateStudent, deleteStudent, isOffline, hasPendingSync } = useStudent();
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/daily', label: 'Daily Tracker', icon: Calendar },
        { path: '/syllabus', label: 'Syllabus', icon: BookOpen },
        { path: '/gradebook', label: 'Gradebook', icon: Calculator },
        { path: '/activities', label: 'Activities', icon: Activity },
        { path: '/notes', label: 'Study Notes', icon: Calculator },
    ];

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="min-h-screen flex bg-background text-white overflow-hidden relative">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.aside
                className={`fixed md:relative z-50 w-64 h-screen bg-surface/50 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 ease-in-out overflow-y-auto
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
                initial={false}
            >
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        EduTracker
                    </h1>
                    <button onClick={toggleSidebar} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
                        <X size={24} />
                    </button>
                </div>

                {/* Profile Switcher */}
                <div className="px-4 mb-4">
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                                <User size={20} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-sm truncate">{currentStudent.name}</p>
                                <p className="text-xs text-gray-400">{currentStudent.grade} Grade</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <select
                                value={currentStudent.id}
                                onChange={(e) => switchStudent(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-primary"
                            >
                                {students.map(s => (
                                    <option key={s.id} value={s.id}>{s.name} ({s.grade})</option>
                                ))}
                            </select>
                            <button
                                onClick={() => setIsProfileModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                            >
                                <Plus size={12} /> Add Student
                            </button>
                        </div>
                    </div>
                </div>

                {/* Connectivity Status */}
                <div className="px-4 mb-2">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                        isOffline ? 'bg-red-500/10 text-red-400' : 
                        hasPendingSync ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'
                    }`}>
                        {isOffline ? <CloudOff size={14} /> : hasPendingSync ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                        <span>
                            {isOffline ? 'Offline Mode' : hasPendingSync ? 'Syncing to DB...' : 'DB Connected'}
                        </span>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden
                  ${isActive ? 'bg-primary/20 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-primary/20 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <Icon size={20} className={`relative z-10 ${isActive ? 'text-primary' : 'group-hover:text-white'}`} />
                                <span className="relative z-10 font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10 space-y-4">
                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-xl border border-white/5">
                        <p className="text-xs text-gray-400 mb-1">Current Term</p>
                        <p className="font-semibold">Spring 2026</p>
                    </div>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden p-4 flex items-center justify-between bg-surface/50 backdrop-blur-xl border-b border-white/10">
                    <button onClick={toggleSidebar} className="p-2 hover:bg-white/10 rounded-lg">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold">EduTracker</span>
                    <div className="w-10" /> {/* Spacer */}
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </div>

                {/* Add Student Modal */}
                <AnimatePresence>
                    {isProfileModalOpen && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsProfileModalOpen(false)}
                                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative bg-surface p-8 rounded-3xl border border-white/10 w-full max-w-md shadow-2xl"
                            >
                                <button
                                    onClick={() => setIsProfileModalOpen(false)}
                                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                                >
                                    <X size={24} />
                                </button>

                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                    <User className="text-primary" /> Add New Student
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Student Name</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="e.g. Mukundan"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Grade Level</label>
                                        <input
                                            type="text"
                                            value={newGrade}
                                            onChange={(e) => setNewGrade(e.target.value)}
                                            placeholder="e.g. 2nd"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={() => {
                                                if (newName && newGrade) {
                                                    addStudent(newName, newGrade);
                                                    setIsProfileModalOpen(false);
                                                }
                                            }}
                                            className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl font-bold transition-all transform active:scale-95 shadow-lg shadow-primary/20"
                                        >
                                            Create Profile
                                        </button>
                                    </div>

                                    {students.length > 0 && (
                                        <div className="mt-8 pt-6 border-t border-white/5">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Manage Profiles</p>
                                            <div className="space-y-3">
                                                {students.map(s => (
                                                    <div key={s.id} className="p-3 bg-white/5 rounded-xl border border-white/5 space-y-3">
                                                        {editingId === s.id ? (
                                                            <div className="space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={newName}
                                                                    onChange={(e) => setNewName(e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                                                                    placeholder="Name"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={newGrade}
                                                                    onChange={(e) => setNewGrade(e.target.value)}
                                                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-primary"
                                                                    placeholder="Grade"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        onClick={() => {
                                                                            updateStudent(s.id, { name: newName, grade: newGrade });
                                                                            setEditingId(null);
                                                                            setNewName('');
                                                                            setNewGrade('');
                                                                        }}
                                                                        className="flex-1 bg-green-500/20 text-green-500 py-1.5 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-colors"
                                                                    >
                                                                        Save Changes
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setEditingId(null)}
                                                                        className="px-3 bg-white/5 text-gray-400 py-1.5 rounded-lg text-xs font-bold hover:bg-white/10 transition-colors"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-between">
                                                                <div className="overflow-hidden">
                                                                    <p className="font-bold text-sm truncate">{s.name}</p>
                                                                    <p className="text-[10px] text-gray-400 lowercase">{s.grade} grade</p>
                                                                </div>
                                                                <div className="flex items-center gap-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingId(s.id);
                                                                            setNewName(s.name);
                                                                            setNewGrade(s.grade);
                                                                        }}
                                                                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                                    >
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                    {students.length > 1 && (
                                                                        <button
                                                                            onClick={() => deleteStudent(s.id)}
                                                                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </main>

        </div>
    );
};

export default Layout;
