import { migratePostgres, openPostgres } from '../src/data/postgres.mjs';

const db = openPostgres();
try {
  await migratePostgres(db);
  console.log('Migrations applied successfully');
} finally {
  await db.end();
}
