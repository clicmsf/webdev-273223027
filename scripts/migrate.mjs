import { openDatabase } from '../src/data/db.mjs';
const db=openDatabase(); db.close(); console.log('Migrations applied successfully');
