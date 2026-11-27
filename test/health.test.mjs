import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { openDatabase } from '../src/data/db.mjs';
import { createApp } from '../src/routes/http.mjs';

test('health probes the database and returns 503 when the query fails', async (t) => {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/health`;
  const healthy = await fetch(url);
  assert.equal(healthy.status, 200);
  assert.deepEqual(await healthy.json(), { status: 'ok', db: 'ok' });
  db.close();

  const unhealthy = await fetch(url);
  assert.equal(unhealthy.status, 503);
  assert.deepEqual(await unhealthy.json(), { status: 'error', db: 'down' });
});

test('unknown routes, malformed JSON, and internal errors return only a short message', async (t) => {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  const unknown = await fetch(base + '/no-such-page');
  assert.equal(unknown.status, 404);
  assert.deepEqual(await unknown.json(), { error: 'Not found' });

  const post = (body) => fetch(base + '/api/registrations', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
  });
  const malformed = await post('{error');
  assert.equal(malformed.status, 400);
  assert.deepEqual(await malformed.json(), { error: 'Send a valid JSON request body.' });
  assert.equal((await post('{}')).status, 401);
  const oversized = await post('a'.repeat(8193));
  assert.equal(oversized.status, 400);
  assert.deepEqual(await oversized.json(), { error: 'The request body is too large.' });

  db.close();
  const failed = await fetch(base + '/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'student@example.test', password: 'test-only-value' }),
  });
  assert.equal(failed.status, 500);
  assert.deepEqual(await failed.json(), { error: 'Something went wrong on our side.' });
});
