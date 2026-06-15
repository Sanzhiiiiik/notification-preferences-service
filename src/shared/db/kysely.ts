import pg from 'pg';
import { Kysely, PostgresDialect } from 'kysely';
import { env } from '../../config/env.js';
import type { Database } from './database.types.js';

const { Pool } = pg;

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      connectionString: env.DATABASE_URL
    })
  })
});
