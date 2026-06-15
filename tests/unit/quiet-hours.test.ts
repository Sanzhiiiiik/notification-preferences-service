import { describe, expect, it } from 'vitest';
import { checkQuietHours } from '../../src/modules/preferences/domain/quiet-hours.js';

describe('quiet hours', () => {
  it('detects time inside overnight quiet hours', () => {
    const result = checkQuietHours({
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Asia/Almaty'
      },
      datetime: '2026-05-21T21:30:00Z'
    });

    expect(result.isWithinQuietHours).toBe(true);
    expect(result.localTime).toBe('02:30');
  });

  it('detects time outside overnight quiet hours', () => {
    const result = checkQuietHours({
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Asia/Almaty'
      },
      datetime: '2026-05-21T10:00:00Z'
    });

    expect(result.isWithinQuietHours).toBe(false);
    expect(result.localTime).toBe('15:00');
  });

  it('returns false when quiet hours are disabled', () => {
    const result = checkQuietHours({
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
        timezone: 'Asia/Almaty'
      },
      datetime: '2026-05-21T21:30:00Z'
    });

    expect(result.isWithinQuietHours).toBe(false);
    expect(result.localTime).toBe(null);
  });
});
