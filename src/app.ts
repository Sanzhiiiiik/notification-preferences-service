import Fastify from 'fastify';
import cors from '@fastify/cors';
import { ZodError } from 'zod';
import { loggerConfig } from './shared/logger.js';
import { preferenceRoutes } from './modules/preferences/http/preferences.routes.js';

export async function buildApp() {
  const app = Fastify({
    logger: loggerConfig
  });

  await app.register(cors, {
    origin: true
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      request.log.warn(
        {
          issues: error.issues
        },
        'Request validation failed'
      );

      return reply.status(400).send({
        error: 'validation_error',
        message: 'Invalid request payload',
        details: error.issues
      });
    }

    request.log.error(error, 'Unhandled request error');

    return reply.status(500).send({
      error: 'internal_server_error',
      message: 'Unexpected server error'
    });
  });

  app.get('/health', async () => {
    return {
      status: 'ok',
      service: 'notification-preferences-service'
    };
  });

  await app.register(preferenceRoutes);

  return app;
}
