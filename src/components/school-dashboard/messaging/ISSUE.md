# Messaging — Production Readiness Tracker

**Status:** 🟡 CODE-READY (blocked on ops deploy + env vars)
**Completion:** 100% code, 0% ops
**Code frozen since:** 2026-04-25 (no source changes after this commit)
**Last Updated:** 2026-05-21
**Ship Issue:** [#240](https://github.com/databayt/hogwarts/issues/240) is **CLOSED** — the live blocker is now [#262](https://github.com/databayt/hogwarts/issues/262) (Socket.IO → Oracle Cloud).

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
- [x] Message search (in-conversation + global, PostgreSQL full-text)
- [x] Multi-tenant isolation (schoolId scoping + participant validation)
- [x] Authorization layer (participant-level access control)
- [x] Zod validation schemas
- [x] Comprehensive test suite (actions, authorization, multi-tenant, validation, whatsapp-bridge)
- [x] Serialization layer for date handling
- [x] Audit logging
- [x] WhatsApp dual-delivery (auto-enable, toggle, bidirectional bridging)
- [x] WhatsApp phone resolution (Guardian > Teacher > StaffMember)
- [x] WhatsApp delivery status on message bubbles (sent/delivered/read/failed)
- [x] Unread badge on header mail icon (fetch on mount + focus, Socket.IO increment)
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
- [x] Message forwarding (action `forwardMessage` + bubble dropdown trigger at `message-bubble.tsx:702`)
- [x] Star messages (`starMessage` / `unstarMessage` / `getStarredMessages`)

## Verified inventory (2026-05-21 audit)

- **29 server actions** in `actions.ts`, **28 read queries + 5 builders** in `queries.ts`
- **11 Prisma models** in `prisma/models/messages.prisma`: Conversation, ConversationParticipant, Message, MessageAttachment, MessageReaction, MessageReadReceipt, TypingIndicator, MessageDraft, PinnedMessage, ConversationInvite, StarredMessage
- Route group `(school-messaging)/messages` (full-screen, no header/sidebar)
- Multi-tenant: **every** action + query is schoolId-scoped (directly or via the conversation relation); `__tests__/multi-tenant.test.ts` includes explicit cross-tenant attack cases

## Known Issues

### P0 — Critical

- [ ] **Group WhatsApp dispatch needs a join table.** `Message` has scalar `whatsappPhone` / `whatsappStatus` / `whatsappMessageId` columns, so fanning a group message to N participants used to last-writer-wins them. Patched on 2026-04-22 to only write those scalars for 1:1 conversations — groups now log per-recipient rows in `WhatsAppMessage` instead, so no more data corruption, but `retryFailedMessageDispatches()` only retries 1:1 failures. A proper `MessageWhatsappDelivery(messageId, participantId, phone, status, providerMessageId, retryCount, lastError)` model is required before rolling WhatsApp out to group chats. (See audit: `/Users/abdout/.claude/plans/elegant-cooking-unicorn.md` #6.) Needs schema migration — waiting on explicit approval.

### P1 — High (Ops blockers — must complete before real traffic; tracked in #262)

- [ ] Deploy the Socket.IO server (`socket-server/`) — not yet live. #262 migrates this from Railway/Fly to an Oracle Cloud Always-Free VM
- [ ] Set `SOCKET_SECRET` on the socket host (same value must match Vercel)
- [ ] Set `SOCKET_SECRET` + `EMIT_SECRET` on Vercel (protects `/api/emit*` routes)
- [ ] Set `NEXT_PUBLIC_SOCKET_URL=https://socket.databayt.org` on Vercel — local `.env` currently has `http://localhost:3001` (dev-only)
- [ ] Set `CRON_SECRET` on Vercel — currently **empty** in `.env`; required for `/api/cron/*` (WhatsApp retry + notification dispatch). Endpoint refuses to run in production when unset.
- [ ] **Set `WHATSAPP_WEBHOOK_SECRET` on Vercel + include `?secret=$WHATSAPP_WEBHOOK_SECRET` in Evolution's `WEBHOOK_GLOBAL_URL`.** Webhook fails closed in production when unset.
- [ ] (Optional) Set `REDIS_URL` for multi-instance presence scaling

### P2 — Medium

- Only `direct` and `group` conversations are creatable — `class` / `department` / `announcement` exist in the `ConversationType` enum, `config.ts` RBAC table, and `authorization.ts`, but `new-conversation-dialog.tsx` exposes no creation UI for them. Either build the entry points or document them as schema-only scaffolding.
- Student-to-teacher DM restrictions: schema supports `canStudentsDmTeachers` but there is no admin UI to toggle it, and `checkMessagingPermission` does not enforce it
- WhatsApp phone resolution does not cover plain `User` rows with no Guardian/Teacher/StaffMember profile — these users silently skip WhatsApp delivery (logged as `whatsappError: "No phone number found for user"`)
- 1:1 dedup is enforced in application logic only (`actions.ts:233`); no DB unique constraint, so concurrent creates can still race a duplicate direct conversation

### i18n debt (P2)

Client UI is dictionary-keyed (dedicated `messaging` namespace, `dictionaries.ts:142`). Server-action error i18n is now done; two logic-layer items remain:

- [x] **Server-action error codes — done 2026-05-22.** All ~38 `actions.ts` error returns now use `actionError(ACTION_ERRORS.*)` (10 messaging codes added to `src/lib/action-errors.ts`). The client resolves codes → localized `m.errors.*` via `resolveMessagingError()` (`errors.ts`) at every toast site. 3 dict keys added (en+ar): `not_authenticated`, `search_query_too_short`, `whatsapp_not_connected`. 211/211 tests green, tsc clean.
- [ ] all 30 Zod schemas in `validation.ts` still use hardcoded English messages (no `createXSchema(v)` factory)
- [ ] `authorization.ts:validateMessageContent` still returns hardcoded English

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
- [x] Retry with exponential backoff (max 5 attempts) — 1:1 only (see P0)
- [x] Cron job for retry + notification dispatch (blocked on `CRON_SECRET`)
- [x] Admin dashboard for QR connection, groups, templates
- [x] WhatsApp settings dialog embedded in messaging UI (satisfies the "merge WhatsApp into messages" goal, old #164)
- [x] Test accounts seeded with WhatsApp phones (admin: 00966557721603, accountant: 00966504559207)

## Improvement / Optimization Backlog

Priority-ordered candidate work once ops blockers clear:

1. **Ship #262 (deploy socket server).** Removes the polling fallback — the single biggest realtime UX gap. Then drop/keep polling as a degradation path only.
2. **`MessageWhatsappDelivery` join table** (P0 above). Unblocks group WhatsApp retry + per-recipient delivery status. Needs migration approval.
3. ~~Green the test suite~~ — ✅ **Done 2026-05-22** (211/211, see Test Suite Status below).
4. **i18n migration.** Server-action errors → codes **done 2026-05-22** (client resolves via `resolveMessagingError` → localized `m.errors.*`). Remaining: migrate `validation.ts` (30 Zod schemas) + `authorization.ts:validateMessageContent` to the `ValidationHelper` factory.
5. **Resolve the 3 non-creatable conversation types.** Build creation UI for class/department/announcement or formally mark them schema-only.
6. **DB-level 1:1 dedup constraint** to close the race window left by app-logic-only dedup.
7. **Wire the modeled-but-actionless features** if needed: message pinning (`PinnedMessage`), drafts (`MessageDraft`), invites (`ConversationInvite`) — models + a query exist, but no write actions.

### Post-MVP enhancements

- Voice messages with transcription
- Scheduled messages (send later)
- Message threading (reply chains)
- Conversation categories (by class, department)

## Test Suite Status (GREEN)

**211 passing / 211 (7 files)** as of 2026-05-22 (`pnpm exec vitest run src/components/school-dashboard/messaging`); stayed green through the 2026-05-22 error-code i18n migration. The original 18 failures (fixed 2026-05-22) were all test-side issues; **no production logic was changed by the test fixes**:

- `multi-tenant.test.ts` — called the renamed `getConversations` (now `getConversationsList`) and `isConversationParticipant` with the wrong arity (it takes `schoolId, conversationId, userId` and uses `.count`); mock was missing `count` on `conversation` + `conversationParticipant`
- `actions.test.ts` — db mock was missing `user` / `whatsAppSession` / `messageAttachment` (so `createConversation`/`sendMessage` threw `findUnique` on undefined), `mockMessage` lacked `createdAt`, and assertions expected old English error strings instead of the error codes (`NOT_AUTHENTICATED`, `MESSAGE_SEND_FAILED`) + the schoolId-scoped `getStarredMessages` where-clause
- `whatsapp-bridge.test.ts` — assertion left **stale by the 2026-04-22 group fix**: the 2-participant (group) rate-limit case now logs per-recipient `WhatsAppMessage` pending rows instead of `db.message.update`
- `authorization.test.ts` — `getAuthContext` returns `null` (not `"USER"`) when role is missing; `create_conversation` permission needs a conversation `type` in the context object

---

**Last Review:** 2026-05-22
