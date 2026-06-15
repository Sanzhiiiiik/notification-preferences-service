export const notificationTypes = ['transactional', 'marketing', 'security', 'system'] as const;
export const channels = ['email', 'sms', 'push', 'messenger'] as const;
export const regions = ['EU', 'US', 'KZ', 'GLOBAL'] as const;

export type NotificationType = (typeof notificationTypes)[number];
export type Channel = (typeof channels)[number];
export type Region = (typeof regions)[number];

export type Decision = 'allow' | 'deny';

export type DecisionReason =
  | 'allowed_by_user_preference'
  | 'allowed_by_default'
  | 'denied_by_user_preference'
  | 'denied_by_default'
  | 'blocked_by_global_policy'
  | 'blocked_by_quiet_hours';

export type PreferenceSource = 'default' | 'user';

export interface PreferenceRule {
  notificationType: NotificationType;
  channel: Channel;
  enabled: boolean;
}

export interface UserPreferenceRule extends PreferenceRule {
  userId: string;
}

export interface EffectivePreferenceRule extends PreferenceRule {
  source: PreferenceSource;
}

export interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
}

export interface GlobalPolicy {
  id?: number;
  notificationType: NotificationType | null;
  channel: Channel | null;
  region: Region | null;
  effect: Decision;
  reasonCode: string;
  enabled: boolean;
}

export interface EvaluationInput {
  userId: string;
  notificationType: NotificationType;
  channel: Channel;
  region: Region;
  datetime: string;
}

export interface EvaluationContext {
  defaultPreferences: PreferenceRule[];
  userPreferences: UserPreferenceRule[];
  quietHours: QuietHours | null;
  globalPolicies: GlobalPolicy[];
}

export interface EvaluationResult {
  decision: Decision;
  reason: DecisionReason;
  details: {
    userId: string;
    notificationType: NotificationType;
    channel: Channel;
    region: Region;
    datetime: string;
    preferenceSource?: PreferenceSource;
    matchedPolicyId?: number;
    quietHoursTimezone?: string;
    localTime?: string;
  };
}

export const quietHoursBypassTypes: readonly NotificationType[] = [
  'transactional',
  'security'
];

export function isQuietHoursBypassType(notificationType: NotificationType): boolean {
  return quietHoursBypassTypes.includes(notificationType);
}
