---
epic: 06
sprint: Q3-2026
title: Notifications
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 85
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

## Notifications — Real-time multi-channel notification system

### Overview

Comprehensive notification center with in-app delivery, user preferences, and RBAC authorization. Supports **24 notification types** across 4 priority levels with real-time WebSocket updates and full Arabic/English internationalization. Email delivery via Resend is wired up; SMS, Push, and WhatsApp channels are reserved (config flag `enabled: false`).

### Routes

| Route                               | Component                 | Purpose                      |
| ----------------------------------- | ------------------------- | ---------------------------- |
| `/[lang]/notifications`             | `content.tsx`             | Notification center (all)    |
| `/[lang]/notifications/unread`      | `content.tsx` (filtered)  | Unread-only view             |
| `/[lang]/notifications/preferences` | `preferences-content.tsx` | Per-type/channel preferences |

### File Structure

- `actions.ts` — Server actions (create, mark read, delete, batch, preferences, subscribe)
- `queries.ts` — Paginated query builders, cursor pagination, stats, quiet-hours check
- `authorization.ts` — 8-role RBAC permission checks; `getAllowedNotificationTypes` derives privileged list from `Object.values(NotificationType)` to avoid enum drift
- `validation.ts` — Zod schemas for all inputs (24 types, 5 channels, quiet-hours/digest pairing rules)
- `config.ts` — `NOTIFICATION_TYPE_CONFIG`, `PRIORITY_CONFIG`, `CHANNEL_CONFIG`, `NOTIFICATION_EXPIRATION`, `DEFAULT_NOTIFICATION_PREFERENCES`, `NOTIFICATION_FILTER_TYPES`
- `types.ts` — TypeScript type definitions (DTO, filters, stats, socket events)
- `content.tsx` — Server component (main entry, batched `localize` for cross-lang content)
- `notification-center-client.tsx` — Client wrapper that wires server actions
- `bell-icon.tsx` — Bell icon with unread badge (client, polling + WebSocket)
- `card.tsx` — Notification card (client)
- `list.tsx` — Notification list (client, virtualized scroll)
- `mark-all-read-button.tsx` — Layout-level CTA (client)
- `preferences-content.tsx` — Preferences page (server)
- `preferences-form.tsx` — Preferences form (client, per-type/per-channel switches + quiet hours + digest)
- `use-notifications.ts` — Real-time hooks (WebSocket, optimistic updates, visibility-aware polling fallback, shared in-flight dedupe across instances)
- `poll-actions.ts` — Bell polling logic (`server-only`; served to clients via `GET /api/notifications/bell` — deliberately NOT a client-callable action, since `auth()` cookie rotation makes every action response ship a full RSC page re-render)
- `poll-merge.ts` — Pure merge of polled snapshots into the in-memory list (forward-only read-state sync)
- `email-service.ts` — Resend-based email delivery + batch processor
- `index.ts` — Barrel exports

Route handler: `src/app/api/notifications/bell/route.ts` (GET, ~2 KB JSON per poll).

### Tests

**287 / 287 passing** across 12 files (`src/tests/school-dashboard/notifications/` — the `__tests__/` convention is retired):

- `authorization.test.ts` (57) — per-role permission matrix
- `rbac-matrix.test.ts` (34) — exhaustive UserRole × NotificationType drift guard
- `actions.test.ts` (18) — every server action incl. `$transaction` mock
- `queries.test.ts` (36) — query builders, pagination, stats, subscriptions
- `validation.test.ts` (52) — full Zod surface incl. all 24 types and 5 channels
- `config.test.ts` (26) — config completeness vs Prisma enum
- `dispatch-notification.test.ts` (22) + `dispatch-notification-bugs.test.ts` (16) — system-level dispatch + audience targeting
- `batch-sweep.test.ts` (5) — scheduled/stuck broadcast batch sweep
- `edge-cases.test.ts` (10) — expiration derivation, tenant isolation, quiet hours
- `poll-actions.test.ts` (5) — session/tenant guards, translation, date serialization
- `poll-merge.test.ts` (6) — forward-only read sync, fresh-item prepend, reference stability

### Status

**Completion:** 92% | **Done:** Resend email delivery, batch processing, RBAC, real-time hooks, full i18n, quiet hours, digest preferences, 287 tests; 2026-07-20: legacy English seed rows purge (self-healing), script-detected `lang` at dispatch, card type-label kicker + priority badge + locale-aware click-through; 2026-08-11: production bell restored (dead since 07-19 — connected-state now read from `socketService.isConnected()`, never from `connect()` resolving) + polling engine optimized (GET route instead of server action ≈ 2 KB vs full-page RSC per poll, visibility-aware pause, shared in-flight dedupe, session-primitive effect deps, forward-only read-state merge)
**Remaining:** Push notifications (channel reserved, no provider), SMS (channel reserved, no provider), WhatsApp (channel reserved, Evolution API not wired), socket-server #262 deployment
**Prod verification owed:** the dev environment cannot exercise the prod no-socket short-circuit — confirm the bell polls + populates on the next deploy via `/watch`

### Agents & Skills

- `agent:nextjs` — Socket.io + webhook routes
- `agent:react` — messaging surface
- `agent:comment` — copy + i18n strings
- `skill:/wire` — UI layer sweep
- `skill:/check` — quality gate
