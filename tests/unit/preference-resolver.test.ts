import { describe, expect, it } from 'vitest';
import { resolveEffectivePreferences } from '../../src/modules/preferences/domain/preference-resolver.js';

describe('preference resolver', () => {
  it('uses default preferences for a new user', () => {
    const result = resolveEffectivePreferences({
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
        }
      ],
      userPreferences: []
    });

    expect(result).toEqual([
      {
        notificationType: 'marketing',
        channel: 'email',
        enabled: false,
        source: 'default'
      },
      {
        notificationType: 'transactional',
        channel: 'email',
        enabled: true,
        source: 'default'
      }
    ]);
  });

  it('user preference overrides default preference', () => {
    const result = resolveEffectivePreferences({
      defaultPreferences: [
        {
          notificationType: 'marketing',
          channel: 'email',
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
      ]
    });

    expect(result).toEqual([
      {
        notificationType: 'marketing',
        channel: 'email',
        enabled: false,
        source: 'user'
      }
    ]);
  });
});
