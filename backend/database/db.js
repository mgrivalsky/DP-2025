const { Pool } = require('pg');
require('dotenv').config();

function envToBool(value) {
  if (value === undefined || value === null) return undefined;
  const v = String(value).trim().toLowerCase();
  if (!v) return undefined;
  if (['1', 'true', 'yes', 'y', 'on', 'require'].includes(v)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'disable'].includes(v)) return false;
  return undefined;
}

function shouldUseSslForDatabaseUrl(connectionString) {
  // Allow explicit override (useful locally when testing with a hosted Postgres).
  const forced = envToBool(process.env.DATABASE_SSL);
  if (forced !== undefined) return forced;

  const isProd = String(process.env.NODE_ENV || '').toLowerCase() === 'production';
  if (isProd) return true;

  // Heuristic: many hosted providers append sslmode=require.
  const cs = String(connectionString || '').toLowerCase();
  return cs.includes('sslmode=require') || cs.includes('ssl=true');
}

function buildPoolConfig() {
  // Render (and many PaaS providers) expose a single DATABASE_URL.
  // Prefer it when present; fall back to local DB_* variables.
  if (process.env.DATABASE_URL) {
    const useSsl = shouldUseSslForDatabaseUrl(process.env.DATABASE_URL);
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : false
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
