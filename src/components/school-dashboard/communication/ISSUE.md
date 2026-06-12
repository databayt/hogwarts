---
epic: 06
sprint: Q3-2026
title: Communication
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 80
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

# Communication — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 40%
**Last Updated:** 2026-06-12

> **Note (2026-06-12):** this dir (`communication/`) is the legacy mock-only
> hub. The REAL broadcast feature lives in `school/communication/broadcast/`
> (`sendBroadcast` → `NotificationBatch` → `processNotificationBatch`), and
> **scheduled broadcasts now actually fire**: the new
> `/api/cron/process-broadcast-batches` (\*/5) sweeps pending batches whose
> `scheduledFor` has arrived — previously they stayed `pending` forever.

---

## MVP Checklist

- [x] Communication hub UI (conversations, threads, file attachments)
- [x] Route pages (hub, broadcast, templates, settings)
- [x] Multi-channel UI (email, SMS, in-app)
- [x] Server actions for sending broadcasts — in `school/communication/broadcast/actions.ts` (immediate + scheduled via cron sweep, 2026-06-12)
- [ ] Server actions for managing templates
- [ ] Database queries (currently UI-only, no backend wiring)
- [ ] Authorization layer (RBAC for communication permissions)
- [ ] Notification delivery integration (email/SMS providers)
- [ ] Template variable substitution engine

## Known Issues

### P0 — Critical

- Hub component is a single monolithic client file -- no server actions or database queries exist
- All data appears to be mock/client-side only

### P1 — High

- No actions.ts, queries.ts, or authorization.ts files
- Broadcast delivery not connected to email/SMS providers
- Settings page has no backend persistence

### P2 — Medium

- Component needs decomposition (hub.tsx is very large)
- File attachment uploads need server-side handling

## Enhancements (Post-MVP)

- Scheduled broadcasts (send later)
- Audience segmentation (by grade, class, role)
- Read receipt tracking for announcements
- Multi-language template support
- Communication audit log

---

**Last Review:** 2026-03-19
