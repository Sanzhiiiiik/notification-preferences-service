import { evaluateNotification } from './evaluator.js';
import type { EvaluationContext } from './types.js';

const context: EvaluationContext = {
  defaultPreferences: [
    {
      notificationType: 'transactional',
      channel: 'email',
      enabled: true
    },
    {
      notificationType: 'marketing',
      channel: 'email',
      enabled: false
    },
    {
      notificationType: 'marketing',
      channel: 'push',
      enabled: true
    },
    {
      notificationType: 'marketing',
      channel: 'sms',
      enabled: true
    }
  ],
  userPreferences: [
    {
      userId: 'user-1',
      notificationType: 'marketing',
      channel: 'email',
      enabled: false
    }
  ],
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '08:00',
    timezone: 'Asia/Almaty'
  },
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
  ]
};

console.log(
  evaluateNotification(
    {
      userId: 'user-1',
      notificationType: 'marketing',
      channel: 'sms',
      region: 'EU',
      datetime: '2026-05-21T21:30:00Z'
    },
    context
  )
);

console.log(
  evaluateNotification(
    {
      userId: 'user-1',
      notificationType: 'marketing',
      channel: 'push',
      region: 'KZ',
      datetime: '2026-05-21T21:30:00Z'
    },
    context
  )
);

console.log(
  evaluateNotification(
    {
      userId: 'user-1',
      notificationType: 'transactional',
      channel: 'email',
      region: 'KZ',
      datetime: '2026-05-21T21:30:00Z'
    },
    context
  )
);
