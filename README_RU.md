# Notification Preferences Service

Backend-сервис на TypeScript + Node.js для управления предпочтениями уведомлений и проверки, можно ли отправить конкретное уведомление пользователю.

Сервис учитывает дефолтные настройки, индивидуальные настройки пользователя, quiet hours с поддержкой таймзоны и глобальные политики по типу уведомления, каналу и региону.

На выходе сервис возвращает явное решение allow / deny и машинно-читаемую причину.

## Стек

- Node.js
- TypeScript
- Fastify
- PostgreSQL
- Kysely
- Zod
- Luxon
- Vitest
- Docker Compose

## Бизнес-правила

Порядок проверки:

1. Сначала проверяются глобальные deny-политики.
2. Индивидуальные настройки пользователя имеют приоритет над дефолтными настройками.
3. Если индивидуальной настройки нет, используются дефолтные настройки.
4. Quiet hours проверяются в таймзоне пользователя.
5. Quiet hours блокируют некритичные уведомления.
6. transactional и security уведомления обходят quiet hours.

Коды причин:

- allowed_by_default
- allowed_by_user_preference
- denied_by_default
- denied_by_user_preference
- blocked_by_global_policy
- blocked_by_quiet_hours

## Запуск через Docker

Требования:

- Docker
- Docker Compose

Запуск сервиса:

    docker compose up -d --build

API будет доступен по адресу:

    http://localhost:3000

PostgreSQL будет доступен локально на порту:

    localhost:5433

При старте app-контейнер автоматически запускает миграции и seed-данные.

Seed-данные включают:

- user-1
- дефолтные настройки уведомлений
- quiet hours для user-1
- глобальную политику: запрет marketing + sms в регионе EU

Проверка health endpoint:

    curl http://localhost:3000/health

## Локальный запуск без Docker-контейнера для app

Запустить PostgreSQL:

    docker compose up -d postgres

Установить зависимости:

    npm install

Создать .env:

    cp .env.example .env

Запустить миграции и seed:

    npm run db:migrate
    npm run db:seed

Запустить API:

    npm run dev

## Примеры API

### Получить настройки пользователя

    curl -s http://localhost:3000/users/user-1/preferences | python3 -m json.tool

### Изменить настройки пользователя

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

### Проверить возможность отправки уведомления

    curl -X POST http://localhost:3000/evaluate \
      -H "Content-Type: application/json" \
      -d '{
        "userId": "user-1",
        "notificationType": "marketing",
        "channel": "sms",
        "region": "EU",
        "datetime": "2026-05-21T21:30:00Z"
      }'

Пример ответа:

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

## Тесты

Запуск unit-тестов:

    npm run test

Запуск integration-тестов:

    npm run test:integration

Запуск всех тестов:

    npm run test:all

Для integration-тестов должен быть запущен PostgreSQL:

    docker compose up -d postgres
    npm run db:migrate
    npm run db:seed
    npm run test:integration

## Структура проекта

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

Domain layer не зависит от HTTP и PostgreSQL.
Application layer координирует use-cases.
Infrastructure layer отвечает за работу с БД.
HTTP layer отвечает за валидацию и маршруты.

## Что можно добавить для production

Это assessment-реализация, сфокусированная на доменной модели, API, хранении данных и тестах.

Для production я бы добавил:

- authentication и authorization;
- admin API для управления глобальными политиками;
- audit log для изменений пользовательских настроек;
- Prometheus metrics;
- request tracing;
- rate limiting;
- CI/CD pipeline;
- версионированные миграции БД;
- отдельную test database;
- строгую идемпотентность через Idempotency-Key;
- стратегию разрешения конфликтов между allow/deny политиками;
- OpenAPI-документацию.
