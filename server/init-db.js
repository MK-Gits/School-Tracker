import pool from './db.js';

export const initDb = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create a specific schema for our user to avoid "public" schema permission issues
    // Note: AUTHORIZATION dbuser requires the role to exist. If it doesn't, we just create the schema.
    try {
      await client.query('CREATE SCHEMA IF NOT EXISTS dbuser');
    } catch (e) {
      console.warn('Schema creation warning:', e.message);
    }
    
    await client.query('SET search_path TO dbuser');

    // Create Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        grade VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS topics (
        id VARCHAR(255) PRIMARY KEY,
        subject_id VARCHAR(255) REFERENCES subjects(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        ixl_code VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        legacy_homework TEXT,
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS topic_tasks (
        id VARCHAR(255) PRIMARY KEY,
        topic_id VARCHAR(255) REFERENCES topics(id) ON DELETE CASCADE,
        task_text TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        progress INTEGER DEFAULT 0,
        notes TEXT,
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS study_notes (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        category VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS daily_tasks (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS grades (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id) ON DELETE CASCADE,
        subject_name VARCHAR(255) NOT NULL,
        test_name VARCHAR(255),
        grade_value VARCHAR(10),
        test_date TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('Database tables initialized successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Auto-run if executed directly
if (process.argv[1].endsWith('init-db.js')) {
  initDb().then(() => pool.end()).catch(() => process.exit(1));
}
