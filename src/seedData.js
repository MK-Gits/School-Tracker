/**
 * seedData.js
 * Runs once at app startup.  If localStorage has no syllabus data for the
 * active student, it pre-populates every store from the backup JSON file.
 * Safe to leave in place — it will NOT overwrite data that already exists.
 */
import backupData from './data/school_tracker_backup_2026-01-05.json';

function getScopedKey(key) {
  const raw = localStorage.getItem('active_student_id');
  const id = raw ? JSON.parse(raw) : 'default';
  return id === 'default' ? key : `s_${id}_${key}`;
}

function seedIfEmpty(key, value) {
  const raw = localStorage.getItem('active_student_id');
  const id = raw ? JSON.parse(raw) : 'default';

  // Only seed the 'default' legacy profile. New profiles should start empty.
  if (id !== 'default') return;

  const scoped = getScopedKey(key);
  if (!localStorage.getItem(scoped)) {
    localStorage.setItem(scoped, JSON.stringify(value));
    console.log(`[seedData] Seeded "${scoped}" with ${Array.isArray(value) ? value.length + ' entries' : 'data'}.`);
  }
}

seedIfEmpty('syllabus_data',    backupData.syllabus    ?? []);
seedIfEmpty('activities_data',  backupData.activities  ?? []);
seedIfEmpty('study_notes_data', backupData.notes       ?? []);
seedIfEmpty('daily_tasks_data', backupData.daily       ?? []);
