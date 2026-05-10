import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Trash2, Calculator, Atom, Beaker, FileText, BookOpen, Edit2, Save, X } from 'lucide-react';
import { api } from '../utils/api';
import { useStudent } from '../context/StudentContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Copy, Check } from 'lucide-react';

const StudyNotes = () => {
    const { currentStudent } = useStudent();
    const [notes, setNotes] = useState([]);
    const [newNote, setNewNote] = useState({ title: '', content: '', category: 'Math' });
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [selectedNote, setSelectedNote] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

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

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const getCategoryStyles = (cat) => {
        switch (cat) {
            case 'Math': return 'from-blue-500/20 to-cyan-500/20 text-blue-400 border-blue-500/30';
            case 'Science': return 'from-green-500/20 to-emerald-500/20 text-green-400 border-green-500/30';
            case 'History': return 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30';
            case 'English': return 'from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30';
            default: return 'from-gray-500/20 to-slate-500/20 text-gray-400 border-white/10';
        }
    };

    const processNoteContent = (content) => {
        if (!content || typeof content !== 'string') return '';
        
        let processed = content;
        
        // 1. Convert genui math widgets to standard markdown math blocks
        processed = processed.replace(/genui[\s\S]*?\{\s*[\s\S]*?"content"\s*:\s*"([\s\S]*?)"\s*\}\s*\}/g, (match, formula) => {
            const cleanFormula = formula.replace(/\\\\/g, '\\');
            return `\n\n$$\n${cleanFormula}\n$$\n\n`;
        });

        // 2. Wrap lines containing LaTeX commands in math blocks if not already wrapped
        const lines = processed.split('\n');
        processed = lines.map(line => {
            const trimmed = line.trim();
            if (!trimmed) return line;
            
            // Detection: check for common LaTeX commands
            const hasMath = trimmed.includes('\\frac') || 
                           trimmed.includes('\\sqrt') || 
                           trimmed.includes('\\pi') || 
                           (trimmed.includes('\\text') && trimmed.includes('='));
            
            if (hasMath && !trimmed.startsWith('$') && !trimmed.startsWith('```')) {
                return `\n\n$$\n${trimmed}\n$$\n\n`;
            }
            return line;
        }).join('\n');

        return processed;
    };

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
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-gray-400">Content (Markdown & Math supported)</label>
                                <button 
                                    onClick={() => setIsPreviewMode(!isPreviewMode)}
                                    className="text-xs text-primary hover:underline"
                                >
                                    {isPreviewMode ? 'Switch to Editor' : 'Show Preview'}
                                </button>
                            </div>
                            
                            {isPreviewMode ? (
                                <div className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-[120px] prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]} 
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {processNoteContent(newNote.content) || '*No content yet*'}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <textarea
                                    value={newNote.content}
                                    onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                                    rows="4"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary transition-colors text-white"
                                    placeholder="Use **Bold**, # Headings, or $E=mc^2$ for math..."
                                />
                            )}
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
                        onClick={() => !editingNoteId && setSelectedNote(note)}
                        className={`bg-surface/50 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative group cursor-pointer hover:border-primary/50 transition-colors shadow-lg hover:shadow-primary/5`}
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
                                <div className="text-gray-400 text-sm line-clamp-4 leading-relaxed prose prose-invert prose-sm max-w-none prose-p:my-1 prose-headings:my-1 prose-ul:my-1">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {processNoteContent(note.content)}
                                    </ReactMarkdown>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/5 text-[10px] text-gray-500 font-bold uppercase tracking-wider group-hover:text-primary transition-colors">
                                    Click to read full note
                                </div>
                            </>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Focus Reader Modal */}
            <AnimatePresence>
                {selectedNote && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedNote(null)}
                            className="absolute inset-0 bg-black/90 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className={`relative bg-gradient-to-b ${getCategoryStyles(selectedNote.category)} border w-full max-w-4xl max-h-[85vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col`}
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-white/10 text-white">
                                        {selectedNote.category === 'Math' ? <Calculator size={24} /> :
                                         selectedNote.category === 'Science' ? <Atom size={24} /> :
                                         selectedNote.category === 'Biology' ? <Beaker size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">
                                            {selectedNote.category} Notes
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
                                            {selectedNote.title}
                                        </h2>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handleCopy(selectedNote.content)}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all"
                                        title="Copy Note Content"
                                    >
                                        {copySuccess ? <Check size={20} className="text-green-400" /> : <Copy size={20} />}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            startEditing(selectedNote);
                                            setSelectedNote(null);
                                        }}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all"
                                    >
                                        <Edit2 size={20} />
                                    </button>
                                    <button 
                                        onClick={() => setSelectedNote(null)}
                                        className="p-3 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-2xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                <div className="prose prose-invert prose-lg max-w-none prose-headings:font-black prose-p:text-gray-300 prose-p:leading-relaxed prose-strong:text-white prose-code:text-primary prose-pre:bg-black/40 prose-pre:border prose-pre:border-white/5">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {processNoteContent(selectedNote.content)}
                                    </ReactMarkdown>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-6 text-center text-[10px] font-bold uppercase tracking-[0.3em] text-gray-500 border-t border-white/10 bg-black/10">
                                End of Note
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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
