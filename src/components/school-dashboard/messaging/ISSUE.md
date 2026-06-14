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
**Completion:** 100% code, ops in progress (Oracle VM)
**Last Updated:** 2026-06-13
**Ship Issue:** [#240](https://github.com/databayt/hogwarts/issues/240) is **CLOSED**; [#262](https://github.com/databayt/hogwarts/issues/262) (Socket.IO → Oracle Cloud) was auto-closed stale and is **superseded by the live runbook at [`socket-server/DEPLOY.md`](../../../../socket-server/DEPLOY.md)**. Tracked under epic [#324](https://github.com/databayt/hogwarts/issues/324).

## 2026-06-13 deployment-prep pass (Oracle Cloud account created)

Prepped the realtime + WhatsApp infra for the Oracle Always-Free VM (account now exists; VM/DNS/firewall are the next manual steps). All code-side blockers for going live are now closed:

- **Consolidated runbook `socket-server/DEPLOY.md`** — account → live in 9 phases, marked 👤 (you: Oracle/DNS/Vercel consoles) vs 🤖 (Claude over SSH). Current port (3000), Evolution v2, `.env`-based secrets.
- **Combined `docker-compose.yml`** (committable, no hardcoded secrets) — `socket-server` + Evolution API **v2** + Postgres + Redis. Replaces the prior untracked v1-style compose, which would have **broken the integration**: the app calls v2 endpoints (`integration: "WHATSAPP-BAILEYS"`, `{number,text}` sendText, nested per-instance webhook), and v2 **requires Postgres**. Image pinned to `atendai/evolution-api:v2.1.1` (was `atendebot/...:latest`).
- **Secrets regenerated as URL-safe hex** into `socket-server/.env` (gitignored) + `.env.example` template. The old base64 webhook secret contained `+`/`/`/`=` — and the webhook reads `searchParams.get("secret")` which URL-decodes, so `+`→space silently broke the constant-time compare (webhook would have failed closed in prod). Same 4 app-facing values must be set on Vercel (Phase 7).
- **Multi-tenant CORS fix in `server.ts`** — `cors.origin` was a single fixed string, so only ONE school's subdomain could connect. Now accepts a comma-separated `CLIENT_URL` allowlist **plus any `*.databayt.org`** origin in production. Adding a school subdomain needs no socket redeploy. tsc 0.
- **Deterministic Docker build** — Dockerfile now copies `package-lock.json` + uses `npm ci` (was `npm install` without the lockfile). Verified `npm ci` lockfile-in-sync locally.

## 2026-06-12 performance + WhatsApp-correctness pass (3 commits on main)

**221/221 tests (8 files), tsc 0 repo-wide, no new eslint errors.** Indexes applied
live on Neon + recorded in `prisma/migrations/20260612000000_messaging_perf_indexes/`.

- **CRITICAL — dead raw SQL fixed:** `getUnreadMessageCount`,
  `getUnreadCountsPerConversation`, and `fullTextSearchMessages` referenced
  `"Message"`/`"Conversation"`/`"ConversationParticipant"` but the live tables are
  `messages`/`conversations`/`conversation_participants` (`@@map`) — **these queries
  could never run** (unread badge + global search silently broken). Fixed + verified
  live on Neon. The FTS sanitizer also stripped Arabic characters (Arabic search
  always returned empty) — fixed, and the last term now gets `:*` prefix matching
  for search-as-you-type. `/api/messages/search` switched from un-indexable
  ILIKE to the GIN-backed FTS.
- **WhatsApp correctness (4 P0s):** webhook URL now carries `?secret=` (Evolution
  sends no auth headers — inbound was 100% dark in prod even WITH the env var set);
  MESSAGES_UPSERT dedup on `(schoolId, waMessageId)` (at-least-once delivery +
  fromMe echoes created duplicates); group `@g.us` sender read from
  `msg.participant` + audit row linked to its WhatsAppGroup (was silently dropped);
  MESSAGES_UPDATE now advances `MessageWhatsappDelivery` rows too (group recipients
  were stuck at "sent" forever) with out-of-order downgrade guards.
- **WhatsApp robustness:** one canonical phone normalization (digits-only, strips
  `00`) across outbound/stored/inbound-lookup (3-spelling tolerance for legacy
  rows); inbound media uploaded to object storage (data-URL only as ≤5MB fallback);
  notification sends get bounded retry w/ backoff via metadata counter (transient
  failures were permanently lost); dead Evolution instance (401/403/404) auto-marks
  the session disconnected; reconnect-after-disconnect recreates the deleted
  instance (was a guaranteed 404 loop); rate-limiter TTL seeded atomically
  (SET NX EX — a crash could permanently block a school).
- **Server perf:** sendMessage −2 queries + parallelized tail; conversation-switch
  no longer fetches messages twice; 10s message poll 3 queries → 1 (cursor-based,
  participant-scoped, delivers tombstones); 15s list poll skips the COUNT;
  forwardMessage 3N sequential → 3 batched; WA read-sync detached from the
  mark-as-read response path; contacts guardians query −4 queries; content.tsx
  ~250 per-name `getText` calls → ONE batched `getNames`; dead
  `fetchSearchSuggestions`/`getSearchSuggestions` deleted (invalid SQL, no callers).
- **Indexes (live + migration record):** `conversations(schoolId,isArchived,
lastMessageAt DESC)`, `messages(conversationId,whatsappStatus)`,
  `typing_indicators(conversationId,startedAt)`,
  `message_whatsapp_deliveries(providerMessageId)`, GIN
  `to_tsvector('simple', content)` on messages, and **unique**
  `conversations_direct_pair_key` (1:1 dedup at the DB — closes the P2 race;
  `createConversation` catches the P2002 and returns the existing conversation).
- **Client render:** typing/socket/poll events no longer re-render the whole chat
  (9 handler props stabilized, memoized reaction groups/timestamps/avatar colors,
  mount-once intervals, MutationObserver scope, malformed-URL crash guard in
  link previews, stable waveform heights, media-aware virtualizer estimates).

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

### P1 — High (Ops blockers — must complete before real traffic; runbook: `socket-server/DEPLOY.md`)

Secrets are pre-generated in `socket-server/.env` (gitignored). The 4 app-facing values must be set identically on Vercel — see DEPLOY.md Phase 7.

- [ ] Create the Oracle VM + DNS A records (`socket`, `evolution`) + Security List 80/443/22 (DEPLOY.md Phases 1.2–3, 👤 manual)
- [ ] Deploy the stack to `/opt/hogwarts/socket-server` (`docker compose up -d --build` — socket + Evolution v2 + Postgres + Redis) (Phases 4–5, 🤖)
- [ ] Nginx + Let's Encrypt for `socket.databayt.org` + `evolution.databayt.org` (Phase 6, 🤖)
- [ ] Vercel (Production): `NEXT_PUBLIC_SOCKET_URL`, `EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `SOCKET_SECRET`, `EMIT_SECRET`, `WHATSAPP_WEBHOOK_SECRET` (match `.env`), confirm `CRON_SECRET` non-empty (Phase 7, 👤)
- [ ] Each school scans the WhatsApp QR; verify session survives `docker compose restart` (Phase 8)
- [ ] (Optional) `UPSTASH_REDIS_REST_URL` + `_TOKEN` on Vercel for the durable rate limiter / multi-instance presence (the VM Redis already backs the socket adapter)

### P2 — Medium

- `class` / `department` / `announcement` conversation types are **formally
  schema-only scaffolding** (decision 2026-06-12): they exist in the
  `ConversationType` enum, `config.ts` RBAC table, and `authorization.ts`, but
  have no creation UI by design. Build entry points only when a concrete need
  appears (announcement-style broadcast is already covered by the
  announcements block + WhatsApp admin groups).
- ~~Student-to-teacher DM restrictions: schema supports `canStudentsDmTeachers`~~
  **Stale claim (corrected 2026-06-12): no such field exists anywhere in the
  schema or code.** A per-school student→teacher DM toggle would be a net-new
  feature (settings column + admin UI + `canCreateConversation` enforcement) —
  backlog, not debt.
- WhatsApp phone resolution does not cover plain `User` rows with no Guardian/Teacher/StaffMember profile (the `User` model has no phone field — that's the complete source set). **As of 2026-06-05 the skip is observable**: `whatsapp-bridge.ts` `console.warn`s the count + userIds of unreachable participants instead of silently dropping them.
- [x] **1:1 dedup race — CLOSED 2026-06-12.** Unique partial index
      `conversations_direct_pair_key` on `(schoolId, LEAST(p1,p2), GREATEST(p1,p2))
WHERE type='direct'` (live on Neon + migration record); `createConversation`
      catches the concurrent-duplicate P2002 and returns the existing conversation.

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
2. ~~`MessageWhatsappDelivery` join table~~ — ✅ **Done 2026-06-05** (live on Neon; webhook status-sync added 2026-06-12).
3. ~~Green the test suite~~ — ✅ **Done 2026-05-22** (211/211, see Test Suite Status below).
4. ~~Resolve the 3 non-creatable conversation types~~ — ✅ **Decided 2026-06-12**: formally schema-only scaffolding (see P2).
5. ~~DB-level 1:1 dedup constraint~~ — ✅ **Done 2026-06-12** (`conversations_direct_pair_key`).
6. **Incremental list polling.** `pollConversationUpdates` still refetches the full 50-conversation list (now without the COUNT) every 15s per idle client; an `updatedSince` contract + client-side merge would make ticks near-free. Worth doing only if #262 stays blocked — the socket path makes polling a rare fallback.
7. **Mobile API name localization.** `/api/mobile/conversations` + `/messages` return raw `username`s; the web path batches via `getNames` (content.tsx), mobile contacts already uses `getLabels` — extend the same one-call batch to the two remaining mobile routes.
8. **Wire the modeled-but-actionless features** if needed: message pinning (`PinnedMessage`), drafts (`MessageDraft` — would also want a `schoolId` column to kill its 2-query lookup), invites (`ConversationInvite`) — models + a query exist, but no write actions.
9. **Per-school student→teacher DM toggle** (net-new feature; the old `canStudentsDmTeachers` claim was stale — no such field exists).

### Post-MVP enhancements

- Voice messages with transcription
- Scheduled messages (send later)
- Message threading (reply chains)
- Conversation categories (by class, department)

## Test Suite Status (GREEN)

**221 passing / 221 (8 files)** as of 2026-06-12
(`pnpm exec vitest run src/tests/school-dashboard/messaging src/tests/lib/whatsapp`
— tests moved to `src/tests/` in the URL-mirror reorg). The small count delta vs
the 2026-06-05 "223" is `rtl-verification.test.ts` generating one test per
messaging file on disk (file count shifted in the reorg), not lost coverage.
The 2026-06-12 pass updated `whatsapp-bridge.test.ts` expectations to the
normalized digits-only phone format and `actions.test.ts` to the batched
`forwardMessage`. **tsc 0 errors repo-wide** (was "baseline-only" before).

## WhatsApp Activation Balance — what's left to go live

**CODE (done — no action needed):** group join-table dispatch+retry, durable rate limiter, phone-skip observability, constant-time emit guard, error-code i18n (2026-06-05); webhook dedup + group-sender attribution + per-recipient status sync + `?secret=` webhook URL + unified phone normalization + bounded notification retry + dead-session auto-detection + reconnect fix (2026-06-12).

**SCHEMA (done):** `MessageWhatsappDelivery` table is live on the Neon default branch (additive).

**OPS — follow `socket-server/DEPLOY.md` (cannot be done from code).** Secrets are pre-generated in `socket-server/.env`; the 4 app-facing values go on Vercel identically.

- [ ] **Oracle VM + DNS + firewall** (DEPLOY.md Phases 1.2–3). Account exists as of 2026-06-13.
- [ ] **Deploy stack + Nginx + TLS** (Phases 4–6): socket + Evolution v2 + Postgres + Redis on the VM, `socket.databayt.org` + `evolution.databayt.org`.
- [ ] **Each school scans the WhatsApp QR** (existing admin dashboard) → `connected` `WhatsAppSession`, required for outbound WA. The app sets each instance's webhook URL (incl. `?secret=`) at QR-connect time via `/instance/create` — **no global webhook env needed** (the compose intentionally omits `WEBHOOK_GLOBAL_URL`).
- [ ] **Vercel (Production):** `NEXT_PUBLIC_SOCKET_URL=https://socket.databayt.org`, `EVOLUTION_API_URL=https://evolution.databayt.org`, `EVOLUTION_API_KEY`, `SOCKET_SECRET`, `EMIT_SECRET`, `WHATSAPP_WEBHOOK_SECRET` (all from `.env`); confirm `CRON_SECRET` non-empty. Webhook + emit + cron all fail closed in prod when unset.
- [ ] **(Optional) `UPSTASH_REDIS_REST_URL` + `_TOKEN`** — durable rate limiter + multi-instance presence; otherwise in-memory fallback (the VM Redis already backs the socket.io adapter).

**Net:** 1:1 outbound WhatsApp works the moment a school scans the QR. Group outbound + retry works too (join table live). Inbound + realtime light up once the Vercel secrets are set and the VM stack is deployed (DEPLOY.md).

---

**Last Review:** 2026-06-12
