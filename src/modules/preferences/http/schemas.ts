import { z } from 'zod';
import { channels, notificationTypes, regions } from '../domain/types.js';

export const userParamsSchema = z.object({
  id: z.string().min(1)
});

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/, 'Expected HH:mm or HH:mm:ss');

export const quietHoursSchema = z.object({
  enabled: z.boolean(),
  start: timeSchema,
  end: timeSchema,
  timezone: z.string().min(1)
});

export const preferenceUpdateSchema = z.object({
  notificationType: z.enum(notificationTypes),
  channel: z.enum(channels),
  enabled: z.boolean()
});

export const updatePreferencesBodySchema = z
  .object({
    preferences: z.array(preferenceUpdateSchema).optional(),
    quietHours: quietHoursSchema.optional()
  })
  .refine((body) => body.preferences !== undefined || body.quietHours !== undefined, {
    message: 'At least one of preferences or quietHours must be provided'
  });

export const evaluateBodySchema = z.object({
  userId: z.string().min(1),
  notificationType: z.enum(notificationTypes),
  channel: z.enum(channels),
  region: z.enum(regions),
  datetime: z.string().datetime()
});
