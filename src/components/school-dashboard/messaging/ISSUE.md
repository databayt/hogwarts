# Messaging — Production Readiness Tracker

**Status:** 🟡 IN PROGRESS
**Completion:** 80%
**Last Updated:** 2026-03-19

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
- [x] Comprehensive test suite (actions, authorization, multi-tenant, validation)
- [x] Serialization layer for date handling
- [x] Audit logging
- [ ] Real-time message delivery (WebSocket/SSE -- hook exists, backend TBD)
- [ ] Typing indicators
- [ ] Online/offline presence indicators

## Known Issues

### P0 — Critical

- None

### P1 — High

- Real-time message delivery depends on WebSocket/SSE infrastructure not yet deployed
- `use-realtime-messages.ts` hook exists but backend subscription mechanism TBD
- 1:1 conversations can be duplicated (no dedup constraint at DB level)

### P2 — Medium

- Mark-read operations are O(n) per conversation -- may need batching for large chats
- No message forwarding between conversations
- Student-to-teacher DM restrictions need configuration UI

## Enhancements (Post-MVP)

- Typing indicators ("User is typing...")
- Voice messages with transcription
- Scheduled messages (send later)
- Message threading (reply chains)
- Conversation categories (by class, department)
- Full-text search across all conversations
- Message translation (auto-translate between Arabic/English)

---

**Last Review:** 2026-03-19
