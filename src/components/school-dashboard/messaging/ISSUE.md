# Messaging — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 90%
**Last Updated:** 2026-04-05
**QA Issue:** [#163](https://github.com/databayt/hogwarts/issues/163)

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
- [x] Polling fallback for message updates (pollNewMessages + pollConversationUpdates)
- [ ] Real-time message delivery (WebSocket/SSE -- hook exists, backend TBD)
- [ ] Typing indicators
- [ ] Online/offline presence indicators

## Known Issues

### P0 — Critical

- None

### P1 — High

- Real-time message delivery depends on WebSocket/SSE infrastructure not yet deployed (polling fallback active -- 5s interval)
- `use-realtime-messages.ts` hook exists but backend subscription mechanism TBD

### P2 — Medium

- Mark-read operations are O(n) per conversation -- may need batching for large chats
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

- Typing indicators ("User is typing...")
- Voice messages with transcription
- Scheduled messages (send later)
- Message threading (reply chains)
- Conversation categories (by class, department)
- Full-text search across all conversations

---

**Last Review:** 2026-04-05
