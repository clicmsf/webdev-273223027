import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkDatabase } from '../data/db.mjs';
import { authenticate, clearSessionCookie, currentUser, endSession, sessionCookie } from '../services/auth.mjs';
import { listUpcomingEvents } from '../services/events.mjs';

import { reservePlace, cancelReservation, myRegistrations, RegistrationError } from '../services/registrations.mjs';

import { suggestPoster } from '../services/poster.mjs';

const publicDir = fileURLToPath(new URL('../../public/', import.meta.url));
const pages = {
  '/login': ['login.html', 'text/html; charset=utf-8'],
  '/events': ['events.html', 'text/html; charset=utf-8'],
  '/events-client.mjs': ['events-client.mjs', 'text/javascript; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
};

function json(res, status, data, headers = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  res.end(JSON.stringify(data));
}
function redirect(res, destination) {
  res.writeHead(302, { Location: destination, 'Cache-Control': 'no-store' });
  res.end();
}
class RequestError extends Error {}

async function bodyAsJson(req, limit = 8192) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > limit) {
      req.resume();
      throw new RequestError('The request body is too large.');
    }
    chunks.push(chunk);
  }
  if (bytes === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError('Send a valid JSON request body.');
  }
}
async function sendPage(res, key) {
  const [name, contentType] = pages[key];
  const contents = await readFile(join(publicDir, name));
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(contents);
}

export function createApp(db) {
  return createServer(async (req, res) => {
    try {
      const route = new URL(req.url || '/', 'http://localhost').pathname;
      if (req.method === 'GET' && route === '/health') {
        try {
          await checkDatabase(db);
          return json(res, 200, { status: 'ok', db: 'ok' });
        } catch (error) {
          console.error('Database health check failed:', error.stack);
          return json(res, 503, { status: 'error', db: 'down' });
        }
      }
      const user = await currentUser(db, req);
      if (req.method === 'GET' && route === '/') return redirect(res, user ? '/events' : '/login');
      if (req.method === 'GET' && route === '/login') {
        if (user) return redirect(res, '/events');
        return await sendPage(res, '/login');
      }
      if (req.method === 'GET' && route === '/events') {
        if (!user) return redirect(res, '/login');
        return await sendPage(res, '/events');
      }
      if (req.method === 'GET' && (route === '/app.js' || route === '/events-client.mjs' || route === '/styles.css')) return await sendPage(res, route);
      if (req.method === 'POST' && route === '/api/login') {
        const payload = await bodyAsJson(req);
        const signedIn = await authenticate(db, payload?.email, payload?.password);
        if (!signedIn) return json(res, 401, { error: 'Invalid email or password' });
        return json(res, 200, { user: signedIn.user }, { 'Set-Cookie': sessionCookie(req, signedIn.token) });
      }
      if (req.method === 'POST' && route === '/api/logout') {
        await endSession(db, req);
        return json(res, 200, { ok: true }, { 'Set-Cookie': clearSessionCookie(req) });
      }
      if (req.method === 'GET' && route === '/api/events') {
        if (!user) return json(res, 401, { error: 'Sign in first' });
        return json(res, 200, { events: await listUpcomingEvents(db) });
      }
      if (req.method === 'POST' && route === '/api/poster-suggestions') {
        if (!user) return json(res,401,{error:'Unauthenticated',message:'Sign in first'});
        const payload = await bodyAsJson(req, 2900000);
        return json(res,200,await suggestPoster(user,payload || {}));
      }
      if (route === '/api/registrations' && ['GET','POST'].includes(req.method)) {
        const payload = req.method === 'POST' ? await bodyAsJson(req) : null;
        if (!user) return json(res, 401, { error: 'Unauthenticated', message: 'Sign in first' });
        if (req.method === 'GET') return json(res, 200, { registrations: await myRegistrations(db,user.id) });
        return json(res,201,{registration:await reservePlace(db,user.id,payload?.eventId)});
      }
      if (req.method === 'DELETE' && /^\/api\/registrations\/[^/]+$/.test(route)) {
        if (!user) return json(res,401,{error:'Unauthenticated',message:'Sign in first'});
        await cancelReservation(db,user.id,Number(route.split('/').pop()));
        res.writeHead(204,{'Cache-Control':'no-store'}); return res.end();
      }
      if (req.method === 'GET' && route === '/api/me') {
        if (!user) return json(res, 401, { error: 'Sign in first' });
        return json(res, 200, { user });
      }
      return json(res, 404, { error: 'Not found' });
    } catch (error) {
      if (error instanceof RegistrationError) return json(res,error.status,{error:error.name,message:error.message});
      console.error('Request failed:', error.stack);
      if (res.headersSent) return res.end();
      if (error instanceof RequestError) return json(res, 400, { error: error.message });
      return json(res, 500, { error: 'Something went wrong on our side.' });
    }
  });
}
