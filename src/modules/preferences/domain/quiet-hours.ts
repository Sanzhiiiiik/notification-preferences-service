import { DateTime } from 'luxon';
import type { QuietHours } from './types.js';

export interface QuietHoursCheckResult {
  isWithinQuietHours: boolean;
  localTime: string | null;
}

function parseTimeToMinutes(value: string): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/.exec(value);

  if (!match) {
    throw new Error(`Invalid time format: ${value}. Expected HH:mm or HH:mm:ss.`);
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  return hours * 60 + minutes;
}

function isMinuteWithinRange(params: {
  currentMinute: number;
  startMinute: number;
  endMinute: number;
}): boolean {
  const { currentMinute, startMinute, endMinute } = params;

  if (startMinute === endMinute) {
    return false;
  }

  if (startMinute < endMinute) {
    return currentMinute >= startMinute && currentMinute < endMinute;
  }

  return currentMinute >= startMinute || currentMinute < endMinute;
}

export function checkQuietHours(params: {
  quietHours: QuietHours | null;
  datetime: string;
}): QuietHoursCheckResult {
  const { quietHours, datetime } = params;

  if (!quietHours?.enabled) {
    return {
      isWithinQuietHours: false,
      localTime: null
    };
  }

  const localDateTime = DateTime.fromISO(datetime, {
    setZone: true
  }).setZone(quietHours.timezone);

  if (!localDateTime.isValid) {
    throw new Error(`Invalid datetime or timezone: ${localDateTime.invalidExplanation ?? datetime}`);
  }

  const currentMinute = localDateTime.hour * 60 + localDateTime.minute;
  const startMinute = parseTimeToMinutes(quietHours.start);
  const endMinute = parseTimeToMinutes(quietHours.end);

  return {
    isWithinQuietHours: isMinuteWithinRange({
      currentMinute,
      startMinute,
      endMinute
    }),
    localTime: localDateTime.toFormat('HH:mm')
  };
}
