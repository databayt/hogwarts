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
- `content.tsx` — Server component (main entry, runs `getDisplayText` for cross-lang content)
- `center.tsx` — Notification center (client, tabs/filters/groupings)
- `notification-center-client.tsx` — Client wrapper that wires server actions
- `bell-icon.tsx` — Bell icon with unread badge (client, polling + WebSocket)
- `card.tsx` — Notification card (client)
- `list.tsx` — Notification list (client, virtualized scroll)
- `mark-all-read-button.tsx` — Layout-level CTA (client)
- `preferences-content.tsx` — Preferences page (server)
- `preferences-form.tsx` — Preferences form (client, per-type/per-channel switches + quiet hours + digest)
- `use-notifications.ts` — Real-time hooks (WebSocket, optimistic updates, polling fallback)
- `poll-actions.ts` — Polling fallback server action
- `email-service.ts` — Resend-based email delivery + batch processor
- `index.ts` — Barrel exports

### Tests

**254 / 254 passing** across 9 files (`__tests__/`):

- `authorization.test.ts` (57) — per-role permission matrix
- `rbac-matrix.test.ts` (34) — exhaustive UserRole × NotificationType drift guard
- `actions.test.ts` (18) — every server action incl. `$transaction` mock
- `queries.test.ts` (36) — query builders, pagination, stats, subscriptions
- `validation.test.ts` (52) — full Zod surface incl. all 24 types and 5 channels
- `config.test.ts` (26) — config completeness vs Prisma enum
- `dispatch-notification.test.ts` (16) — system-level dispatch + audience targeting
- `edge-cases.test.ts` (10) — expiration derivation, tenant isolation, quiet hours
- `poll-actions.test.ts` (5) — session/tenant guards, translation, date serialization

### Status

**Completion:** 90% | **Done:** Resend email delivery, batch processing, RBAC, real-time hooks, full i18n, quiet hours, digest preferences, 254 tests
**Remaining:** Push notifications (channel reserved, no provider), SMS (channel reserved, no provider), WhatsApp (channel reserved, Evolution API not wired)
