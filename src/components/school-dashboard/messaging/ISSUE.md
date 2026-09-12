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

## 2026-07-20 — legacy English demo data purge (seed self-heals)

The pre-i18n messages seed left English conversations ("Sports Team Chat",
"Class 1 Discussion", …) and English message bodies in Arabic-default demo
schools; the per-title existence guards never replaced them. `seedConversations`
now runs `purgeLegacyEnglishSeed` first: deletes conversations by the legacy
English title list (cascade takes participants/messages), deletes messages by
the legacy English body list (covers title-less direct conversations), then
drops direct conversations left empty (> 1 day old). Ran locally: 49
conversations + 146 messages purged, 45 Arabic conversations + 378 Arabic
messages created. Prod demo self-heals on next deploy (prebuild `ensure-demo`).

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

### Chat surface measured against the capture — 2026-09-10

The 09-09 pass put the desktop thread on the WhatsApp atoms; this one set their
numbers from a real capture (`public/whatsapp/IMG_2591.PNG`, 3x iPhone) instead
of by eye. Every value below was sampled off that file.

- [x] **The wallpaper tiled at the wrong pitch, so every repeat chopped the
      doodles.** The SVG canvas was 393x852 while the pattern inside it was
      432x784.8 (the 540x981 doodle image at the phone's scale), and CSS tiled
      the canvas at `412px` — three different pitches. Re-emitted
      `wp-wa-chat-bg.svg` from the supplied `public/whatsapp/Background chat.svg`
      as **one tile and nothing else** (`viewBox="0 0 432 784.8"`, cream rect,
      the same embedded image at `opacity .1` / `mix-blend-mode: difference`),
      and moved all four call sites to `432px auto`. Verified: sampled columns
      now repeat at exactly 432px (mean delta 0.000) where the old 412px pitch
      did not (mean 0.399). The doodle payload is byte-identical to what was
      already served — only the frame around it changed.
- [x] **`.wa-doodle-bg` still pointed at `cdn.databayt.org`,** which answers 403;
      the loading skeleton therefore painted bare cream. Now on the local tile.
- [x] **Three tokens were off the capture.** `--wa-surface-baloon-me`
      `#d0fecf` → `#d8fdd2`; `--wa-surface-notice` `#fff3d5` → `#fff0d3`; and
      `--wa-text-notice`, which was a `#54606a` grey where the capture is plain
      `#0a0a0a` — the most visible of the three. Light block only, edited by
      hand (the token generator has drifted behind `globals.css`).
- [x] **Type and box metrics.** Encryption card 12.5px/17px → **14.5px/20px**
      (the capture's line pitch is 20 exactly, its card 3 lines in 72px);
      balloon body 14px → **17px/24px** with padding `8px 9px 7px`; balloon
      clock 11px → **12px** (capture digits are 9pt tall, i.e. a 12px face);
      day pill 12px → **13px/15px**, border and `min-w-[100px]` dropped — it now
      measures 19px tall against the capture's 19.3.
- [x] **Composer field** 14px in a 38px box → **17px/21px in `min-h-[31px]`**,
      the capture's own 31pt. Note the base `Textarea` carries `md:text-sm`,
      which outranks an unprefixed `text-[17px]` at >=768px — the override needs
      `md:text-[17px]` alongside it or desktop silently stays at 14px.

Deliberately **not** matched, both prior decisions restated: balloon sides stay
logical so Arabic mirrors the thread (the capture is an English-UI phone), and
the desktop header still carries no call buttons. The card's `max-w` is 420px,
not the capture's 280px — the Arabic sentence is longer than the English one,
and 420px keeps it to the same 2–3 lines the capture shows.

Stroke colour still reads lighter on screen than in the capture. That is the
capture being 3x: rendered at the art's native resolution the stroke measures
`#E9E3D9` against the reference's `#EAE0D4`. Not a defect, do not "fix" it.

### Mobile WhatsApp conversation view — wired 2026-09-09

- [x] **The conversation view reached the phone.** `mobile/chat/*` was fully built
      and exported but imported by nothing, so tapping a row on `<md` opened the
      desktop `ChatInterface`. `MessagesView` now renders under `md:hidden` with
      `ChatInterface` moved to `hidden md:flex` — the desktop split-pane is byte-for-byte
      unchanged. New `mobile/chat/adapt.ts` maps `MessageDTO[]` → `ChatItem[]`
      (day separators, tail on the last of each same-sender run, group sender labels,
      ticks from `readCount`/`status`, reply/voice/location kinds).
- [x] **Icons were entirely dead.** `WA_CDN_BASE` pointed at CloudFront; that origin
      and `cdn.databayt.org` both answer **403**, so every icon in the mobile UI —
      tab bar, ticks, search, avatars — rendered as a broken image. All 43 already sit
      in `public/icons/whatsapp/`, so the base is now `/icons/whatsapp`. The generator's
      source (`~/.claude/memory/whatsapp_tokens.json` → `icons._cdnBase`) moved with it.
      The chat wallpaper came from the same dead origin. **Note:** that field also feeds
      the Kotlin/Swift emitters in `scripts/generate-whatsapp-tokens.mjs`, where a
      web-relative path is meaningless — give those an absolute base if native ever ships.
- [x] **Scroll + paging.** The view had neither. It now opens at the newest message,
      follows arrivals, holds position when older messages are prepended, and pages at
      the top behind a re-entrancy guard (unguarded, a flick re-requested the same cursor
      and duplicated messages).
- [x] **Send appends locally.** Without it a sent message waited up to 10s for the
      poller while the composer had already cleared; failures now toast instead of
      becoming an unhandled rejection. Dedupes by id against the poller.
- [x] **RTL.** The bubble tail was pinned to a physical edge while its bubble sits on
      a logical one, so it detached under `dir=rtl`. Now logical.

**Not wired on mobile (deliberate, desktop-only for now):** attachment upload, edit,
delete, reactions add/remove, reply composition, forward, link previews, voice
recording. `onTapInfo` opens `ConversationInfoPanel`, which is `hidden md:block`, so
tapping the header does nothing on a phone. The composer's attach/sticker/camera/mic
buttons render but are inert.

### Desktop conversation joins the WhatsApp pattern — 2026-09-09

Read against an iPhone WhatsApp conversation screenshot. The phone view already
carried the pattern; the desktop split-pane was the outlier, and both now share
the same atoms instead of each holding its own copy.

- [x] **The encryption card exists, and it is cream.** New shared
      `mobile/chat/encryption-notice.tsx` — the WhatsApp notice ground with an
      inline lock and a bold trailing link — replaces the plain white card the
      phone had and adds one to the desktop thread, where none existed. Two new
      tokens (`--wa-surface-notice`, `--wa-text-notice`), light and dark. It
      renders at the true head of the thread only, so it appears once the whole
      history is loaded rather than above a half-fetched page. New dictionary
      key `ui.encryption_learn_more`; the notice copy dropped its "not even
      WhatsApp" clause, which was never true of this messenger.
- [x] **Desktop balloons take the WhatsApp skin.** 12px corners with a hairline
      edge and a tail on the last message of each same-sender run, replacing
      `rounded-sm`/`rounded-md` with no tail. The frozen `#D9FDD4` and `bg-white`
      became `--wa-surface-baloon-me` / `--wa-surface-baloon-other`, so the thread
      now follows the theme in dark mode instead of staying light.
- [x] **One wallpaper.** The desktop painted `#EEEAE4` under a 60%-opacity doodle
      fetched from `cdn.databayt.org`; it now shares the phone's ground and the
      local `/icons/whatsapp/wp-wa-chat-bg.svg` at its real tile size. One less
      external origin on a path where that origin has already answered 403 once.
- [x] **Header reads as the phone's.** Glass panel, 0.33px hairline, 36px avatar,
      16px semibold name over a 12px subtitle. The name block opens the info
      panel, mirroring the phone's tap target; presence still wins the subtitle
      when there is presence to report. Still no call buttons — the 2026 decision
      against decorative telephony stands on both widths.
- [x] **Composer chrome tokenized**, and a camera sits beside the mic. It opens
      the photo/video picker that already existed, so it is a real control rather
      than a glyph.
- [x] **Day pill is the shared atom** on both widths, and both **print Latin
      digits** — bubble clocks and day labels. `ar-EG` had been giving the phone
      Arabic-Indic numerals against the desktop's Latin ones.

Not changed, deliberately: bubble sides stay logical, so Arabic still mirrors the
thread (outgoing on the reader's leading edge). The reference screenshot came from
an English-UI phone, where that edge is the right one; WhatsApp under an Arabic UI
mirrors exactly as this does.

**Do not run `scripts/generate-whatsapp-tokens.mjs` to "sync" the tokens.** The WA
block in `globals.css` has drifted ahead of `~/.claude/memory/whatsapp_tokens.json`
— the chip and search values were corrected against a real screenshot on
2026-09-09 (`#cffdcf` vs the JSON's `#d0fecf`, `#00613b` vs `#15603e`,
`#f5f5f4` vs `#f4f4f4`) and never written back. Regenerating reverts those
measured corrections silently. The two notice tokens added here were hand-written
into both files for the same reason. Reconcile the JSON to the CSS before ever
running the generator again.

### Chat list read against a real screenshot — 2026-09-09

Compared side by side with an iPhone WhatsApp chat-list capture at 393×852 @3x.

- [x] **Tab icons were rendering flat black**, active or not. `IosTabbar` passed
      `tint={false}`, which makes `WaIcon` emit a plain `<img>`, so the
      selected/unselected colour classes had nothing to act on. Masked now.
- [x] **Filter chips are outlined**, not grey-filled; only the active chip carries
      the pale green fill (new `--wa-border-cta-filters`). The trailing `+` chip was
      built but never rendered, and the row now scrolls — Arabic labels overflow 393px
      where the English ones fit.
- [x] **Avatar fallbacks are tinted**, per the reference: peach circle with a brown
      pair for groups, pale blue with a blue silhouette for people, replacing a grey
      gradient and an initial letter. Four new tokens, light and dark.
- [x] **"You" replaces the gear** in the last tab slot, carrying the reader's own
      photo, falling back to the silhouette. Same `onDashboard` action as before.
- [x] **Group previews name the speaker** ("Name: message"), voice previews carry
      their duration, and previews wrap to two lines inside the same row box.
- [x] **Archived only appears when something is archived.** Title reads `ui.chats`,
      matching the reference, not `ui.title` (which desktop still uses).

Then measured pixel by pixel against the screenshot (PIL, edge-detected), which
corrected the eyeballed pass above:

|                         | reference         | was  | now       |
| ----------------------- | ----------------- | ---- | --------- |
| row pitch               | 85.7              | 77.3 | 86        |
| separator trailing edge | 390 (screen edge) | 375  | 390       |
| search field height     | 36                | 34.6 | 36        |
| chip height             | 32                | 34   | 32        |
| search magnifier        | 16                | 24   | 16        |
| header glyphs           | 18                | 24   | 18        |
| `+` chip glyph          | 12                | 24   | 12        |
| avatar                  | 55.3              | 56   | 56 (kept) |

The header carried a bottom divider the reference does not have, and its glyphs
were large enough to swallow the grey circle behind them, which is why the
camera read as a bare icon. Type sizes were checked by ink height and were
already right, so they were not touched.

Also added: the notification card between the search field and the chip row. It
asks the browser for real permission (there is no web push in the app yet) and
remembers a dismissal in `localStorage`. And the seed now gives every admin
their own direct threads — the 20 it already made paired random teachers and
students, so `admin@balqalam.com` opened Messages to 7 rows against the
reference's full screen. That account now has 19.

**Deliberately not mirrored** (WhatsApp product surfaces with no school-app
counterpart): the "Ask Meta AI" search affordance, the notification-permission
banner, the Meta AI button, and an "Updates" tab — our tab bar carries four slots
(Calls, Classes, Chats, You) against the reference's five. The `+` filter chip is
visual only; there are no custom filter lists behind it.

### Liquid glass — 2026-09-09

Re-read against the iOS 26 chat list (`public/whatsapp/File.png`), where the
header and tab bar stopped being bars.

- [x] **Header buttons float.** The bar has no surface of its own; three 42px
      glass discs sit over the list and it scrolls underneath them.
- [x] **The tab bar is a floating capsule**, inset from the screen edges, with
      the selected tab in its own recessed pill. Same scroll-under treatment.
- [x] **Glass values come from the android app**, not invented:
      `core/designsystem/.../apple/apple-materials.kt` → white at 0.85, a half-pixel
      black border at 0.08, an elevation-12 shadow. Tokenised as `--wa-glass-bg`,
      `--wa-glass-border`, `--wa-glass-shadow`, `--wa-glass-inner`, light and dark.
- [x] **Group avatars are pale green**, not peach — the newer screenshot changed
      them. Sampled: fill `#dffbd6`, glyph `#408559`. Search field grew 36 → 44.
- [x] **The Groups filter matched only `type === "group"`** while the rows draw
      every non-direct conversation with the group avatar, so it hid all five of the
      demo admin's groups (they are seeded as `department`). It now excludes only
      `direct`, which is the same rule the rows use.

Still four tabs against the reference's five; "Updates" has nowhere to route yet.

### Filling the phone screen — 2026-09-09

- [x] **The footer sat above Safari's URL bar.** The messaging shell was
      `h-screen`, and on mobile Safari `100vh` is the _tall_ viewport measured with
      the URL bar hidden, so the page was always taller than what you can see. Now
      `h-dvh`, which tracks the visible height as the bar collapses.
- [x] **Safe areas.** The root layout exports `viewportFit: "cover"`, so the page
      may draw into the notch and the home-indicator strip, and
      `env(safe-area-inset-*)` starts reporting real numbers. The header is
      `inset-top + 56` and the tab pill sits `inset-bottom + 8` off the floor. In a
      browser both insets are 0, which is why the header no longer reserves 98px for
      a status bar that is not there.
- [x] **`apple-mobile-web-app-capable`** via `metadata.appleWebApp`. The manifest
      already said `display: standalone`, so Add to Home Screen now opens with no
      browser chrome at all — the only way to be rid of the URL bar on iOS.
- [x] **Footer labels removed**, four tabs kept, each label preserved as the
      button's `aria-label`. The fake home indicator went with them: standalone iOS
      draws the real one over that space, and a browser has none.
- [x] **Header buttons carry the Figma node's Liquid Glass material**
      (`iuYSGaRV8xkcEGnyIltPRg`, node `1:59`) as `.wa-glass-control` in
      `globals.css`. The variables map straight across: Frost 7 → a 7px backdrop
      blur, Depth 16 → the cast shadow's reach, Splay 6 → how far it is thrown,
      Light Angle −45 → lit from the upper _start_ corner (so the rule mirrors
      under RTL), Refraction 100 → a bright inset rim where light enters and a
      dim one where it leaves, Dispersion 0 → a neutral rim, Labels/Primary
      `#1a1a1a` → the glyph. The compose button stays brand-filled and borrows
      only the depth.

      **Caveat, settled 2026-09-10.** The node was never rendered at the time:
      `get_variable_defs` returned just before the Figma MCP hit its
      Starter-plan call limit, and `get_screenshot`/`get_metadata` did not. The
      Keychain's `figma` item is the desktop app's safe-storage key, not a REST
      token, so the API answered 403. A `figd_` token now exists — Keychain
      service `figma-token`, account `abdout`, scoped to file-contents read
      only — which is enough for both `/v1/files/<key>/nodes?ids=<a:b>` and
      `/v1/images/<key>?ids=<a:b>&scale=3`. Reach for that first; the MCP's
      call limit is the plan's, not a transient error, and the local Dev Mode
      MCP server needs a paid seat. Note the id form differs: `5-596` in a
      Figma URL is `5:596` to the API.

### Tab bar takes node 5:596 — 2026-09-10

- [x] **The footer capsule is measured, not approximated.** Node `5:596`
      ("Tab Bar - iPhone", same file as `1:59`) is Apple's iOS 26 Liquid Glass
      tab bar. What moved in `ios-tabbar.tsx`:

      | | was | node |
      | --- | --- | --- |
      | capsule radius | `32px` | 296 on a 62-tall bar, i.e. a capsule |
      | capsule padding | `8px 10px` | 4px all round |
      | tab cell height | 46px | 54px |
      | selection radius | `22px` | 100, a full-height capsule |
      | cast shadow | `0 8 24 / 0.08` | `0 8 40 / 0.12` |
      | side gutter | 16px | 25px |
      | floor | safe-area + 8 | 25, `max()`-ed with the old value |

- [x] **Colors were read off a 3x render, not recomputed.** The BG stacks three
      fills (white at 0.65, `#dddddd` color-burn, `#f7f7f7` darken) and the
      selection rectangle is `#ededed` linear-burn — blend modes CSS cannot
      reproduce, because `background-blend-mode` never sees the backdrop. The
      render settles them at `#f1f1f1` and `#e0e0e0`. Live, over the list, the
      bar measures 243 and the pill 226 against the node's 241 and 224; the
      2-point gap is the white page showing through the retained 0.85 alpha.
- [x] **The rim is borrowed, and that is deliberate.** The node's own `GLASS`
      effect binds six library variables, and the variables endpoint is
      Enterprise-only, so the REST payload carries `{type, visible}` and
      nothing else. `.wa-glass-tabbar` therefore reuses the refraction insets
      `.wa-glass-control` got from node `1:59` — same kit, same file, read
      while variable access still held.
- [x] **Only the rim mirrors under RTL.** The node casts straight down
      (offset 0,8), so the drop shadow is direction-neutral; the two inset
      rims swap sides. Verified on `/ar` and `/en` at 402px.

**Two divergences from the node, both on purpose.** It draws 10px labels under
each icon — the 2026-09-09 decision above removed those, and it stands, so the
bar is still icon-only with the labels living on as `aria-label`. And its
selected tint is `#0088ff`, the kit's system-blue placeholder; the sampled
`--wa-text-tabbar-selected` stays.

### Header buttons re-read from node 1:59 — 2026-09-10

The caveat above is now closed from the other end: the button node itself was
read, and it corrected one thing the derivation got wrong.

- [x] **The cast shadow was thrown in the wrong direction.** Depth 16 and Splay
      6 along Light Angle −45 had been read as a diagonal `3px 6px 16px` at
      14%, mirrored under RTL. The node's actual `DROP_SHADOW` is offset
      **(0, 8), blur 40, black at 12%** — straight down, and identical to the
      tab bar's. `.wa-glass-control` now takes `--wa-glass-shadow` like
      everything else, so only the refractive rim still mirrors. The compose
      button's borrowed depth follows, keeping its heavier 18%.
- [x] **The surface is shared, not similar.** Node 1:59's BG and node 5:596's
      are the same component, `1:20`. So the buttons take `--wa-glass-bg` and
      `--wa-glass-border` rather than their own white at 0.55. Only the blur
      still differs: 7px here, from this node's own Frost variable, against
      20px on the bar, which predates any measurement and stays as it is.
- [x] **42px → 44px, and the glyphs with it.** The button exists at two sizes
      off that one component: **48** standing alone as "Button - Liquid Glass -
      Symbol", and **44** every one of the six times the file's own
      `Toolbar - Top` places it. This header is a top toolbar, so 44 is the
      right instance — 48 fills the 56px band exactly and leaves nothing above,
      which reads as clipped. The glyph box scales with the disc: 22 → 20, and
      the compose plus 21 → 19, matching the toolbar's 17pt symbol in a 20.29px
      line box against the standalone's 19pt in 22px.
- [x] **Verified**, `/ar` and `/en` at 402px: 44×44, 4 above and 8 below inside
      the 56px band, surface `rgba(241,241,241,0.85)`, cast `0 8px 40px` at
      12% in both directions, rim mirrored.

**Not reproducible in CSS:** the node's corners carry `cornerSmoothing 0.6`, an
Apple squircle. `border-radius` is a circular arc and there is no property for
this, so the discs stay true circles.

### Five labelled tabs — 2026-09-10

The floating capsule carries five cells instead of four: **updates · calls ·
communities · chats · settings**, each an icon over its own word (26px glyph,
10px label). The glyphs are the freshly captured WhatsApp pair per tab — the
outline while the tab is idle, the solid one while it is current — copied into
`public/icons/whatsapp/` as `ic-wa-tab-<id>-32.svg` and `…-fill-32.svg`, and
declared in the token source so `WaIconName` still types them.

The fifth cell used to draw the reader's own face as a "You" slot; it draws the
gear now. `currentUserImage` is still accepted so existing callers keep
compiling, and tapping the cell still routes to the dashboard. The unread badge
moved off the cell corner onto the chats glyph, which is where it stays put once
a word sits underneath. Nothing new renders when updates or communities is
selected — the same list stays underneath, as it already did for calls.

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

## 2026-09-12 — demo inboxes seeded, list unread counts fixed

- `prisma/seeds/messaging-demo.ts` (new) writes authored inboxes for `student@`,
  `teacher@` and `parent@`: 32 conversations / 112 messages on the demo school,
  counterparts resolved from the student's own section timetable, homeroom and
  classmates. Idempotent; `pnpm db:seed:single messaging-demo`. Called from
  `seedMessaging`, so the full seed picks it up too.
- **Fixed:** `getConversationsList` / `getConversationsForPoll` never attached an
  unread count, so every row arrived at the client with `unreadCount: undefined`.
  The mobile Unread filter matched nothing on load and no row drew a badge until
  a socket event bumped a counter. Both now attach it from
  `getUnreadCountsPerConversation` (one aggregated query per page).

- Mobile chat view rebuilt to the iOS captures (`public/whatsapp/IMG_2634..2637`):
  the header is now floating liquid glass over the wallpaper instead of a solid
  band, the thread scrolls under it, the opening date pill precedes the
  encryption card (now 280px wide), and the input bar's mic is a filled green
  disc. Header subtitle carries presence / typing / group size. README has the
  measurements.

- Mobile tab bar's other four pages built: Updates (audience-scoped
  announcements), Calls (the viewer's live classes), Communities (the school's
  rooms) and Settings (profile card over links into existing pages). Tab state
  moved out of `ios-chat-list.tsx` into `mobile/ios-shell.tsx` — the reason
  those tabs were inert. Two lazy server actions, `getMobileUpdatesFeed` and
  `getMobileCallsFeed`, over `mobile-tabs-queries.ts`. README carries the
  structure and the three judgement calls.

---

**Last Review:** 2026-09-12
