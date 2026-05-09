/* global process */
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Automatically use our specific schema to avoid public schema permission issues
pool.on('connect', (client) => {
  client.query('SET search_path TO dbuser');
});

export const query = (text, params) => pool.query(text, params);
export default pool;
