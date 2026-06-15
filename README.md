# Notification Preferences Service

A TypeScript + Node.js backend service for managing notification preferences and evaluating whether a notification can be sent to a user.

The service combines default preferences, user-level preference overrides, quiet hours with timezone support, and global policies by notification type, channel and region.

It returns an explicit allow / deny decision with a machine-readable reason code.

## Tech stack

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Kysely
- Zod
- Luxon
- Vitest
- Docker Compose

## Business rules

Evaluation order:

1. Global deny policies are checked first.
2. User preferences override default preferences.
3. If no explicit user preference exists, defaults are used.
4. Quiet hours are evaluated in the user's configured timezone.
5. Quiet hours block non-critical notifications.
6. transactional and security notifications bypass quiet hours.

Reason codes:

- allowed_by_default
- allowed_by_user_preference
- denied_by_default
- denied_by_user_preference
- blocked_by_global_policy
- blocked_by_quiet_hours

## Run with Docker

Requirements:

- Docker
- Docker Compose

Start the service:

    docker compose up -d --build

The API will be available at:

    http://localhost:3000

PostgreSQL is exposed locally on:

    localhost:5433

The app container automatically runs database migration and seed scripts on startup.

Seed data includes:

- user-1
- default preferences
- quiet hours for user-1
- global policy: deny marketing + sms in region EU

Check health:

    curl http://localhost:3000/health

## Run locally without Dockerizing the app

Start PostgreSQL:

    docker compose up -d postgres

Install dependencies:

    npm install

Create .env:

    cp .env.example .env

Run migration and seed:

    npm run db:migrate
    npm run db:seed

Start the API:

    npm run dev

## API examples

### Get user preferences

    curl -s http://localhost:3000/users/user-1/preferences | python3 -m json.tool

### Update user preferences

    curl -X POST http://localhost:3000/users/user-1/preferences \
      -H "Content-Type: application/json" \
      -d '{
        "preferences": [
          {
            "notificationType": "marketing",
            "channel": "email",
            "enabled": false
          }
        ],
        "quietHours": {
          "enabled": true,
          "start": "22:00",
          "end": "08:00",
          "timezone": "Asia/Almaty"
        }
      }'

### Evaluate notification sending

    curl -X POST http://localhost:3000/evaluate \
      -H "Content-Type: application/json" \
      -d '{
        "userId": "user-1",
        "notificationType": "marketing",
        "channel": "sms",
        "region": "EU",
        "datetime": "2026-05-21T21:30:00Z"
      }'

Example response:

    {
      "decision": "deny",
      "reason": "blocked_by_global_policy",
      "details": {
        "userId": "user-1",
        "notificationType": "marketing",
        "channel": "sms",
        "region": "EU",
        "datetime": "2026-05-21T21:30:00Z",
        "matchedPolicyId": 1
      }
    }

## Tests

Run unit tests:

    npm run test

Run integration tests:

    npm run test:integration

Run all tests:

    npm run test:all

Integration tests require PostgreSQL to be running:

    docker compose up -d postgres
    npm run db:migrate
    npm run db:seed
    npm run test:integration

## Project structure

    src/
      config/
        env.ts

      shared/
        db/
          database.types.ts
          kysely.ts
          migrate.ts
          seed.ts
          reset.ts
        logger.ts

      modules/
        preferences/
          domain/
            types.ts
            preference-resolver.ts
            quiet-hours.ts
            policy-matcher.ts
            evaluator.ts

          application/
            get-user-preferences.ts
            update-user-preferences.ts
            evaluate-notification.ts

          infrastructure/
            preference.repository.ts

          http/
            schemas.ts
            preferences.routes.ts

The domain layer is independent from HTTP and PostgreSQL.
The application layer coordinates use-cases.
The infrastructure layer handles persistence.
The HTTP layer handles validation and routing.

## Production improvements

This is an assessment implementation focused on domain modeling, API design, persistence and tests.

For production, I would add:

- authentication and authorization;
- admin API for managing global policies;
- audit log for preference changes;
- Prometheus metrics;
- request tracing;
- rate limiting;
- CI/CD pipeline;
- database migration tool with versioned migrations;
- separate test database;
- stricter idempotency using Idempotency-Key;
- policy conflict resolution strategy for allow/deny combinations;
- OpenAPI documentation.
