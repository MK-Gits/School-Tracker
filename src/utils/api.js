const API_URL = 'http://localhost:3000/api';
const SYNC_QUEUE_KEY = 'api_sync_queue';

const addToQueue = (type, studentId, data) => {
  const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  // Latest version of a specific data type for a student wins
  const filtered = queue.filter(item => !(item.type === type && item.studentId === studentId));
  filtered.push({ type, studentId, data, timestamp: Date.now() });
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  window.dispatchEvent(new Event('sync_queue_updated'));
};

export const api = {
  // --- SYNC MANAGEMENT ---
  getSyncQueue() {
    return JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
  },

  async flushSyncQueue() {
    const queue = this.getSyncQueue();
    if (queue.length === 0) return;

    console.log(`Attempting to sync ${queue.length} items...`);
    const remaining = [];

    for (const item of queue) {
      try {
        let success = false;
        switch (item.type) {
          case 'syllabus': await this.saveSyllabus(item.studentId, item.data, true); success = true; break;
          case 'activities': await this.saveActivities(item.studentId, item.data, true); success = true; break;
          case 'notes': await this.saveNotes(item.studentId, item.data, true); success = true; break;
          case 'daily': await this.saveDailyTasks(item.studentId, item.data, true); success = true; break;
          case 'grades': await this.saveGrades(item.studentId, item.data, true); success = true; break;
        }
        if (!success) remaining.push(item);
      } catch (err) {
        console.error(`Failed to sync ${item.type} for ${item.studentId}`, err);
        remaining.push(item);
      }
    }

    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
    window.dispatchEvent(new Event('sync_queue_updated'));
  },

  // --- STUDENTS ---
  async getStudents() {
    const res = await fetch(`${API_URL}/students`);
    return res.json();
  },
  async addStudent(student) {
    const res = await fetch(`${API_URL}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    return res.json();
  },
  async updateStudent(id, updates) {
    const res = await fetch(`${API_URL}/students/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  async deleteStudent(id) {
    await fetch(`${API_URL}/students/${id}`, { method: 'DELETE' });
  },

  // --- SYLLABUS ---
  async getSyllabus(studentId) {
    const res = await fetch(`${API_URL}/syllabus/${studentId}`);
    return res.json();
  },
  async saveSyllabus(studentId, syllabusData, isSyncing = false) {
    try {
      const res = await fetch(`${API_URL}/syllabus/${studentId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(syllabusData)
      });
      return res.json();
    } catch (err) {
      if (isSyncing) throw err;
      console.warn("Offline: Saving syllabus to sync queue");
      addToQueue('syllabus', studentId, syllabusData);
      return { offline: true };
    }
  },

  // --- ACTIVITIES ---
  async getActivities(studentId) {
    const res = await fetch(`${API_URL}/activities/${studentId}`);
    return res.json();
  },
  async saveActivities(studentId, activities, isSyncing = false) {
    try {
      const res = await fetch(`${API_URL}/activities/${studentId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activities)
      });
      return res.json();
    } catch (err) {
      if (isSyncing) throw err;
      console.warn("Offline: Saving activities to sync queue");
      addToQueue('activities', studentId, activities);
      return { offline: true };
    }
  },

  // --- STUDY NOTES ---
  async getNotes(studentId) {
    const res = await fetch(`${API_URL}/notes/${studentId}`);
    return res.json();
  },
  async saveNotes(studentId, notes, isSyncing = false) {
    try {
      const res = await fetch(`${API_URL}/notes/${studentId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notes)
      });
      return res.json();
    } catch (err) {
      if (isSyncing) throw err;
      console.warn("Offline: Saving notes to sync queue");
      addToQueue('notes', studentId, notes);
      return { offline: true };
    }
  },

  // --- DAILY TASKS ---
  async getDailyTasks(studentId) {
    const res = await fetch(`${API_URL}/daily/${studentId}`);
    return res.json();
  },
  async saveDailyTasks(studentId, tasks, isSyncing = false) {
    try {
      const res = await fetch(`${API_URL}/daily/${studentId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tasks)
      });
      return res.json();
    } catch (err) {
      if (isSyncing) throw err;
      console.warn("Offline: Saving daily tasks to sync queue");
      addToQueue('daily', studentId, tasks);
      return { offline: true };
    }
  },

  // --- GRADEBOOK ---
  async getGrades(studentId) {
    const res = await fetch(`${API_URL}/grades/${studentId}`);
    return res.json();
  },
  async saveGrades(studentId, grades, isSyncing = false) {
    try {
      const res = await fetch(`${API_URL}/grades/${studentId}/replace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grades)
      });
      return res.json();
    } catch (err) {
      if (isSyncing) throw err;
      console.warn("Offline: Saving grades to sync queue");
      addToQueue('grades', studentId, grades);
      return { offline: true };
    }
  },

  // --- MIGRATION ---
  async migrateData(payload) {
    const res = await fetch(`${API_URL}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};
