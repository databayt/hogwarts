---
epic: 06
sprint: Q3-2026
title: Notifications
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

# Notifications Block

## Context

Real-time multi-channel notification system. 24 types × 4 priorities × 5 channels (in_app + email live, push/sms/whatsapp reserved). Used by every other block via `dispatchNotification` / `dispatchNotificationsToAudience` from `@/lib/dispatch-notification`.

## Before You Start

1. Read `README.md` — file inventory, routes, test counts
2. Check `__tests__/` — 254 tests, all green; if you change behavior, the relevant test must change too

## Key Decisions

- **Enum drift guard**: `getAllowedNotificationTypes("DEVELOPER" | "ADMIN")` returns `Object.values(NotificationType)` rather than a hardcoded list. The previous hardcoded list silently drifted from Prisma (missed `setup_guide`, `absence_intention*`). Don't reintroduce the static list.
- **Role allow-lists**: TEACHER / ACCOUNTANT / STAFF have explicit allow-lists in `ROLE_SEND_TYPES` (authorization.ts). Add new role-restricted types here.
- **`db.$transaction` for preferences**: `updateNotificationPreferences` upserts inside a transaction so partial failures don't leave the user with a half-updated preference set. Test mocks must include a callable `$transaction`.
- **`getText` for cross-language reads**: notifications are stored in one language (`lang` field). The notification center and bell-icon translate on-demand to the viewer's locale via `getText`. Translations are cached in `Translation`.
- **`lang` is detected, never assumed**: `dispatchNotification` / `dispatchNotificationsToAudience` store `params.lang ?? detectScript(title + body)`. A mislabeled `lang` permanently breaks localization for the row (translator no-ops when contentLang === displayLang) — this is exactly how the legacy English seed rows became untranslatable. Don't reintroduce a hardcoded `"ar"` default.
- **Single source for notification types**: `NOTIFICATION_TYPE_CONFIG`, `NOTIFICATION_EXPIRATION`, validation enum, dictionary key sets — all must list the same 24 types. `config.test.ts` and `rbac-matrix.test.ts` enforce this.

## Danger Zones

- Adding a new `NotificationType` to Prisma without updating: `NOTIFICATION_TYPE_CONFIG`, `NOTIFICATION_EXPIRATION`, `ROLE_SEND_TYPES` (if role-restricted), `dictionaries/{en,ar}/notifications.json` `types` map, `email-service.ts > typeLabels`. Tests fail loudly on the first three; the dictionary and email-service drift silently — review them by hand.
- Adding a new `NotificationChannel` to Prisma without updating: `CHANNEL_CONFIG`, `DEFAULT_NOTIFICATION_PREFERENCES` (every role), `preferences-form.tsx` channel grid, `dictionaries/{en,ar}/notifications.json > channels`.
- Cross-tenant leak: every server action calls `getTenantContext()` and includes `schoolId` in every where clause. Don't accept `schoolId` from client input — always read from the tenant context.
- WebSocket optimistic updates: `useNotifications` updates UI before the server action returns and rolls back on failure. Don't add a third update path that bypasses the rollback.

## Related Blocks

- `src/lib/dispatch-notification.ts` — system-level dispatch used by every other block (assignments, fees, attendance, exams, etc.)
- `email-service.ts` — Resend integration; cron processes `db.notification` rows where `emailSent: false` and `channels has "email"`
- `auth/` — session provides `userId` + `role`; tenant context provides `schoolId`
