/* global process */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import { initDb } from './init-db.js';

dotenv.config();

// Initialize database tables on startup
initDb().catch(err => console.error('Failed to init DB:', err));

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// --- STUDENTS ---
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY created_at ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  const { id, name, grade } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO students (id, name, grade) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, grade = EXCLUDED.grade RETURNING *',
      [id, name, grade]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { name, grade } = req.body;
  try {
    const result = await pool.query(
      'UPDATE students SET name = $1, grade = $2 WHERE id = $3 RETURNING *',
      [name, grade, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM students WHERE id = $1', [req.params.id]);
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SYLLABUS ---
app.get('/api/syllabus/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const subjects = await pool.query('SELECT * FROM subjects WHERE student_id = $1', [studentId]);
    
    const result = [];
    for (let i = 0; i < subjects.rows.length; i++) {
      const subject = subjects.rows[i];
      const topics = await pool.query('SELECT * FROM topics WHERE subject_id = $1', [subject.id]);
      const topicsWithTasks = [];
      
      for (let j = 0; j < topics.rows.length; j++) {
        const topic = topics.rows[j];
        const tasks = await pool.query('SELECT * FROM topic_tasks WHERE topic_id = $1', [topic.id]);
        topicsWithTasks.push({
          ...topic,
          ixl: topic.ixl_code,
          homework: topic.legacy_homework,
          completedAt: topic.completed_at,
          tasks: tasks.rows.map(t => ({ id: t.id, text: t.task_text, completed: t.is_completed }))
        });
      }
      
      result.push({
        id: subject.id,
        name: subject.name,
        topics: topicsWithTasks
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/syllabus/:studentId/replace', async (req, res) => {
  const { studentId } = req.params;
  const subjects = req.body || [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM subjects WHERE student_id = $1', [studentId]);
    
    if (Array.isArray(subjects)) {
      for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        await client.query(
          'INSERT INTO subjects (id, student_id, name) VALUES ($1, $2, $3)',
          [subject.id, studentId, subject.name]
        );
        
        const topics = Array.isArray(subject.topics) ? subject.topics : [];
        for (let j = 0; j < topics.length; j++) {
          const topic = topics[j];
          await client.query(
            'INSERT INTO topics (id, subject_id, name, ixl_code, status, legacy_homework, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [topic.id, subject.id, topic.name, topic.ixl || '', topic.status, topic.homework || '', topic.completedAt || null]
          );
          
          const tasks = Array.isArray(topic.tasks) ? topic.tasks : [];
          for (let k = 0; k < tasks.length; k++) {
            const task = tasks[k];
            await client.query(
              'INSERT INTO topic_tasks (id, topic_id, task_text, is_completed) VALUES ($1, $2, $3, $4)',
              [task.id, topic.id, task.text, task.completed]
            );
          }
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Syllabus updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- ACTIVITIES ---
app.get('/api/activities/:studentId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM activities WHERE student_id = $1', [req.params.studentId]);
    const formatted = result.rows.map(a => ({
      ...a,
      completedAt: a.completed_at
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/activities/:studentId/replace', async (req, res) => {
  const { studentId } = req.params;
  const activities = req.body || [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM activities WHERE student_id = $1', [studentId]);
    
    if (Array.isArray(activities)) {
      for (let i = 0; i < activities.length; i++) {
        const act = activities[i];
        await client.query(
          'INSERT INTO activities (id, student_id, name, category, progress, notes, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [act.id, studentId, act.name, act.category, act.progress, act.notes, act.completedAt || null]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Activities updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- STUDY NOTES ---
app.get('/api/notes/:studentId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM study_notes WHERE student_id = $1', [req.params.studentId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes/:studentId/replace', async (req, res) => {
  const { studentId } = req.params;
  const notes = req.body || [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM study_notes WHERE student_id = $1', [studentId]);
    
    if (Array.isArray(notes)) {
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        await client.query(
          'INSERT INTO study_notes (id, student_id, title, content, category) VALUES ($1, $2, $3, $4, $5)',
          [note.id, studentId, note.title, note.content, note.category]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Notes updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- DAILY TASKS ---
app.get('/api/daily/:studentId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM daily_tasks WHERE student_id = $1', [req.params.studentId]);
    const formatted = {};
    result.rows.forEach(t => {
      const dateKey = t.task_date ? t.task_date.toISOString().split('T')[0] : t.created_at.toISOString().split('T')[0];
      if (!formatted[dateKey]) formatted[dateKey] = [];
      formatted[dateKey].push({ id: t.id, text: t.text, completed: t.is_completed });
    });
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/daily/:studentId/replace', async (req, res) => {
  const { studentId } = req.params;
  const allDailyTasks = req.body || {};
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM daily_tasks WHERE student_id = $1', [studentId]);
    
    if (allDailyTasks && typeof allDailyTasks === 'object') {
      const entries = Object.entries(allDailyTasks);
      for (let i = 0; i < entries.length; i++) {
        const [date, tasks] = entries[i];
        if (Array.isArray(tasks)) {
          for (let j = 0; j < tasks.length; j++) {
            const task = tasks[j];
            await client.query(
              'INSERT INTO daily_tasks (id, student_id, text, is_completed, task_date) VALUES ($1, $2, $3, $4, $5)',
              [task.id, studentId, task.text, task.completed, date]
            );
          }
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Daily tasks updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- GRADEBOOK ---
app.get('/api/grades/:studentId', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM grades WHERE student_id = $1', [req.params.studentId]);
    const tests = result.rows.map(r => ({
      id: r.id,
      subject: r.subject_name,
      name: r.test_name,
      score: r.grade_value,
      date: r.test_date ? r.test_date.toISOString().split('T')[0] : ''
    }));
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/grades/:studentId/replace', async (req, res) => {
  const { studentId } = req.params;
  const tests = req.body || [];
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM grades WHERE student_id = $1', [studentId]);
    
    if (Array.isArray(tests)) {
      for (let i = 0; i < tests.length; i++) {
        const test = tests[i];
        await client.query(
          'INSERT INTO grades (id, student_id, subject_name, test_name, grade_value, test_date) VALUES ($1, $2, $3, $4, $5, $6)',
          [test.id, studentId, test.subject, test.name, test.score, test.date || null]
        );
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Grades updated successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- MIGRATION ---
app.post('/api/migrate', async (req, res) => {
  const { profiles, syllabus, activities, notes, dailyTasks, gradebook } = req.body;
  const client = await pool.connect();

  try {
    console.log('--- STARTING BULK MIGRATION (V4 - ULTRA STABLE) ---');
    await client.query('BEGIN');

    const profileList = Array.isArray(profiles) ? profiles : [];
    
    for (let pIdx = 0; pIdx < profileList.length; pIdx++) {
      const p = profileList[pIdx];
      console.log(`> CHECKPOINT 1: Student ${p.name}`);
      
      // 1. Student Profile
      await client.query(
        'INSERT INTO students (id, name, grade) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, grade = EXCLUDED.grade',
        [p.id, p.name, p.grade]
      );

      // 2. Syllabus
      console.log('  - CHECKPOINT 2: Syllabus');
      const stSyllabus = (syllabus || {})[p.id === 'default' ? 'syllabus_data' : `s_${p.id}_syllabus_data` ] || [];
      if (Array.isArray(stSyllabus)) {
        for (let i = 0; i < stSyllabus.length; i++) {
          const subject = stSyllabus[i];
          await client.query(
            'INSERT INTO subjects (id, student_id, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
            [subject.id, p.id, subject.name]
          );
          const topics = Array.isArray(subject.topics) ? subject.topics : [];
          for (let j = 0; j < topics.length; j++) {
            const topic = topics[j];
            await client.query(
              'INSERT INTO topics (id, subject_id, name, ixl_code, status, legacy_homework, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
              [topic.id, subject.id, topic.name, topic.ixl || '', topic.status, topic.homework || '', topic.completedAt || null]
            );
            const tasks = Array.isArray(topic.tasks) ? topic.tasks : [];
            for (let k = 0; k < tasks.length; k++) {
              const task = tasks[k];
              await client.query(
                'INSERT INTO topic_tasks (id, topic_id, task_text, is_completed) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING',
                [task.id, topic.id, task.text, task.completed]
              );
            }
          }
        }
      }

      // 3. Activities
      console.log('  - CHECKPOINT 3: Activities');
      const stActs = (activities || {})[p.id === 'default' ? 'activities_data' : `s_${p.id}_activities_data`] || [];
      if (Array.isArray(stActs)) {
        for (let i = 0; i < stActs.length; i++) {
          const act = stActs[i];
          await client.query(
            'INSERT INTO activities (id, student_id, name, category, progress, notes, completed_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING',
            [act.id, p.id, act.name, act.category, act.progress, act.notes, act.completedAt || null]
          );
        }
      }

      // 4. Notes
      console.log('  - CHECKPOINT 4: Notes');
      const stNotes = (notes || {})[p.id === 'default' ? 'study_notes_data' : `s_${p.id}_study_notes_data`] || [];
      if (Array.isArray(stNotes)) {
        for (let i = 0; i < stNotes.length; i++) {
          const note = stNotes[i];
          await client.query(
            'INSERT INTO study_notes (id, student_id, title, content, category) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
            [note.id, p.id, note.title, note.content, note.category]
          );
        }
      }

      // 5. Daily Tasks (RENAMED VARIABLE TO TEST FOR OLD FILE RUNNING)
      console.log('  - CHECKPOINT 5: Daily Tasks');
      const dailyTasksBatch = (dailyTasks || {})[p.id === 'default' ? 'daily_tasks_data' : `s_${p.id}_daily_tasks_data`] || [];
      if (Array.isArray(dailyTasksBatch)) {
        const today = new Date().toISOString().split('T')[0];
        for (let i = 0; i < dailyTasksBatch.length; i++) {
          const task = dailyTasksBatch[i];
          await client.query(
            'INSERT INTO daily_tasks (id, student_id, text, is_completed, task_date) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
            [task.id, p.id, task.text, task.completed, today]
          );
        }
      } else if (dailyTasksBatch && typeof dailyTasksBatch === 'object') {
        const dEntries = Object.entries(dailyTasksBatch);
        for (let i = 0; i < dEntries.length; i++) {
          const [date, tasks] = dEntries[i];
          if (Array.isArray(tasks)) {
            for (let j = 0; j < tasks.length; j++) {
              const task = tasks[j];
              await client.query(
                'INSERT INTO daily_tasks (id, student_id, text, is_completed, task_date) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
                [task.id, p.id, task.text, task.completed, date]
              );
            }
          }
        }
      }
      
      // 6. Grades
      console.log('  - CHECKPOINT 6: Grades');
      const stGradesRaw = (gradebook || {})[p.id === 'default' ? 'tests_data' : `s_${p.id}_tests_data`] || [];
      const stGrades = Array.isArray(stGradesRaw) ? stGradesRaw : (typeof stGradesRaw === 'object' ? Object.entries(stGradesRaw).map(([subject, data]) => ({
        id: 'legacy_' + Date.now() + Math.random(),
        subject,
        name: 'Legacy Test',
        score: data.grade,
        date: data.testDate || null
      })) : []);

      for (let i = 0; i < stGrades.length; i++) {
        const test = stGrades[i];
        await client.query(
          'INSERT INTO grades (id, student_id, subject_name, test_name, grade_value, test_date) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
          [test.id, p.id, test.subject, test.name || 'Test', test.score, test.date || null]
        );
      }
    }

    await client.query('COMMIT');
    console.log('--- MIGRATION SUCCESSFUL ---');
    res.json({ message: 'Migration completed successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('--- MIGRATION FAILED ---');
    console.error('Error Details:', err.message);
    res.status(500).json({ error: 'DEBUG: ' + err.message });
  } finally {
    client.release();
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
