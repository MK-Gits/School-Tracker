import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Calculator, Atom, Beaker, FileText, BookOpen, Edit2, Save, X } from 'lucide-react';
import { loadData, saveData } from '../utils/storage';

const StudyNotes = () => {
    const [notes, setNotes] = useState(() => loadData('study_notes_data', []));
    const [newNote, setNewNote] = useState({ title: '', content: '', category: 'Math' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    // Editing State
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editNoteData, setEditNoteData] = useState({ title: '', content: '', category: 'Math' });

    const startEditing = (note) => {
        setEditingNoteId(note.id);
        setEditNoteData({ title: note.title, content: note.content, category: note.category });
    };

    const saveEdit = () => {
        if (!editNoteData.title.trim() || !editNoteData.content.trim()) return;
        setNotes(notes.map(n => n.id === editingNoteId ? { ...n, ...editNoteData } : n));
        setEditingNoteId(null);
    };

    useEffect(() => {
        saveData('study_notes_data', notes);
    }, [notes]);

    const addNote = () => {
        if (!newNote.title.trim() || !newNote.content.trim()) return;
        setNotes([...notes, { ...newNote, id: Date.now() }]);
        setNewNote({ title: '', content: '', category: 'Math' });
        setIsAdding(false);
    };

    const deleteNote = (id) => {
        setNotes(notes.filter(n => n.id !== id));
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getIcon = (category) => {
        switch (category) {
            case 'Math': return <Calculator size={20} />;
            case 'Physics': return <Atom size={20} />;
            case 'Chemistry': return <Beaker size={20} />;
            default: return <BookOpen size={20} />;
        }
    };

    const getColor = (category) => {
        switch (category) {
            case 'Math': return 'text-blue-500 bg-blue-500/20';
            case 'Physics': return 'text-purple-500 bg-purple-500/20';
            case 'Chemistry': return 'text-green-500 bg-green-500/20';
            default: return 'text-orange-500 bg-orange-500/20';
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Study Notes</h1>
                    <p className="text-gray-400">Your personal knowledge base for formulas, definitions, and notes.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-primary hover:bg-primary/80 text-white px-6 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 w-fit"
                >
                    <Plus size={20} /> {isAdding ? 'Cancel' : 'Add Note'}
                </button>
            </div>

            {/* Add Note Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-surface/30 backdrop-blur-md p-6 rounded-2xl border border-white/5 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                    placeholder="Title (e.g., Newton's Laws)"
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary"
                                />
                                <select
                                    value={newNote.category}
                                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-primary text-white"
                                >
                                    <option value="Math" className="bg-[#1a1c20]">Math</option>
                                    <option value="Physics" className="bg-[#1a1c20]">Physics</option>
                                    <option value="Chemistry" className="bg-[#1a1c20]">Chemistry</option>
                                    <option value="Biology" className="bg-[#1a1c20]">Biology</option>
                                    <option value="History" className="bg-[#1a1c20]">History</option>
                                    <option value="Other" className="bg-[#1a1c20]">Other</option>
                                </select>
                            </div>
                            <textarea
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                placeholder="Type your notes here..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 focus:outline-none focus:border-primary h-32 font-mono"
                            />
                            <button
                                onClick={addNote}
                                className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-xl font-medium transition-colors w-full md:w-auto"
                            >
                                Save Note
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full bg-surface/50 backdrop-blur-xl border border-white/5 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                <AnimatePresence>
                    {filteredNotes.map((note) => (
                        <motion.div
                            key={note.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-surface/50 backdrop-blur-xl p-6 rounded-2xl border border-white/5 relative group hover:border-primary/50 transition-colors"
                        >
                            {editingNoteId === note.id ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={editNoteData.title}
                                        onChange={(e) => setEditNoteData({ ...editNoteData, title: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-primary"
                                        placeholder="Title"
                                    />
                                    <select
                                        value={editNoteData.category}
                                        onChange={(e) => setEditNoteData({ ...editNoteData, category: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary text-white"
                                    >
                                        <option value="Math" className="bg-[#1a1c20]">Math</option>
                                        <option value="Physics" className="bg-[#1a1c20]">Physics</option>
                                        <option value="Chemistry" className="bg-[#1a1c20]">Chemistry</option>
                                        <option value="Biology" className="bg-[#1a1c20]">Biology</option>
                                        <option value="History" className="bg-[#1a1c20]">History</option>
                                        <option value="Other" className="bg-[#1a1c20]">Other</option>
                                    </select>
                                    <textarea
                                        value={editNoteData.content}
                                        onChange={(e) => setEditNoteData({ ...editNoteData, content: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg p-3 font-mono text-sm focus:outline-none focus:border-primary h-32"
                                        placeholder="Content"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={saveEdit} className="p-2 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded-lg transition-colors">
                                            <Save size={20} />
                                        </button>
                                        <button onClick={() => setEditingNoteId(null)} className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${getColor(note.category)}`}>
                                            {getIcon(note.category)}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(note)}
                                                className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => deleteNote(note.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold mb-2">{note.title}</h3>
                                    <div className="bg-black/20 rounded-xl p-4 font-mono text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                                        {note.content}
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <span className="text-xs text-gray-500 px-2 py-1 rounded-full bg-white/5">
                                            {note.category}
                                        </span>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StudyNotes;
