import { openPostgres } from './data/postgres.mjs';
import { createApp } from './routes/http.mjs';

let db;
try {
  db = openPostgres();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
const port = Number(process.env.PORT || 3000);
const server = createApp(db);
server.listen(port, '0.0.0.0', () => {
  console.log(`Club Events listening on http://localhost:${port}`);
  console.log('Sign in with student@example.test and the password chosen during npm run setup.');
});
const shutdown = () => server.close(async () => { await db.end(); });
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
