import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Activity, Calculator, Menu, X, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const location = useLocation();

    const navItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/daily', label: 'Daily Tracker', icon: Calendar },
        { path: '/syllabus', label: 'Syllabus', icon: BookOpen },
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
                className={`fixed md:relative z-50 w-64 h-screen bg-surface/50 backdrop-blur-xl border-r border-white/10 flex flex-col
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
                initial={false}
                animate={{ x: isSidebarOpen ? 0 : 0 }} // Simplified for now, responsive handling is tricky with pure framer-motion without media query hook, relying on CSS classes
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="p-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        EduTracker
                    </h1>
                    <button onClick={toggleSidebar} className="md:hidden p-1 hover:bg-white/10 rounded-lg">
                        <X size={24} />
                    </button>
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

                <div className="p-4 border-t border-white/10">
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
            </main>
        </div>
    );
};

export default Layout;
