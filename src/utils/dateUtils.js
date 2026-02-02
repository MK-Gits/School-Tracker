/**
 * Parses a "YYYY-MM-DD" date string as local midnight.
 * This prevents the date from shifting when using UTC-based parsing.
 * @param {string} dateStr - The date string in "YYYY-MM-DD" format.
 * @returns {Date} - A Date object representing midnight on that day in the local timezone.
 */
export const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
};

/**
 * Returns a "YYYY-MM-DD" string for a given Date object in local time.
 * @param {Date|string} date - The date to format.
 * @returns {string} - The formatted date string.
 */
export const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Normalizes a date to local midnight for accurate day-to-day comparison.
 * @param {Date|string|number} date 
 * @returns {Date}
 */
export const startOfLocalDate = (date) => {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
