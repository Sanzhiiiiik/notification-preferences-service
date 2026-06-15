import type { FastifyServerOptions } from 'fastify';
import { env } from '../config/env.js';

export const loggerConfig: FastifyServerOptions['logger'] = {
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard'
          }
        }
      : undefined
};
