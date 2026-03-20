## Notifications — Real-time multi-channel notification system

### Overview

Comprehensive notification center with in-app delivery, user preferences, and RBAC authorization. Supports 26 notification types across 4 priority levels with real-time WebSocket updates and full Arabic/English internationalization.

### File Structure

- `actions.ts` — Server actions (create, mark read, delete, batch, preferences)
- `queries.ts` — Paginated query builders with filters and stats
- `authorization.ts` — 8-role RBAC permission checks
- `validation.ts` — Zod schemas for all inputs
- `config.ts` — Notification types, priorities, channels constants
- `types.ts` — TypeScript type definitions
- `content.tsx` — Server component (main entry)
- `center.tsx` — Notification center (server)
- `notification-center-client.tsx` — Client wrapper
- `bell-icon.tsx` — Bell icon with unread badge (client)
- `card.tsx` — Notification card (client)
- `list.tsx` — Notification list (client)
- `preferences-content.tsx` — Preferences page (server)
- `preferences-form.tsx` — Preferences form (client)
- `use-notifications.ts` — Real-time hooks (WebSocket, optimistic updates)
- `poll-actions.ts` — Polling fallback actions
- `email-service.ts` — Email delivery service
- `index.ts` — Barrel exports

### Status

**Completion:** 85% | **Blockers:** Email delivery (Resend integration pending), push notifications (future), i18n remaining in some client components
