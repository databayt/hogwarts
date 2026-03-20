# Communication — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 40%
**Last Updated:** 2026-03-19

---

## MVP Checklist

- [x] Communication hub UI (conversations, threads, file attachments)
- [x] Route pages (hub, broadcast, templates, settings)
- [x] Multi-channel UI (email, SMS, in-app)
- [ ] Server actions for sending broadcasts
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
