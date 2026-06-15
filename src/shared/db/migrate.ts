import { sql } from 'kysely';
import { db } from './kysely.js';

async function migrate() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS default_preferences (
      id BIGSERIAL PRIMARY KEY,
      notification_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT default_preferences_notification_type_check
        CHECK (notification_type IN ('transactional', 'marketing', 'security', 'system')),

      CONSTRAINT default_preferences_channel_check
        CHECK (channel IN ('email', 'sms', 'push', 'messenger')),

      CONSTRAINT default_preferences_unique_type_channel
        UNIQUE (notification_type, channel)
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS user_preferences (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notification_type TEXT NOT NULL,
      channel TEXT NOT NULL,
      enabled BOOLEAN NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT user_preferences_notification_type_check
        CHECK (notification_type IN ('transactional', 'marketing', 'security', 'system')),

      CONSTRAINT user_preferences_channel_check
        CHECK (channel IN ('email', 'sms', 'push', 'messenger')),

      CONSTRAINT user_preferences_unique_user_type_channel
        UNIQUE (user_id, notification_type, channel)
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS user_quiet_hours (
      id BIGSERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enabled BOOLEAN NOT NULL DEFAULT false,
      start_time TIME NOT NULL,
      end_time TIME NOT NULL,
      timezone TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT user_quiet_hours_unique_user
        UNIQUE (user_id)
    );
  `.execute(db);

  await sql`
    CREATE TABLE IF NOT EXISTS global_policies (
      id BIGSERIAL PRIMARY KEY,
      notification_type TEXT NULL,
      channel TEXT NULL,
      region TEXT NULL,
      effect TEXT NOT NULL,
      reason_code TEXT NOT NULL,
      enabled BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

      CONSTRAINT global_policies_notification_type_check
        CHECK (notification_type IS NULL OR notification_type IN ('transactional', 'marketing', 'security', 'system')),

      CONSTRAINT global_policies_channel_check
        CHECK (channel IS NULL OR channel IN ('email', 'sms', 'push', 'messenger')),

      CONSTRAINT global_policies_region_check
        CHECK (region IS NULL OR region IN ('EU', 'US', 'KZ', 'GLOBAL')),

      CONSTRAINT global_policies_effect_check
        CHECK (effect IN ('allow', 'deny'))
    );
  `.execute(db);

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS global_policies_unique_rule_idx
    ON global_policies (
      COALESCE(notification_type, '*'),
      COALESCE(channel, '*'),
      COALESCE(region, '*'),
      effect,
      reason_code
    );
  `.execute(db);

  console.log('Database migration completed.');
}

try {
  await migrate();
} catch (error) {
  console.error('Database migration failed:', error);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
