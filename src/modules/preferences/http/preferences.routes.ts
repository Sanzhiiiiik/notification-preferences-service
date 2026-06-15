import type { FastifyInstance } from 'fastify';
import { EvaluateNotificationUseCase } from '../application/evaluate-notification.js';
import { GetUserPreferencesUseCase } from '../application/get-user-preferences.js';
import { UpdateUserPreferencesUseCase } from '../application/update-user-preferences.js';
import {
  evaluateBodySchema,
  updatePreferencesBodySchema,
  userParamsSchema
} from './schemas.js';

export async function preferenceRoutes(app: FastifyInstance) {
  const getUserPreferences = new GetUserPreferencesUseCase();
  const updateUserPreferences = new UpdateUserPreferencesUseCase();
  const evaluateNotification = new EvaluateNotificationUseCase();

  app.get('/users/:id/preferences', async (request) => {
    const params = userParamsSchema.parse(request.params);

    const result = await getUserPreferences.execute(params.id);

    request.log.info(
      {
        userId: params.id
      },
      'User preferences fetched'
    );

    return result;
  });

  app.post('/users/:id/preferences', async (request) => {
    const params = userParamsSchema.parse(request.params);
    const body = updatePreferencesBodySchema.parse(request.body);

    const result = await updateUserPreferences.execute({
      userId: params.id,
      preferences: body.preferences,
      quietHours: body.quietHours
    });

    request.log.info(
      {
        userId: params.id,
        preferencesUpdated: body.preferences?.length ?? 0,
        quietHoursUpdated: body.quietHours !== undefined
      },
      'User preferences updated'
    );

    return result;
  });

  app.post('/evaluate', async (request) => {
    const body = evaluateBodySchema.parse(request.body);

    const result = await evaluateNotification.execute(body);

    request.log.info(
      {
        userId: body.userId,
        notificationType: body.notificationType,
        channel: body.channel,
        region: body.region,
        decision: result.decision,
        reason: result.reason
      },
      'Notification evaluated'
    );

    return result;
  });
}
