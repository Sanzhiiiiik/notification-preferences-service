import { db } from './kysely.js';

async function seed() {
  await db
    .insertInto('users')
    .values({
      id: 'user-1'
    })
    .onConflict((oc) =>
      oc.column('id').doUpdateSet({
        updated_at: new Date()
      })
    )
    .execute();

  await db
    .insertInto('default_preferences')
    .values([
      {
        notification_type: 'transactional',
        channel: 'email',
        enabled: true
      },
      {
        notification_type: 'transactional',
        channel: 'sms',
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
        enabled: false
      },
      {
        notification_type: 'marketing',
        channel: 'push',
        enabled: true
      },
      {
        notification_type: 'security',
        channel: 'email',
        enabled: true
      },
      {
        notification_type: 'security',
        channel: 'sms',
        enabled: true
      },
      {
        notification_type: 'system',
        channel: 'push',
        enabled: true
      }
    ])
    .onConflict((oc) =>
      oc.columns(['notification_type', 'channel']).doUpdateSet((eb) => ({
        enabled: eb.ref('excluded.enabled'),
        updated_at: new Date()
      }))
    )
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
    .onConflict((oc) =>
      oc.column('user_id').doUpdateSet((eb) => ({
        enabled: eb.ref('excluded.enabled'),
        start_time: eb.ref('excluded.start_time'),
        end_time: eb.ref('excluded.end_time'),
        timezone: eb.ref('excluded.timezone'),
        updated_at: new Date()
      }))
    )
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
    .onConflict((oc) => oc.doNothing())
    .execute();

  console.log('Database seed completed.');
}

try {
  await seed();
} catch (error) {
  console.error('Database seed failed:', error);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
