import { describe, expect, it } from 'vitest';
import { evaluateNotification } from '../../src/modules/preferences/domain/evaluator.js';
import type { EvaluationContext } from '../../src/modules/preferences/domain/types.js';

const baseContext: EvaluationContext = {
  defaultPreferences: [
    {
      notificationType: 'transactional',
      channel: 'email',
      enabled: true
    },
    {
      notificationType: 'marketing',
      channel: 'email',
      enabled: true
    },
    {
      notificationType: 'marketing',
      channel: 'sms',
      enabled: true
    },
    {
      notificationType: 'marketing',
      channel: 'push',
      enabled: true
    }
  ],
  userPreferences: [],
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Asia/Almaty'
  },
  globalPolicies: []
};

describe('notification evaluator', () => {
  it('allows notification by default preference', () => {
    const result = evaluateNotification(
      {
        userId: 'user-1',
        notificationType: 'marketing',
        channel: 'email',
        region: 'KZ',
        datetime: '2026-05-21T10:00:00Z'
      },
      baseContext
    );

    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('allowed_by_default');
  });

  it('denies by user preference', () => {
    const result = evaluateNotification(
      {
        userId: 'user-1',
        notificationType: 'marketing',
        channel: 'email',
        region: 'KZ',
        datetime: '2026-05-21T10:00:00Z'
      },
      {
        ...baseContext,
        userPreferences: [
          {
            userId: 'user-1',
            notificationType: 'marketing',
            channel: 'email',
            enabled: false
          }
        ]
      }
    );

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('denied_by_user_preference');
  });

  it('denies by global policy before user preference', () => {
    const result = evaluateNotification(
      {
        userId: 'user-1',
        notificationType: 'marketing',
        channel: 'sms',
        region: 'EU',
        datetime: '2026-05-21T10:00:00Z'
      },
      {
        ...baseContext,
        globalPolicies: [
          {
            id: 1,
            notificationType: 'marketing',
            channel: 'sms',
            region: 'EU',
            effect: 'deny',
            reasonCode: 'blocked_by_global_policy',
            enabled: true
          }
        ],
        userPreferences: [
          {
            userId: 'user-1',
            notificationType: 'marketing',
            channel: 'sms',
            enabled: true
          }
        ]
      }
    );

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('blocked_by_global_policy');
  });

  it('denies marketing notification during quiet hours', () => {
    const result = evaluateNotification(
      {
        userId: 'user-1',
        notificationType: 'marketing',
        channel: 'push',
        region: 'KZ',
        datetime: '2026-05-21T21:30:00Z'
      },
      baseContext
    );

    expect(result.decision).toBe('deny');
    expect(result.reason).toBe('blocked_by_quiet_hours');
    expect(result.details.localTime).toBe('02:30');
  });

  it('allows transactional notification during quiet hours', () => {
    const result = evaluateNotification(
      {
        userId: 'user-1',
        notificationType: 'transactional',
        channel: 'email',
        region: 'KZ',
        datetime: '2026-05-21T21:30:00Z'
      },
      baseContext
    );

    expect(result.decision).toBe('allow');
    expect(result.reason).toBe('allowed_by_default');
  });
});
