import type {
  Channel,
  EffectivePreferenceRule,
  NotificationType,
  PreferenceRule,
  UserPreferenceRule
} from './types.js';

function preferenceKey(notificationType: NotificationType, channel: Channel): string {
  return `${notificationType}:${channel}`;
}

export function resolveEffectivePreferences(params: {
  defaultPreferences: PreferenceRule[];
  userPreferences: UserPreferenceRule[];
}): EffectivePreferenceRule[] {
  const resolved = new Map<string, EffectivePreferenceRule>();

  for (const preference of params.defaultPreferences) {
    resolved.set(preferenceKey(preference.notificationType, preference.channel), {
      notificationType: preference.notificationType,
      channel: preference.channel,
      enabled: preference.enabled,
      source: 'default'
    });
  }

  for (const preference of params.userPreferences) {
    resolved.set(preferenceKey(preference.notificationType, preference.channel), {
      notificationType: preference.notificationType,
      channel: preference.channel,
      enabled: preference.enabled,
      source: 'user'
    });
  }

  return [...resolved.values()].sort((a, b) => {
    const left = preferenceKey(a.notificationType, a.channel);
    const right = preferenceKey(b.notificationType, b.channel);

    return left.localeCompare(right);
  });
}

export function findEffectivePreference(params: {
  defaultPreferences: PreferenceRule[];
  userPreferences: UserPreferenceRule[];
  notificationType: NotificationType;
  channel: Channel;
}): EffectivePreferenceRule | null {
  const effectivePreferences = resolveEffectivePreferences({
    defaultPreferences: params.defaultPreferences,
    userPreferences: params.userPreferences
  });

  return (
    effectivePreferences.find(
      (preference) =>
        preference.notificationType === params.notificationType &&
        preference.channel === params.channel
    ) ?? null
  );
}
