/**
 * inject-backup.js
 * Reads the backup JSON and prints a JS snippet to paste in the browser console,
 * OR writes a seed file the app can auto-load.
 *
 * Usage: node inject-backup.js
 */
import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(
  readFileSync('./src/data/school_tracker_backup_2026-01-05.json', 'utf8')
);

// Determine student-scoped key prefix at runtime (same logic as storage.js)
const snippet = `
(function() {
  var data = ${JSON.stringify(data, null, 0)};
  var raw = localStorage.getItem('active_student_id');
  var id = raw ? JSON.parse(raw) : 'default';
  var prefix = (id === 'default' || !id) ? '' : 's_' + id + '_';
  localStorage.setItem(prefix + 'syllabus_data',    JSON.stringify(data.syllabus    || []));
  localStorage.setItem(prefix + 'activities_data',  JSON.stringify(data.activities  || []));
  localStorage.setItem(prefix + 'study_notes_data', JSON.stringify(data.notes       || []));
  localStorage.setItem(prefix + 'daily_tasks_data', JSON.stringify(data.daily       || []));
  console.log('[inject] Done. Prefix used: "' + prefix + '". Reloading…');
  location.reload();
})();
`;

// Write it to a .js file so you can drag it into the console or use CDP
writeFileSync('./inject-snippet.js', snippet.trim(), 'utf8');

console.log('✅  inject-snippet.js written.');
console.log('');
console.log('Now open your browser at http://localhost:5173,');
console.log('open DevTools > Console, paste the contents of inject-snippet.js,');
console.log('and press Enter. The page will reload with all backup data loaded.');
console.log('');
console.log('--- snippet preview (first 200 chars) ---');
console.log(snippet.trim().slice(0, 200) + '…');
