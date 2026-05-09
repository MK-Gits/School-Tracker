import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Calculator, Atom, Beaker, FileText, BookOpen, Edit2, Save, X } from 'lucide-react';
import { api } from '../utils/api';
import { useStudent } from '../context/StudentContext';

const StudyNotes = () => {
    const { currentStudent } = useStudent();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: '', content: '', category: 'Math' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);

    // Editing State
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [editNoteData, setEditNoteData] = useState({ title: '', content: '', category: 'Math' });

    useEffect(() => {
        if (currentStudent?.id) {
            api.getNotes(currentStudent.id).then(data => {
                setNotes(data);
                setLoading(false);
            });
        }
    }, [currentStudent?.id]);

    const startEditing = (note) => {
        setEditingNoteId(note.id);
        setEditNoteData({ title: note.title, content: note.content, category: note.category });
    };

    const addNote = () => {
        if (!newNote.title.trim() || !newNote.content.trim()) return;
        const updatedNotes = [{ id: Date.now(), ...newNote }, ...notes];
        setNotes(updatedNotes);
        api.saveNotes(currentStudent?.id, updatedNotes);
        setNewNote({ title: '', content: '', category: 'Math' });
        setIsAdding(false);
    };

    const saveEdit = () => {
        const updatedNotes = notes.map(n => n.id === editingNoteId ? { ...n, ...editNoteData } : n);
        setNotes(updatedNotes);
        api.saveNotes(currentStudent?.id, updatedNotes);
        setEditingNoteId(null);
    };

    const deleteNote = (id) => {
        const updatedNotes = notes.filter(n => n.id !== id);
        setNotes(updatedNotes);
        api.saveNotes(currentStudent?.id, updatedNotes);
    };

    const filteredNotes = notes.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const categories = ['Math', 'Science', 'History', 'English', 'Other'];

    if (loading) return <div className="text-center py-12 text-gray-500">Loading notes...</div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Study Notes</h1>
                    <p className="text-gray-400">Keep track of important concepts and information.</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-primary/20"
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'Cancel' : 'New Note'}
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search through your notes..."
                    className="w-full bg-surface/50 backdrop-blur-xl border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-primary transition-colors text-white"
                />
            </div>

            {/* Add Note Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-surface/50 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-2xl"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={newNote.title}
                                    onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                    placeholder="Note Title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                                <select
                                    value={newNote.category}
                                    onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-white"
                                >
                                    {categories.map(c => <option key={c} value={c} className="bg-[#1a1c20]">{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-400 mb-1">Content</label>
                            <textarea
                                value={newNote.content}
                                onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                rows="4"
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors"
                                placeholder="Your study notes..."
                            />
                        </div>
                        <button
                            onClick={addNote}
                            className="w-full bg-primary hover:bg-primary/80 text-white py-3 rounded-xl font-bold transition-colors"
                        >
                            Save Note
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNotes.map((note) => (
                    <motion.div
                        key={note.id}
                        layout
                        className="bg-surface/50 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative group"
                    >
                        {editingNoteId === note.id ? (
                            <div className="space-y-4">
                                <input
                                    type="text"
                                    value={editNoteData.title}
                                    onChange={(e) => setEditNoteData({ ...editNoteData, title: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                />
                                <select
                                    value={editNoteData.category}
                                    onChange={(e) => setEditNoteData({ ...editNoteData, category: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary text-white"
                                >
                                    {categories.map(c => <option key={c} value={c} className="bg-[#1a1c20]">{c}</option>)}
                                </select>
                                <textarea
                                    value={editNoteData.content}
                                    onChange={(e) => setEditNoteData({ ...editNoteData, content: e.target.value })}
                                    rows="3"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                                />
                                <div className="flex gap-2">
                                    <button onClick={saveEdit} className="flex-1 bg-primary py-2 rounded-xl text-xs font-bold">Save</button>
                                    <button onClick={() => setEditingNoteId(null)} className="px-4 bg-white/5 py-2 rounded-xl text-xs font-bold">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl bg-primary/10 text-primary`}>
                                        {note.category === 'Math' ? <Calculator size={20} /> :
                                         note.category === 'Science' ? <Atom size={20} /> :
                                         note.category === 'Biology' ? <Beaker size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => startEditing(note)} className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-lg">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => deleteNote(note.id)} className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="inline-block px-3 py-1 rounded-full bg-white/5 text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
                                    {note.category}
                                </div>
                                <h3 className="text-xl font-bold mb-2 text-white">{note.title}</h3>
                                <p className="text-gray-400 text-sm line-clamp-4 leading-relaxed">{note.content}</p>
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {filteredNotes.length === 0 && (
                <div className="text-center py-20 bg-surface/30 rounded-3xl border border-dashed border-white/10">
                    <BookOpen size={48} className="mx-auto mb-4 text-gray-600 opacity-20" />
                    <p className="text-gray-500 font-medium">No notes found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default StudyNotes;
