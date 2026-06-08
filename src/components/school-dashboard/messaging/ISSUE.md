---
epic: 06
sprint: Q3-2026
title: Messaging
file_type: issue
owner: Abdout
maturity: Built+Polish
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

# Messaging — Production Readiness Tracker

**Status:** 🟢 CODE PRODUCTION-READY (incl. group WhatsApp) — remaining work is ops/env only
**Completion:** 100% code, 0% ops
**Last Updated:** 2026-06-05
**Ship Issue:** [#240](https://github.com/databayt/hogwarts/issues/240) is **CLOSED** — the live blocker is now [#262](https://github.com/databayt/hogwarts/issues/262) (Socket.IO → Oracle Cloud).

## 2026-06-05 production hardening pass (branch `fix/messaging-production-ready`)

A full hardening pass on top of the frozen code — **223/223 tests, tsc clean**:

- **Correctness:** read-receipt `readCount` made honest via cheap `_count`;
  `forwardMessage` blocks soft-deleted sources; `markMessageAsRead` now requires
  conversation participation; `unstarMessage` delete scoped to its conversation;
  mobile `read` route scoped by `conversation.schoolId`; offline double-poller
  collapsed to a single 10s poller.
- **i18n:** `upload-actions.ts` raw English → `actionError` codes (both caller
  toasts resolve via `resolveMessagingError`); mobile `ios-chat-list` content
  previews + "Yesterday" now dictionary-keyed (en+ar). `validation.ts`'s 30 Zod
  schemas are **intentionally left English** — server-only (`.parse`), caught →
  codes, never user-visible (reclassified from "debt" to "not user-facing").
- **Cleanup:** ~1,740 lines of dead code removed (`use-realtime-messages` hook,
  orphaned `conversation-list`/`conversation-card`, dead `attachment-upload`,
  vestigial `getUnreadMessageCountPrisma`, 8 dead imports, dead
  `validateMessageContent`); dead call/video header buttons removed.
- **WhatsApp:** **group dispatch is production-ready** (P0 below — DONE); rate
  limiter is durable (Upstash + in-memory fallback); phone-less recipients are
  surfaced not silently dropped; socket-server emit guard is constant-time and
  fails closed in prod.

See **WhatsApp Activation Balance** near the bottom for the exact remaining ops steps.

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
- [x] Contact name translation (getText when locale differs from school language)
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

- [x] **Group WhatsApp dispatch join table — DONE 2026-06-05.** Added the
      `MessageWhatsappDelivery(schoolId, messageId, participantId, phone, status,
providerMessageId, retryCount, lastError, sentAt)` model + table (additive,
      applied to the Neon default branch via `CREATE TABLE IF NOT EXISTS`; record at
      `prisma/migrations/20260605000000_add_message_whatsapp_delivery`). Group
      dispatch now writes one delivery row per recipient (pending/sent/failed), and
      `retryFailedMessageDispatches()` has a Part B that re-sends **per recipient**
      with exponential backoff — so already-delivered recipients aren't double-sent.
      1:1 still uses the `Message` scalars (Part A); the two retry paths never
      overlap. `Message` scalar columns are unchanged (no last-writer-wins).

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
- WhatsApp phone resolution does not cover plain `User` rows with no Guardian/Teacher/StaffMember profile (the `User` model has no phone field — that's the complete source set). **As of 2026-06-05 the skip is observable**: `whatsapp-bridge.ts` `console.warn`s the count + userIds of unreachable participants instead of silently dropping them.
- 1:1 dedup is enforced in application logic only (`actions.ts:233`); no DB unique constraint, so concurrent creates can still race a duplicate direct conversation

### i18n debt (P2)

Client UI is dictionary-keyed (dedicated `messaging` namespace, `dictionaries.ts:142`). Server-action error i18n is now done; two logic-layer items remain:

- [x] **Server-action error codes — done 2026-05-22.** All `actions.ts` error returns use `actionError(ACTION_ERRORS.*)`; client resolves → localized `m.errors.*` via `resolveMessagingError()`.
- [x] **`upload-actions.ts` error codes — done 2026-06-05.** The 2026-05-22 migration had missed this file (11 raw English `error:` returns); now uses `actionError(ACTION_ERRORS.*)` with 3 new attachment codes, and both upload-error toasts in `message-input.tsx` resolve via `resolveMessagingError` (previously collapsed to a generic message).
- [x] **Mobile previews — done 2026-06-05.** `ios-chat-list.tsx` Photo/Video/Voice/Location/deleted + "Yesterday" now dictionary-keyed (en+ar `ui.preview.*` + `ui.relative_yesterday`).
- [x] **`validateMessageContent` removed 2026-06-05** (dead code, zero callers).
- [~] **`validation.ts` 30 Zod schemas — left English by design.** They are server-only (`.parse`); a parse failure is caught in the action and returned as an error CODE, so the Zod message is never shown to a user. No client form uses these schemas (no `zodResolver`/`safeParse` anywhere in the block). Converting them is churn with no user-facing benefit — **not** real i18n debt.

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
- [x] Rate limiting (1 msg/sec, 500 DMs/day) — **durable as of 2026-06-05** (Upstash Redis, atomic INCR/EXPIRE) with in-memory fallback when `UPSTASH_REDIS_REST_URL` is unset; the daily cap is now enforced globally across serverless instances when Redis is configured
- [x] Retry with exponential backoff (max 5 attempts) — **1:1 AND group as of 2026-06-05** (group via `MessageWhatsappDelivery` sweep, see P0)
- [x] Cron job for retry + notification dispatch — `vercel.json` runs `*/5` (Vercel Pro); needs `CRON_SECRET` on Vercel
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

**223 passing / 223 (7 files)** as of 2026-06-05 (`pnpm exec vitest run src/components/school-dashboard/messaging`). The 2026-06-05 hardening pass added 5 tests (forward soft-deleted source, unstar conversation-scoping, mark-read participant guard ×2, group `MessageWhatsappDelivery` fan-out) on top of the 211 baseline; the prior count fell by 4 only because `rtl-verification.test.ts` generates one test per messaging file on disk and 4 dead files were deleted. tsc clean (messaging scope; 10 pre-existing repo-wide errors are livekit-not-installed + the docs `@/.source` artifact, unrelated). Broader run incl. `whatsapp` + `lib/whatsapp` = 223/223 across 8 files.

## WhatsApp Activation Balance — what's left to go live

**CODE (done this pass — no action needed):** group join-table dispatch+retry, durable rate limiter, phone-skip observability, constant-time emit guard, error-code i18n. Inbound webhook bridging code was already complete.

**SCHEMA (done):** `MessageWhatsappDelivery` table is live on the Neon default branch (additive).

**OPS — set by the operator on Vercel + Evolution + socket host (cannot be done from code):**

- [ ] **Each school scans the WhatsApp QR** (existing admin dashboard) to create a `connected` `WhatsAppSession` — required for any outbound WA. `EVOLUTION_API_URL` + `EVOLUTION_API_KEY` are already set.
- [ ] **Vercel: `WHATSAPP_WEBHOOK_SECRET`** + append `?secret=$WHATSAPP_WEBHOOK_SECRET` to Evolution's `WEBHOOK_GLOBAL_URL` — the webhook fails closed in prod without it (inbound WA→app bridge stays dark).
- [ ] **Vercel: confirm `CRON_SECRET`** is set (the `*/5` WhatsApp retry cron refuses to run without it).
- [ ] **Vercel + socket host: `EMIT_SECRET` + `SOCKET_SECRET`** (same value both sides) — the hardened emit guard now fails closed if unset, so realtime push 401s until both are set.
- [ ] **Vercel: `NEXT_PUBLIC_SOCKET_URL=https://socket.databayt.org`** (local `.env` is `localhost:3001`).
- [ ] **Deploy `socket-server/`** (#262, long-lived host — not Vercel-serverless). Until live, realtime + inbound-WA push run on the polling fallback (functional, just not instant).
- [ ] **(Optional) `UPSTASH_REDIS_REST_URL` + `_TOKEN`** — activates the durable rate limiter + multi-instance presence; otherwise the in-memory fallback applies.

**Net:** 1:1 outbound WhatsApp works the moment a school scans the QR. Group outbound + retry works too (join table live). Inbound + realtime light up once the 3 secrets are set and the socket server is deployed (#262).

---

**Last Review:** 2026-06-05
