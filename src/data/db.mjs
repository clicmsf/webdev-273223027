import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { postgresTransaction } from './postgres.mjs';

export const DEMO_EMAIL = 'student@example.test';
export function migrate(db) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY)');
  const folder = new URL('../../migrations/', import.meta.url);
  for (const name of readdirSync(folder).filter(n => /^\d+.*\.sql$/.test(n)).sort()) {
    if (db.prepare('SELECT 1 FROM schema_migrations WHERE name=?').get(name)) continue;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(readFileSync(new URL(name, folder), 'utf8'));
      db.prepare('INSERT INTO schema_migrations(name) VALUES (?)').run(name);
      db.exec('COMMIT');
    } catch (e) { db.exec('ROLLBACK'); throw e; }
  }
}
export function openDatabase(filename = process.env.DB_PATH || '.local/club.db') {
  if (filename !== ':memory:') mkdirSync(dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
  const fresh = !db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations'").get();
  migrate(db);
  if (fresh) {
    for (let id=1; id<=3; id++) seedEvent(db,id);
  }
  return db;
}
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}
export function verifyPassword(password, encoded) {
  const [salt, key] = encoded.split(':');
  const expected = Buffer.from(key || '', 'hex');
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export async function upsertDemoUser(db, password) {
  if (await findUserByEmail(db, DEMO_EMAIL)) return { created: false };
  const changes = await write(db, 'INSERT INTO users (email, password_hash) VALUES (?, ?) ON CONFLICT (email) DO NOTHING', [DEMO_EMAIL, hashPassword(password)]);
  return { created: changes === 1 };
}

function postgresSql(sql) {
  let index = 0;
  return sql.replaceAll('?', () => '$' + ++index);
}

function normalizeDates(row) {
  for (const name of ['date', 'start_at', 'created_at']) {
    if (row[name] instanceof Date) row[name] = row[name].toISOString();
  }
  return row;
}

async function all(db, sql, args = []) {
  if (!db.query) return db.prepare(sql).all(...args);
  const { rows } = await db.query(postgresSql(sql), args);
  return rows.map(normalizeDates);
}

async function one(db, sql, args = []) {
  if (!db.query) return db.prepare(sql).get(...args);
  const { rows } = await db.query(postgresSql(sql), args);
  return rows[0] && normalizeDates(rows[0]);
}

async function write(db, sql, args = []) {
  if (!db.query) return db.prepare(sql).run(...args).changes;
  const { rowCount } = await db.query(postgresSql(sql), args);
  return rowCount;
}

export const findUserByEmail = (db, email) => one(db, 'SELECT * FROM users WHERE email=?', [email]);
export const findUserBySessionHash = (db, hash) => one(db, 'SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?', [hash, Date.now()]);
export const storeSession = (db, hash, id, expires) => write(db, 'INSERT INTO sessions VALUES (?,?,?)', [hash, id, expires]);
export const removeSession = (db, hash) => write(db, 'DELETE FROM sessions WHERE token_hash=?', [hash]);
export const getAllEvents = (db) => all(db, 'SELECT * FROM events ORDER BY start_at,id');
export const getUpcomingEvents = (db) => all(db, `SELECT e.id,e.title,e.start_at AS date,CAST(e.capacity-count(r.id) AS integer) AS free_places FROM events e LEFT JOIN registrations r ON r.event_id=e.id WHERE e.start_at>? GROUP BY e.id ORDER BY e.start_at,e.id`, [new Date().toISOString()]);
export const deleteEvent = (db, id) => write(db, 'DELETE FROM events WHERE id=?', [id]);

const eventTitles = ['Web Development Workshop', 'Student Club Meetup', 'Project Showcase'];
const seedSql = 'INSERT INTO events VALUES (?,?,?,?) ON CONFLICT (id) DO NOTHING';
const seedValues = (id) => [id, eventTitles[id-1], new Date(Date.now()+id*86400000*7).toISOString(), 20];

function seedEvent(db, id) {
  return db.prepare(seedSql).run(...seedValues(id));
}

export const restoreEvent = (db, id) => write(db, seedSql, seedValues(id));

const sqliteTransactions = new WeakMap();

export function transaction(db, action) {
  if (db.query) return postgresTransaction(db, action);

  const run = async () => {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = await action(db);
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };
  const previous = sqliteTransactions.get(db) || Promise.resolve();
  const pending = previous.then(run, run);
  sqliteTransactions.set(db, pending);
  return pending;
}

export const getEvent = (db, id) => one(db, db.query ? 'SELECT * FROM events WHERE id=? FOR UPDATE' : 'SELECT * FROM events WHERE id=?', [id]);
export const registrationCount = async (db, id) => (await one(db, 'SELECT count(*) AS n FROM registrations WHERE event_id=?', [id])).n;
export const findRegistration = (db, userId, eventId) => one(db, 'SELECT * FROM registrations WHERE user_id=? AND event_id=?', [userId, eventId]);
export const getRegistration = (db, id) => one(db, db.query ? 'SELECT * FROM registrations WHERE id=? FOR UPDATE' : 'SELECT * FROM registrations WHERE id=?', [id]);
export const insertRegistration = (db, userId, eventId) => one(db, 'INSERT INTO registrations (user_id,event_id) VALUES (?,?) RETURNING *', [userId, eventId]);
export const deleteRegistration = (db, id) => write(db, 'DELETE FROM registrations WHERE id=?', [id]);
export const getUserRegistrations = (db, id) => all(db, 'SELECT r.*,e.title,e.start_at AS date FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.user_id=? ORDER BY e.start_at,r.id', [id]);

export async function checkDatabase(db) {
  await one(db, 'SELECT 1');
}
