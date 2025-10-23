import pkg from 'pg';
import config from './config.js';

const { Pool } = pkg;

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  user: config.database.user,
  password: config.database.password,
  database: config.database.database,
  ssl: config.database.ssl ? { rejectUnauthorized: false } : undefined
});

pool.on('error', (err) => {
  console.error('[db] unexpected error on idle client', err);
});

export const query = (text, params) => pool.query(text, params);

export const getClient = () => pool.connect();

export default pool;
