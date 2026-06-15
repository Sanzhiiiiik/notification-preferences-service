import type { ColumnType, Generated, Insertable, Selectable, Updateable } from 'kysely';

export type Timestamp = ColumnType<Date, Date | string | undefined, Date | string>;

export type NotificationType = 'transactional' | 'marketing' | 'security' | 'system';
export type Channel = 'email' | 'sms' | 'push' | 'messenger';
export type Region = 'EU' | 'US' | 'KZ' | 'GLOBAL';
export type PolicyEffect = 'allow' | 'deny';

export interface UsersTable {
  id: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface DefaultPreferencesTable {
  id: Generated<number>;
  notification_type: NotificationType;
  channel: Channel;
  enabled: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserPreferencesTable {
  id: Generated<number>;
  user_id: string;
  notification_type: NotificationType;
  channel: Channel;
  enabled: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface UserQuietHoursTable {
  id: Generated<number>;
  user_id: string;
  enabled: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface GlobalPoliciesTable {
  id: Generated<number>;
  notification_type: NotificationType | null;
  channel: Channel | null;
  region: Region | null;
  effect: PolicyEffect;
  reason_code: string;
  enabled: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

export interface Database {
  users: UsersTable;
  default_preferences: DefaultPreferencesTable;
  user_preferences: UserPreferencesTable;
  user_quiet_hours: UserQuietHoursTable;
  global_policies: GlobalPoliciesTable;
}

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type DefaultPreference = Selectable<DefaultPreferencesTable>;
export type NewDefaultPreference = Insertable<DefaultPreferencesTable>;

export type UserPreference = Selectable<UserPreferencesTable>;
export type NewUserPreference = Insertable<UserPreferencesTable>;

export type UserQuietHours = Selectable<UserQuietHoursTable>;
export type NewUserQuietHours = Insertable<UserQuietHoursTable>;

export type GlobalPolicy = Selectable<GlobalPoliciesTable>;
export type NewGlobalPolicy = Insertable<GlobalPoliciesTable>;
