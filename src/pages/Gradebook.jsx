import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, Calendar, Trash2, CheckCircle, AlertCircle, Save, X, BookOpen } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';

const Gradebook = () => {
    const [tests, setTests] = useState(() => loadData('tests_data', []));
    const [subjects, setSubjects] = useState(() => loadData('syllabus_data', []));
    const [editingTestId, setEditingTestId] = useState(null);
    const [editScore, setEditScore] = useState('');

    useEffect(() => {
        const handleStorage = () => {
            setTests(loadData('tests_data', []));
            setSubjects(loadData('syllabus_data', []));
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const updateTestScore = (id, score) => {
        const updatedTests = tests.map(t => t.id === id ? { ...t, score } : t);
        setTests(updatedTests);
        saveData('tests_data', updatedTests);
        setEditingTestId(null);
    };

    const deleteTest = (id) => {
        if (window.confirm('Are you sure you want to delete this test record?')) {
            const updatedTests = tests.filter(t => t.id !== id);
            setTests(updatedTests);
            saveData('tests_data', updatedTests);
        }
    };

    // Calculate grades per subject
    const subjectGrades = subjects.map(subject => {
        const subjectTests = tests.filter(t => t.subject === subject.name && t.score !== undefined && t.score !== '');
        if (subjectTests.length === 0) return { ...subject, avg: 'N/A', count: 0 };

        const total = subjectTests.reduce((sum, t) => sum + Number(t.score), 0);
        const avg = Math.round(total / subjectTests.length);

        let letter = 'F';
        if (avg >= 90) letter = 'A';
        else if (avg >= 80) letter = 'B';
        else if (avg >= 70) letter = 'C';
        else if (avg >= 60) letter = 'D';

        return { ...subject, avg, letter, count: subjectTests.length };
    });

    // Overall Average
    const gradedTests = tests.filter(t => t.score !== undefined && t.score !== '');
    const overallAvg = gradedTests.length > 0
        ? Math.round(gradedTests.reduce((sum, t) => sum + Number(t.score), 0) / gradedTests.length)
        : 0;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Gradebook</h1>
                    <p className="text-gray-400">Track your academic performance and test scores.</p>
                </div>
                <div className="bg-surface/50 backdrop-blur-xl px-6 py-3 rounded-2xl border border-white/5 flex items-center gap-4">
                    <TrendingUp size={24} className="text-primary" />
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Overall Average</p>
                        <p className="text-2xl font-bold text-primary">{overallAvg}%</p>
                    </div>
                </div>
            </div>

            {/* Subject Averages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectGrades.map((subject) => (
                    <motion.div
                        key={subject.id}
                        whileHover={{ y: -5 }}
                        className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                <BookOpen size={20} />
                            </div>
                            <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
                                ${subject.avg === 'N/A' ? 'bg-gray-500/10 text-gray-500' : 'bg-green-500/10 text-green-500'}`}>
                                {subject.letter || '-'} Grade
                            </div>
                        </div>
                        <h3 className="text-lg font-bold mb-1">{subject.name}</h3>
                        <p className="text-3xl font-bold mb-2">
                            {subject.avg}{subject.avg !== 'N/A' ? '%' : ''}
                        </p>
                        <p className="text-xs text-gray-500">{subject.count} tests recorded</p>

                        {/* Progress bar */}
                        <div className="mt-4 w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${subject.avg === 'N/A' ? 0 : subject.avg}%` }}
                                className="bg-primary h-full"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* All Tests List */}
            <div className="bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <Calendar size={22} className="text-accent" /> Test Records
                </h2>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10">
                                <th className="pb-4 font-bold text-gray-400 text-sm uppercase tracking-wider">Date</th>
                                <th className="pb-4 font-bold text-gray-400 text-sm uppercase tracking-wider">Subject</th>
                                <th className="pb-4 font-bold text-gray-400 text-sm uppercase tracking-wider">Test Name</th>
                                <th className="pb-4 font-bold text-gray-400 text-sm uppercase tracking-wider text-center">Score</th>
                                <th className="pb-4 font-bold text-gray-400 text-sm uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {tests.sort((a, b) => new Date(b.date) - new Date(a.date)).map((test) => (
                                <tr key={test.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="py-4 text-sm">
                                        {new Date(test.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="py-4">
                                        <span className="bg-white/5 px-2 py-1 rounded text-xs font-medium">{test.subject}</span>
                                    </td>
                                    <td className="py-4 font-medium">{test.name}</td>
                                    <td className="py-4">
                                        <div className="flex justify-center items-center">
                                            {editingTestId === test.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        value={editScore}
                                                        onChange={(e) => setEditScore(e.target.value)}
                                                        className="w-16 bg-black/40 border border-primary/50 rounded px-2 py-1 text-sm text-center focus:outline-none"
                                                        autoFocus
                                                    />
                                                    <button onClick={() => updateTestScore(test.id, editScore)} className="text-green-500 hover:bg-green-500/10 p-1 rounded">
                                                        <Save size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingTestId(null)} className="text-red-500 hover:bg-red-500/10 p-1 rounded">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-lg font-bold ${test.score ? 'text-primary' : 'text-gray-500 italic'}`}>
                                                        {test.score ? `${test.score}%` : 'Not graded'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => { setEditingTestId(test.id); setEditScore(test.score || ''); }}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            >
                                                <Calculator size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteTest(test.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {tests.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="py-20 text-center text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <AlertCircle size={40} className="mb-4 opacity-20" />
                                            <p>No tests recorded yet.</p>
                                            <p className="text-xs">Schedule tests in the Daily Tracker to see them here.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Gradebook;
