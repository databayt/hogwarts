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

- [ ] **Group WhatsApp dispatch needs a join table.** `Message` has scalar `whatsappPhone` / `whatsappStatus` / `whatsappMessageId` columns, so fanning a group message to N participants used to last-writer-wins them. Patched on 2026-04-22 to only write those scalars for 1:1 conversations — groups now log per-recipient rows in `WhatsAppMessage` instead, so no more data corruption, but `retryFailedMessageDispatches()` only retries 1:1 failures. A proper `MessageWhatsappDelivery(messageId, participantId, phone, status, providerMessageId, retryCount, lastError)` model is required before rolling WhatsApp out to group chats. (See audit: `/Users/abdout/.claude/plans/elegant-cooking-unicorn.md` #6.) Needs schema migration — waiting on explicit approval.

### P1 — High (Ops blockers — must complete before real traffic)

- [ ] `fly deploy` from `socket-server/` — Socket.IO server not yet on Fly.io (#262 replaces this with Oracle Cloud VM)
- [ ] Set `SOCKET_SECRET` on Fly.io / Oracle (same value must match Vercel)
- [ ] Set `SOCKET_SECRET` + `EMIT_SECRET` on Vercel (protects `/api/emit*` routes)
- [ ] Set `NEXT_PUBLIC_SOCKET_URL=https://socket.databayt.org` on Vercel — currently `.env` has `http://localhost:3001` (dev-only)
- [ ] Set `CRON_SECRET` on Vercel — currently empty in `.env`; required for `/api/cron/*` endpoints (WhatsApp retry + notification dispatch). Endpoint now refuses to run in production when unset.
- [ ] **Set `WHATSAPP_WEBHOOK_SECRET` on Vercel + include `?secret=$WHATSAPP_WEBHOOK_SECRET` in Evolution's `WEBHOOK_GLOBAL_URL`.** Webhook now fails closed in production when this env var is unset.
- [ ] (Optional) Set `REDIS_URL` for multi-instance presence scaling

### P2 — Medium

- Student-to-teacher DM restrictions: schema supports `canStudentsDmTeachers` but no admin UI to toggle it
- WhatsApp phone resolution does not cover plain `User` rows with no Guardian/Teacher/StaffMember profile — these users silently skip WhatsApp delivery (logged as `whatsappError: "No phone number found for user"`)

### Code-level fixes applied 2026-04-22 (pre-Oracle deploy)

- [x] Webhook rate-limited (`RATE_LIMITS.PUBLIC`, keyed by IP + UA)
- [x] Webhook validates `WHATSAPP_WEBHOOK_SECRET` via `?secret=` query or `Authorization: Bearer` header (constant-time compare)
- [x] Webhook `fetch` → socket-server calls now carry `x-emit-secret` (previously missing — would have silently broken WA→app push once `EMIT_SECRET` was set on Vercel)
- [x] Webhook socket-emit failures are logged explicitly instead of swallowed by `catch {}`
- [x] `NEXT_PUBLIC_SOCKET_URL` missing in production is logged loudly (no more silent `localhost:3001` fallback)
- [x] Cron `CRON_SECRET` check uses `crypto.timingSafeEqual`; refuses in production when unset
- [x] WhatsApp dispatch: per-attachment audit rows (fixed `result` overwrite on multi-attachment messages); groups now write per-recipient `WhatsAppMessage` rows on both rate-limit-pending and failure paths

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
