import pg from 'pg';
import { readdirSync, readFileSync } from 'node:fs';

export function openPostgres() {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error('missing DATABASE_URL: see .env.example');

  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 3000,
    statement_timeout: 5000,
    query_timeout: 5500,
    enableChannelBinding: true,
  });
  pool.on('error', (error) => {
    console.error('Idle database connection failed:', error.stack);
  });
  return pool;
}

export async function postgresTransaction(pool, action) {
  const connection = await pool.connect();
  let discard = false;
  try {
    await connection.query('BEGIN');
    const result = await action(connection);
    await connection.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await connection.query('ROLLBACK');
    } catch {
      discard = true;
    }
    throw error;
  } finally {
    connection.release(discard);
  }
}

export async function migratePostgres(pool) {
  const folder = new URL('../../migrations/postgres/', import.meta.url);
  const names = readdirSync(folder).filter((name) => /^\d+.*\.sql$/.test(name)).sort();
  await postgresTransaction(pool, async (connection) => {
    await connection.query("SELECT pg_advisory_xact_lock(hashtext('club-events-migrations'))");
    await connection.query('CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY)');
    for (const name of names) {
      const { rowCount } = await connection.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
      if (rowCount) continue;
      await connection.query(readFileSync(new URL(name, folder), 'utf8'));
      await connection.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
    }
  });
}
