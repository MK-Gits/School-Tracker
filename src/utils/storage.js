const getScopedKey = (key) => {
    const studentId = localStorage.getItem('active_student_id');
    // For profiles_list and active_student_id itself, we use global scope
    if (key === 'profiles_list' || key === 'active_student_id') return key;

    // For everything else, scope it by student ID
    // If it's 'default', we keep the original key for backwards compatibility
    const id = studentId ? JSON.parse(studentId) : 'default';
    return id === 'default' ? key : `s_${id}_${key}`;
};

export const loadData = (key, defaultValue) => {
    try {
        const scopedKey = getScopedKey(key);
        const stored = localStorage.getItem(scopedKey);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error(`Error loading ${key} from localStorage`, e);
        return defaultValue;
    }
};

export const saveData = (key, value) => {
    try {
        const scopedKey = getScopedKey(key);
        localStorage.setItem(scopedKey, JSON.stringify(value));

        // Also fire a storage event manually for same-tab updates if needed
        window.dispatchEvent(new Event('storage'));
    } catch (e) {
        console.error(`Error saving ${key} to localStorage`, e);
    }
};

