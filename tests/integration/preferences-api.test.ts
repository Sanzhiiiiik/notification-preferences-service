import { beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { db } from '../../src/shared/db/kysely.js';
import { sql } from 'kysely';

async function resetDatabaseForTest() {
  await sql`TRUNCATE TABLE global_policies, user_quiet_hours, user_preferences, default_preferences, users RESTART IDENTITY CASCADE`.execute(db);

  await db.insertInto('users').values({ id: 'user-1' }).execute();

  await db
    .insertInto('default_preferences')
    .values([
      {
        notification_type: 'transactional',
        channel: 'email',
        enabled: true
      },
      {
        notification_type: 'marketing',
        channel: 'email',
        enabled: false
      },
      {
        notification_type: 'marketing',
        channel: 'sms',
        enabled: true
      },
      {
        notification_type: 'marketing',
        channel: 'push',
        enabled: true
      }
    ])
    .execute();

  await db
    .insertInto('user_quiet_hours')
    .values({
      user_id: 'user-1',
      enabled: true,
      start_time: '22:00',
      end_time: '08:00',
      timezone: 'Asia/Almaty'
    })
    .execute();

  await db
    .insertInto('global_policies')
    .values({
      notification_type: 'marketing',
      channel: 'sms',
      region: 'EU',
      effect: 'deny',
      reason_code: 'blocked_by_global_policy',
      enabled: true
    })
    .execute();
}

describe('preferences API', () => {
  beforeAll(async () => {
    await resetDatabaseForTest();
  });

  it('returns default preferences for a user', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/users/user-1/preferences'
    });

    await app.close();

    expect(response.statusCode).toBe(200);

    const body = response.json();

    expect(body.userId).toBe('user-1');
    expect(body.preferences).toContainEqual({
      notificationType: 'marketing',
      channel: 'email',
      enabled: false,
      source: 'default'
    });
    expect(body.preferences).toContainEqual({
      notificationType: 'transactional',
      channel: 'email',
      enabled: true,
      source: 'default'
    });
  });

  it('updates user preference idempotently', async () => {
    const app = await buildApp();

    const payload = {
      preferences: [
        {
          notificationType: 'marketing',
          channel: 'email',
          enabled: false
        }
      ]
    };

    const firstResponse = await app.inject({
      method: 'POST',
      url: '/users/user-1/preferences',
      payload
    });

    const secondResponse = await app.inject({
      method: 'POST',
      url: '/users/user-1/preferences',
      payload
    });

    await app.close();

    expect(firstResponse.statusCode).toBe(200);
    expect(secondResponse.statusCode).toBe(200);

    const rows = await db
      .selectFrom('user_preferences')
      .select(['user_id', 'notification_type', 'channel', 'enabled'])
      .where('user_id', '=', 'user-1')
      .where('notification_type', '=', 'marketing')
      .where('channel', '=', 'email')
      .execute();

    expect(rows).toHaveLength(1);
    expect(rows[0]?.enabled).toBe(false);
  });

  it('denies notification by global policy', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/evaluate',
      payload: {
        userId: 'user-1',
        notificationType: 'marketing',
        channel: 'sms',
        region: 'EU',
        datetime: '2026-05-21T10:00:00Z'
      }
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      decision: 'deny',
      reason: 'blocked_by_global_policy'
    });
  });

  it('denies marketing push during quiet hours', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/evaluate',
      payload: {
        userId: 'user-1',
        notificationType: 'marketing',
        channel: 'push',
        region: 'KZ',
        datetime: '2026-05-21T21:30:00Z'
      }
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      decision: 'deny',
      reason: 'blocked_by_quiet_hours'
    });
  });

  it('allows transactional email during quiet hours', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/evaluate',
      payload: {
        userId: 'user-1',
        notificationType: 'transactional',
        channel: 'email',
        region: 'KZ',
        datetime: '2026-05-21T21:30:00Z'
      }
    });

    await app.close();

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      decision: 'allow',
      reason: 'allowed_by_default'
    });
  });
});
