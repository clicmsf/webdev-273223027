import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

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
    for (let id=1; id<=3; id++) restoreEvent(db,id);
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
export function upsertDemoUser(db, password) {
  if (findUserByEmail(db, DEMO_EMAIL)) return { created:false };
  db.prepare('INSERT INTO users(email,password_hash) VALUES (?,?)').run(DEMO_EMAIL,hashPassword(password));
  return { created:true };
}
export const findUserByEmail = (db,email) => db.prepare('SELECT * FROM users WHERE email=?').get(email);
export const findUserBySessionHash = (db,hash) => db.prepare('SELECT u.id,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').get(hash,Date.now());
export const storeSession = (db,hash,id,expires) => db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(hash,id,expires);
export const removeSession = (db,hash) => db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash);
export const getAllEvents = db => db.prepare('SELECT * FROM events ORDER BY start_at,id').all();
export const getUpcomingEvents = db => db.prepare(`SELECT e.id,e.title,e.start_at AS date,e.capacity-count(r.id) AS free_places FROM events e LEFT JOIN registrations r ON r.event_id=e.id WHERE e.start_at>? GROUP BY e.id ORDER BY e.start_at,e.id`).all(new Date().toISOString());
export const deleteEvent = (db,id) => db.prepare('DELETE FROM events WHERE id=?').run(id).changes;
export function restoreEvent(db,id) {
  const title=['Web Development Workshop','Student Club Meetup','Project Showcase'][id-1];
  const date=new Date(Date.now()+id*86400000*7).toISOString();
  return db.prepare('INSERT OR IGNORE INTO events VALUES (?,?,?,?)').run(id,title,date,20).changes;
}
export function transaction(db, action) {
  db.exec('BEGIN IMMEDIATE');
  try { const result=action(); db.exec('COMMIT'); return result; }
  catch(e) { db.exec('ROLLBACK'); throw e; }
}
export const getEvent = (db,id) => db.prepare('SELECT * FROM events WHERE id=?').get(id);
export const registrationCount = (db,id) => db.prepare('SELECT count(*) AS n FROM registrations WHERE event_id=?').get(id).n;
export const findRegistration = (db,userId,eventId) => db.prepare('SELECT * FROM registrations WHERE user_id=? AND event_id=?').get(userId,eventId);
export const getRegistration = (db,id) => db.prepare('SELECT * FROM registrations WHERE id=?').get(id);
export function insertRegistration(db,userId,eventId) {
  const result=db.prepare('INSERT INTO registrations(user_id,event_id) VALUES (?,?)').run(userId,eventId);
  return getRegistration(db,Number(result.lastInsertRowid));
}
export const deleteRegistration = (db,id) => db.prepare('DELETE FROM registrations WHERE id=?').run(id);
export const getUserRegistrations = (db,id) => db.prepare('SELECT r.*,e.title,e.start_at AS date FROM registrations r JOIN events e ON e.id=r.event_id WHERE r.user_id=? ORDER BY e.start_at,r.id').all(id);
