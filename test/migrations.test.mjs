import test from 'node:test';
import assert from 'node:assert/strict';
import { openDatabase, migrate, upsertDemoUser } from '../src/data/db.mjs';
test('fresh migrations are repeatable and enforce registration relations and uniqueness', () => {
 const db=openDatabase(':memory:');
 try {
  migrate(db);
  assert.equal(db.prepare('SELECT count(*) AS n FROM schema_migrations').get().n,2);
  upsertDemoUser(db,'temporary-test-password');
  db.prepare('INSERT INTO registrations(user_id,event_id) VALUES (1,1)').run();
  assert.throws(()=>db.prepare('INSERT INTO registrations(user_id,event_id) VALUES (1,1)').run(),/UNIQUE/);
  assert.throws(()=>db.prepare('INSERT INTO registrations(user_id,event_id) VALUES (999,1)').run(),/FOREIGN KEY/);
 } finally { db.close(); }
});
