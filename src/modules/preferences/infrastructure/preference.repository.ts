import { db } from '../../../shared/db/kysely.js';
import type {
  Channel,
  GlobalPolicy,
  NotificationType,
  PreferenceRule,
  QuietHours,
  Region,
  UserPreferenceRule
} from '../domain/types.js';

function mapDefaultPreference(row: {
  notification_type: NotificationType;
  channel: Channel;
  enabled: boolean;
}): PreferenceRule {
  return {
    notificationType: row.notification_type,
    channel: row.channel,
    enabled: row.enabled
  };
}

function mapUserPreference(row: {
  user_id: string;
  notification_type: NotificationType;
  channel: Channel;
  enabled: boolean;
}): UserPreferenceRule {
  return {
    userId: row.user_id,
    notificationType: row.notification_type,
    channel: row.channel,
    enabled: row.enabled
  };
}

function mapQuietHours(row: {
  enabled: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
}): QuietHours {
  return {
    enabled: row.enabled,
    start: row.start_time,
    end: row.end_time,
    timezone: row.timezone
  };
}

function mapGlobalPolicy(row: {
  id: number;
  notification_type: NotificationType | null;
  channel: Channel | null;
  region: Region | null;
  effect: 'allow' | 'deny';
  reason_code: string;
  enabled: boolean;
}): GlobalPolicy {
  return {
    id: row.id,
    notificationType: row.notification_type,
    channel: row.channel,
    region: row.region,
    effect: row.effect,
    reasonCode: row.reason_code,
    enabled: row.enabled
  };
}

export class PreferenceRepository {
  async ensureUserExists(userId: string): Promise<void> {
    await db
      .insertInto('users')
      .values({
        id: userId
      })
      .onConflict((oc) =>
        oc.column('id').doUpdateSet({
          updated_at: new Date()
        })
      )
      .execute();
  }

  async getDefaultPreferences(): Promise<PreferenceRule[]> {
    const rows = await db
      .selectFrom('default_preferences')
      .select(['notification_type', 'channel', 'enabled'])
      .orderBy('notification_type')
      .orderBy('channel')
      .execute();

    return rows.map(mapDefaultPreference);
  }

  async getUserPreferences(userId: string): Promise<UserPreferenceRule[]> {
    const rows = await db
      .selectFrom('user_preferences')
      .select(['user_id', 'notification_type', 'channel', 'enabled'])
      .where('user_id', '=', userId)
      .orderBy('notification_type')
      .orderBy('channel')
      .execute();

    return rows.map(mapUserPreference);
  }

  async upsertUserPreference(params: {
    userId: string;
    notificationType: NotificationType;
    channel: Channel;
    enabled: boolean;
  }): Promise<void> {
    await db
      .insertInto('user_preferences')
      .values({
        user_id: params.userId,
        notification_type: params.notificationType,
        channel: params.channel,
        enabled: params.enabled
      })
      .onConflict((oc) =>
        oc.columns(['user_id', 'notification_type', 'channel']).doUpdateSet((eb) => ({
          enabled: eb.ref('excluded.enabled'),
          updated_at: new Date()
        }))
      )
      .execute();
  }

  async getQuietHours(userId: string): Promise<QuietHours | null> {
    const row = await db
      .selectFrom('user_quiet_hours')
      .select(['enabled', 'start_time', 'end_time', 'timezone'])
      .where('user_id', '=', userId)
      .executeTakeFirst();

    return row ? mapQuietHours(row) : null;
  }

  async upsertQuietHours(params: {
    userId: string;
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  }): Promise<void> {
    await db
      .insertInto('user_quiet_hours')
      .values({
        user_id: params.userId,
        enabled: params.enabled,
        start_time: params.start,
        end_time: params.end,
        timezone: params.timezone
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
  }

  async getGlobalPolicies(): Promise<GlobalPolicy[]> {
    const rows = await db
      .selectFrom('global_policies')
      .select([
        'id',
        'notification_type',
        'channel',
        'region',
        'effect',
        'reason_code',
        'enabled'
      ])
      .where('enabled', '=', true)
      .orderBy('id')
      .execute();

    return rows.map(mapGlobalPolicy);
  }
}
