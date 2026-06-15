import { sql } from 'kysely';
import { db } from './kysely.js';

async function reset() {
  await sql`
    DROP TABLE IF EXISTS global_policies CASCADE;
  `.execute(db);

  await sql`
    DROP TABLE IF EXISTS user_quiet_hours CASCADE;
  `.execute(db);

  await sql`
    DROP TABLE IF EXISTS user_preferences CASCADE;
  `.execute(db);

  await sql`
    DROP TABLE IF EXISTS default_preferences CASCADE;
  `.execute(db);

  await sql`
    DROP TABLE IF EXISTS users CASCADE;
  `.execute(db);

  console.log('Database reset completed.');
}

try {
  await reset();
} catch (error) {
  console.error('Database reset failed:', error);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
