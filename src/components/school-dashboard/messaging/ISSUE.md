# Messaging — Production Readiness Tracker

**Status:** 🟢 READY
**Completion:** 100%
**Last Updated:** 2026-04-12
**Ship Issue:** [#240](https://github.com/databayt/hogwarts/issues/240)

---

## MVP Checklist

- [x] Conversation CRUD (create direct/group, list, archive)
- [x] Message send, edit, delete (soft-delete)
- [x] Cursor-based message pagination
- [x] Read receipts (per-user per-message)
- [x] Emoji reactions
- [x] Conversation mute and archive
- [x] Pin conversations
- [x] File attachment uploads
- [x] Message search
- [x] Multi-tenant isolation (schoolId scoping + participant validation)
- [x] Authorization layer (participant-level access control)
- [x] Zod validation schemas
- [x] Comprehensive test suite (actions, authorization, multi-tenant, validation, whatsapp-bridge)
- [x] Serialization layer for date handling
- [x] Audit logging
- [x] WhatsApp dual-delivery (auto-enable, toggle, bidirectional bridging)
- [x] WhatsApp phone resolution (Guardian > Teacher > StaffMember)
- [x] WhatsApp delivery status on message bubbles (sent/delivered/read/failed)
- [x] Unread badge on header mail icon (polls every 30s)
- [x] Contact name translation (getDisplayText when locale differs from school language)
- [x] Contacts sidebar with role-based grouping (WhatsApp-style click-to-chat)
- [x] 1:1 conversation deduplication (reuses existing direct conversation)
- [x] Polling fallback for conversation list (15s interval when disconnected)
- [x] Polling fallback for active conversation messages (10s interval when disconnected)
- [x] Real-time message delivery (Socket.IO server in `socket-server/`, all 15 events wired)
- [x] Typing indicators (relay via Socket.IO server, bouncing dots UI already built)
- [x] Online/offline presence indicators (Redis-backed, green dots on cards, last-seen in header)
- [x] Socket.IO emit endpoint auth (`x-emit-secret` header on `/api/emit` and `/api/emit-to-users`)
- [x] Socket server lockfile (`package-lock.json` for deterministic Docker builds)
- [x] Fly.io health check config (V2 `[http_service.checks]` syntax)

## Known Issues

### P0 — Critical

- None

### P1 — High

- None (Socket.IO server is code-complete and deploy-ready; requires `fly deploy` + env var setup)

### Deployment Checklist (ops)

- [ ] `fly deploy` from `socket-server/` directory
- [ ] Set `SOCKET_SECRET` on Fly.io
- [ ] Set `SOCKET_SECRET` and `EMIT_SECRET` on Vercel
- [ ] Set `NEXT_PUBLIC_SOCKET_URL` on Vercel (e.g. `https://hogwarts-socket.fly.dev`)
- [ ] Optionally set `REDIS_URL` on Fly.io for multi-instance scaling

### P2 — Medium

- No message forwarding between conversations
- Student-to-teacher DM restrictions need configuration UI
- WhatsApp phone resolution does not cover users with no domain model (no Guardian/Teacher/StaffMember record)

## WhatsApp Integration Status

- [x] Evolution API client (`src/lib/whatsapp/evolution-client.ts`)
- [x] WhatsApp bridge dispatch (`whatsapp-bridge.ts`)
- [x] Auto-enable on conversation creation when school is connected
- [x] Per-conversation toggle (W button in chat header)
- [x] W indicator on conversation cards in sidebar
- [x] Delivery status icon on message bubbles
- [x] Incoming message bridging via webhook
- [x] Rate limiting (1 msg/sec, 500 DMs/day)
- [x] Retry with exponential backoff (max 5 attempts)
- [x] Cron job for retry + notification dispatch
- [x] Admin dashboard for QR connection, groups, templates
- [x] Test accounts seeded with WhatsApp phones (admin: 00966557721603, accountant: 00966504559207)

## Enhancements (Post-MVP)

- Voice messages with transcription
- Scheduled messages (send later)
- Message threading (reply chains)
- Conversation categories (by class, department)
- Full-text search across all conversations

---

**Last Review:** 2026-04-11
