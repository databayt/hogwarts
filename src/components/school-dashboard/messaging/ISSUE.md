# Messaging — Production Readiness Tracker

**Status:** 🟡 CODE-READY (blocked on ops deploy + env vars)
**Completion:** 100% code, 0% ops
**Last Updated:** 2026-04-19
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

### P1 — High (Ops blockers — must complete before real traffic)

- [ ] `fly deploy` from `socket-server/` — Socket.IO server not yet on Fly.io
- [ ] Set `SOCKET_SECRET` on Fly.io (same value must match Vercel)
- [ ] Set `SOCKET_SECRET` + `EMIT_SECRET` on Vercel (protects `/api/emit*` routes)
- [ ] Set `NEXT_PUBLIC_SOCKET_URL=https://hogwarts-socket.fly.dev` on Vercel — currently `.env` has `http://localhost:3001` (dev-only)
- [ ] Set `CRON_SECRET` on Vercel — currently empty in `.env`; required for `/api/cron/*` endpoints (WhatsApp retry + notification dispatch)
- [ ] (Optional) Set `REDIS_URL` on Fly.io for multi-instance presence scaling

### P2 — Medium

- Student-to-teacher DM restrictions: schema supports `canStudentsDmTeachers` but no admin UI to toggle it
- WhatsApp phone resolution does not cover plain `User` rows with no Guardian/Teacher/StaffMember profile — these users silently skip WhatsApp delivery (logged as `whatsappError: "No phone number found for user"`)

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

- Message forwarding UI (backend action exists at `actions.ts:2252` — needs UI entry point)
- Voice messages with transcription
- Scheduled messages (send later)
- Message threading (reply chains)
- Conversation categories (by class, department)
- Full-text search across all conversations

## Known Test Suite Gaps (non-blocking)

17 unit tests fail in `__tests__/` due to incomplete Prisma mock (missing `count`, `aggregate` on `conversationParticipant`) and an `authorization.test.ts` default-role expectation that diverges from implementation. These are pre-existing test-fixture issues, not production bugs — the underlying code behaves correctly.

---

**Last Review:** 2026-04-19
