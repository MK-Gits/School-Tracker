import React, { createContext, useContext, useState, useEffect } from 'react';
import { loadData, saveData } from '../utils/storage';

const StudentContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useStudent = () => {
    const context = useContext(StudentContext);
    if (!context) {
        throw new Error('useStudent must be used within a StudentProvider');
    }
    return context;
};

export const StudentProvider = ({ children }) => {
    const [students, setStudents] = useState(() => {
        const stored = loadData('profiles_list', []);
        // Migration: If no profiles exist but legacy data might, create a default profile
        if (stored.length === 0) {
            return [{ id: 'default', name: 'Student 1', grade: '8th' }];
        }
        return stored;
    });

    const [currentStudentId, setCurrentStudentId] = useState(() => {
        return loadData('active_student_id', 'default');
    });

    const currentStudent = students.find(s => s.id === currentStudentId) || students[0];

    useEffect(() => {
        saveData('profiles_list', students);
    }, [students]);

    useEffect(() => {
        saveData('active_student_id', currentStudentId);
    }, [currentStudentId]);

    const switchStudent = (id) => {
        if (students.find(s => s.id === id)) {
            setCurrentStudentId(id);
            // Force a page reload or state reset might be needed depending on how components react to key changes
            window.location.reload();
        }
    };

    const addStudent = (name, grade) => {
        const newStudent = {
            id: Date.now().toString(),
            name,
            grade
        };
        setStudents(prev => [...prev, newStudent]);
        setCurrentStudentId(newStudent.id);
        window.location.reload();
    };

    const updateStudent = (id, updates) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const deleteStudent = (id) => {
        if (students.length <= 1) return;
        setStudents(prev => prev.filter(s => s.id !== id));
        if (currentStudentId === id) {
            setCurrentStudentId(students.find(s => s.id !== id).id);
        }
    };

    return (
        <StudentContext.Provider value={{
            students,
            currentStudent,
            switchStudent,
            addStudent,
            updateStudent,
            deleteStudent
        }}>
            {children}
        </StudentContext.Provider>
    );
};

