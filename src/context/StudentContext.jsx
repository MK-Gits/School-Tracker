/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const StudentContext = createContext();

export const useStudent = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudent must be used within a StudentProvider');
    }
    return context;
};

export const StudentProvider = ({ children }) => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [hasPendingSync, setHasPendingSync] = useState(() => api.getSyncQueue().length > 0);

    const [currentStudentId, setCurrentStudentId] = useState(() => {
        return localStorage.getItem('active_student_id') || 'default';
    });

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            api.flushSyncQueue().then(() => setHasPendingSync(false));
        };
        const handleOffline = () => setIsOffline(true);
        const handleQueueUpdate = () => setHasPendingSync(api.getSyncQueue().length > 0);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('sync_queue_updated', handleQueueUpdate);

        // Initial check and sync
        if (navigator.onLine) {
            api.flushSyncQueue().then(() => setHasPendingSync(api.getSyncQueue().length > 0));
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('sync_queue_updated', handleQueueUpdate);
        };
    }, []);

    useEffect(() => {
        const loadStudents = async () => {
            try {
                const data = await api.getStudents();
                if (data.length === 0) {
                    setStudents([{ id: 'default', name: 'student', grade: '8th' }]);
                } else {
                    setStudents(data);
                }
                setIsOffline(false);
            } catch (err) {
                console.error("Failed to load students", err);
                setIsOffline(true);
                // Try to load from localStorage if we have student list cached (could add this later)
                if (students.length === 0) {
                    setStudents([{ id: 'default', name: 'student', grade: '8th' }]);
                }
            } finally {
                setLoading(false);
            }
        };
        loadStudents();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        localStorage.setItem('active_student_id', currentStudentId);
    }, [currentStudentId]);

    const currentStudent = students.find(s => s.id === currentStudentId) || students[0];

    const switchStudent = (id) => {
        if (students.find(s => s.id === id)) {
            setCurrentStudentId(id);
            window.location.reload();
        }
    };

    const addStudent = async (name, grade) => {
        try {
            const newStudent = { id: Date.now().toString(), name, grade };
            const saved = await api.addStudent(newStudent);
            setStudents(prev => [...prev, saved]);
            setCurrentStudentId(saved.id);
            window.location.reload();
        } catch (err) {
            console.error("Failed to add student", err);
        }
    };

    const updateStudent = async (id, updates) => {
        try {
            const updated = await api.updateStudent(id, updates);
            setStudents(prev => prev.map(s => s.id === id ? updated : s));
        } catch (err) {
            console.error("Failed to update student", err);
        }
    };

    const deleteStudent = async (id) => {
        if (students.length <= 1) return;
        try {
            await api.deleteStudent(id);
            setStudents(prev => prev.filter(s => s.id !== id));
            if (currentStudentId === id) {
                const remaining = students.filter(s => s.id !== id);
                setCurrentStudentId(remaining[0].id);
            }
        } catch (err) {
            console.error("Failed to delete student", err);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-white">Loading Profiles...</div>;
    }

    return (
        <StudentContext.Provider value={{
            students,
            currentStudent,
            switchStudent,
            addStudent,
            updateStudent,
            deleteStudent,
            isOffline,
            hasPendingSync
        }}>
            {children}
        </StudentContext.Provider>
    );
};
