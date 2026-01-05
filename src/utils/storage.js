export const loadData = (key, defaultValue) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error(`Error loading ${key} from localStorage`, e);
        return defaultValue;
    }
};

export const saveData = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error saving ${key} to localStorage`, e);
    }
};
