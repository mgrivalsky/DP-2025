const { Pool } = require('pg');
require('dotenv').config();

function buildPoolConfig() {
  // Render (and many PaaS providers) expose a single DATABASE_URL.
  // Prefer it when present; fall back to local DB_* variables.
  if (process.env.DATABASE_URL) {
    const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isProd ? { rejectUnauthorized: false } : false
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'e_psycholog',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  };
}

const pool = new Pool(buildPoolConfig());

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err);
  process.exit(-1);
});

module.exports = pool;
