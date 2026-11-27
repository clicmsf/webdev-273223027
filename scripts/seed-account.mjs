import { DEMO_EMAIL, upsertDemoUser } from '../src/data/db.mjs';
import { openPostgres } from '../src/data/postgres.mjs';

if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 8) {
  console.error('Set SEED_PASSWORD to your own password of at least eight characters before npm run setup.');
  process.exit(1);
}
const db = openPostgres();
try {
  const result = await upsertDemoUser(db, process.env.SEED_PASSWORD);
  console.log(result.created ? 'Created local member.' : 'Member already exists; existing password was not changed.');
  console.log(`Login email: ${DEMO_EMAIL}`);
  console.log('Three upcoming events are stored in the Postgres events table.');
} finally {
  await db.end();
}
