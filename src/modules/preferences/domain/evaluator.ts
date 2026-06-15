import { findEffectivePreference } from './preference-resolver.js';
import { checkQuietHours } from './quiet-hours.js';
import { findMatchingGlobalPolicy } from './policy-matcher.js';
import type { EvaluationContext, EvaluationInput, EvaluationResult } from './types.js';
import { isQuietHoursBypassType } from './types.js';

export function evaluateNotification(
  input: EvaluationInput,
  context: EvaluationContext
): EvaluationResult {
  const matchedGlobalPolicy = findMatchingGlobalPolicy({
    policies: context.globalPolicies,
    notificationType: input.notificationType,
    channel: input.channel,
    region: input.region
  });

  if (matchedGlobalPolicy) {
    return {
      decision: 'deny',
      reason: 'blocked_by_global_policy',
      details: {
        userId: input.userId,
        notificationType: input.notificationType,
        channel: input.channel,
        region: input.region,
        datetime: input.datetime,
        matchedPolicyId: matchedGlobalPolicy.id
      }
    };
  }

  const effectivePreference = findEffectivePreference({
    defaultPreferences: context.defaultPreferences,
    userPreferences: context.userPreferences.filter((preference) => preference.userId === input.userId),
    notificationType: input.notificationType,
    channel: input.channel
  });

  if (!effectivePreference) {
    return {
      decision: 'deny',
      reason: 'denied_by_default',
      details: {
        userId: input.userId,
        notificationType: input.notificationType,
        channel: input.channel,
        region: input.region,
        datetime: input.datetime
      }
    };
  }

  if (!effectivePreference.enabled) {
    return {
      decision: 'deny',
      reason:
        effectivePreference.source === 'user'
          ? 'denied_by_user_preference'
          : 'denied_by_default',
      details: {
        userId: input.userId,
        notificationType: input.notificationType,
        channel: input.channel,
        region: input.region,
        datetime: input.datetime,
        preferenceSource: effectivePreference.source
      }
    };
  }

  const quietHoursCheck = checkQuietHours({
    quietHours: context.quietHours,
    datetime: input.datetime
  });

  if (
    quietHoursCheck.isWithinQuietHours &&
    !isQuietHoursBypassType(input.notificationType)
  ) {
    return {
      decision: 'deny',
      reason: 'blocked_by_quiet_hours',
      details: {
        userId: input.userId,
        notificationType: input.notificationType,
        channel: input.channel,
        region: input.region,
        datetime: input.datetime,
        preferenceSource: effectivePreference.source,
        quietHoursTimezone: context.quietHours?.timezone,
        localTime: quietHoursCheck.localTime ?? undefined
      }
    };
  }

  return {
    decision: 'allow',
    reason:
      effectivePreference.source === 'user'
        ? 'allowed_by_user_preference'
        : 'allowed_by_default',
    details: {
      userId: input.userId,
      notificationType: input.notificationType,
      channel: input.channel,
      region: input.region,
      datetime: input.datetime,
      preferenceSource: effectivePreference.source,
      quietHoursTimezone: context.quietHours?.timezone,
      localTime: quietHoursCheck.localTime ?? undefined
    }
  };
}
