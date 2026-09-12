---
epic: 06
sprint: Q3-2026
title: Messaging
file_type: readme
owner: Abdout
maturity: Built+Polish
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

## Messaging — Real-time direct messages and group chats

### Overview

Full-featured messaging system supporting 1:1 direct messages and group conversations within a school. Includes cursor-based message pagination, read receipts, emoji reactions, conversation muting/archiving/pinning, file attachments, message search, typing indicators, online/offline presence, and real-time updates via Socket.IO. All operations are multi-tenant scoped -- participants must belong to the same school.

### Capabilities by Role

- **ADMIN**: Full access -- create conversations, manage participants, view all school conversations
- **TEACHER**: Direct messages with other staff, students, guardians; group chats for classes
- **STUDENT**: Direct messages with teachers (if configured), group chats
- **GUARDIAN**: Direct messages with teachers and admin
- **STAFF**: Direct messages with all school members

> Only `direct` and `group` conversations are creatable from the UI today (`new-conversation-dialog.tsx`). `class` / `department` / `announcement` exist in the schema + RBAC config but have no creation entry point yet.

### Routes

| Route                                               | Page                | Status |
| --------------------------------------------------- | ------------------- | ------ |
| `/{lang}/s/{subdomain}/(school-messaging)/messages` | Messaging interface | Ready  |

Note: Uses standalone full-screen layout (`(school-messaging)` route group) with no header/sidebar/footer.

### File Structure

```
src/components/school-dashboard/messaging/
├── actions.ts                      # 28 server actions (conversations, messages, reactions, search, stars, polling, WhatsApp)
├── queries.ts                      # 28 read-only DB queries + 5 builders (lists, stats, unread, search, participants)
├── authorization.ts                # RBAC and participant-level permission checks
├── validation.ts                   # Zod schemas for message/conversation input
├── serialization.ts                # Date serialization for client transfer
├── config.ts                       # Conversation types, roles, statuses, file limits, socket events, RBAC
├── types.ts                        # 20+ TypeScript DTOs and type definitions
├── content.tsx                     # Server component (entry point, data fetching, layout hint)
├── messaging-client.tsx            # Orchestrator: list + thread cache, outbox, realtime, polling; renders ONE width
├── desktop-view.tsx                # Split-pane (contacts + thread + info panel) — lazy chunk, md+ only
├── mobile-view.tsx                 # Five-tab shell / open thread — lazy chunk, <md only, keyboard-aware height
├── socket-message.ts               # Socket payload → MessageDTO, temp-id helpers, server-row merge (dedupe by id + nonce)
├── conversation-info-panel.tsx     # Conversation details panel (participants, media, actions)
├── chat-interface.tsx              # Desktop thread view (pure: no socket, no poller, no queue)
├── message-list.tsx                # Scrollable message list
├── message-group.tsx               # Grouped messages by sender
├── message-bubble.tsx              # Individual message bubble (with WhatsApp status)
├── message-input.tsx               # Compose area with attachment support
├── message-search.tsx              # Message search overlay
├── new-conversation-dialog.tsx     # Create conversation dialog (direct + group tabs only)
├── auto-scroller.tsx               # Auto-scroll to latest message
├── empty-state.tsx                 # Empty state placeholder
├── notification-helpers.ts         # Push notification utilities
├── upload-actions.ts               # File upload server actions
├── whatsapp-bridge.ts              # WhatsApp dual-delivery bridge (Evolution API)
├── whatsapp-settings-dialog.tsx    # WhatsApp QR connect/disconnect dialog
├── og-unfurl.ts                    # Server-side Open Graph metadata extraction
├── link-preview.tsx                # Link preview card component
├── mail-icon.tsx                   # Header mail icon with unread badge (polls + Socket.IO)
├── audit.ts                        # Audit logging (13 event types)
├── index.ts                        # Public barrel exports
├── hooks/
│   ├── index.ts
│   ├── use-presence.ts             # Online/offline presence tracking hook (Socket.IO events)
│   ├── use-thread-sync.ts          # The open thread: socket room, adaptive polling, mark-as-read (both widths)
│   ├── use-layout-mode.ts          # "mobile" | "desktop" from a server hint, corrected by matchMedia
│   └── use-visual-viewport.ts      # Shell height while the on-screen keyboard is up
├── contacts/
│   ├── config.ts                   # Role-based contact categories + sidebar filters
│   ├── types.ts                    # ContactDTO, ContactCategory, SidebarFilter types
│   ├── queries.ts                  # Contact queries with domain model enrichment
│   ├── contacts-panel.tsx          # WhatsApp-style contacts sidebar
│   ├── contact-card.tsx            # Individual contact card
│   └── contact-search.tsx          # Contact search input
├── mobile/                         # WhatsApp design atoms — both widths share these
│   ├── ios-chat-list.tsx           # Conversation list (<md)
│   ├── wa-tokens.ts                # Generated icon/dimension/type tokens
│   └── chat/                       # Conversation view (<md) + shared chat atoms
│       ├── messages-view.tsx       # Composes the phone view; owns scroll + paging
│       ├── adapt.ts                # MessageDTO[] → ChatItem[] for that view
│       ├── encryption-notice.tsx   # Cream E2E card — used by both widths
│       ├── date-separator.tsx      # Day pill — used by both widths
│       ├── bubble-tail.tsx         # Balloon tail — used by both widths
│       └── chat-wallpaper.tsx      # Wallpaper + WA_CHAT_BG, used by both widths
├── CLAUDE.md                       # Block context for Claude Code
├── ISSUE.md                        # Production-readiness tracker
└── QUERY_OPTIMIZATION.md           # Performance optimization guide
```

### One tree per width, one sync — 2026-09-12

Both width-specific trees used to mount at every width, one hidden by CSS. A
phone therefore ran the desktop split-pane's effects behind `display: none`
(its contacts fetch, virtualizer and scroll listeners), and the phone's thread
only stayed live because the hidden desktop `ChatInterface` held the socket
room, the poller and mark-as-read. Now:

- `content.tsx` guesses the width from the request's client hints
  (`sec-ch-ua-mobile`, user agent) and passes `initialLayout`; the client's
  first render repeats the guess so hydration matches, then `matchMedia`
  corrects it (`hooks/use-layout-mode.ts`). `desktop-view.tsx` and
  `mobile-view.tsx` are `next/dynamic` chunks, so a phone never downloads the
  split-pane.
- `hooks/use-thread-sync.ts` owns the open thread's realtime on both widths:
  the conversation-room listeners, the polling fallback (5 s while the thread
  is active and the tab visible, 12 s after two quiet minutes, nothing while
  hidden, an immediate catch-up on focus / visibility / `online`), and a
  debounced mark-as-read. The poll cursor is the newest **persisted** id —
  the old poller cursored on `temp-…` right after an optimistic send, which
  Prisma rejects.
- The messaging client opens the Socket.IO connection itself when
  `NEXT_PUBLIC_SOCKET_URL` is set. Nothing on this route did before (the
  dashboard header that connects is not rendered here), so the page always
  polled even where a socket server existed.
- The list poll is incremental: `pollConversationUpdates({ since })` returns
  only rows whose `lastMessageAt`/`updatedAt` moved (with a 5 s overlap) plus
  a full unread map; the client merges by id. Every 8th tick is a full
  refresh, catching an edited or deleted last message that moves no row.
- One outbox for both widths, in the orchestrator. An optimistic row carries
  `metadata.clientNonce`; `mergeServerMessages` swaps it for the persisted
  row whichever path delivers that first (send response, socket, poll), and a
  confirm that finds the persisted id already present drops the temp instead
  of renaming it — the rename put two rows under one id. Failed text sends
  show a red mark, retry on tap, and retry on `online`/reconnect up to three
  attempts.
- Server: `sendMessage` authorises against `conversationSendSelect`
  (participants + settings) instead of the detail select that loaded the
  newest 50 messages per send; a text send returns from a single
  `create({ select })` with no re-read; the post-response work (notify,
  mention, WhatsApp, link preview, audit) is scheduled with `after()`; socket
  emits are skipped outside development when no server is configured; the
  cursor query orders by `[createdAt, id]`; `hasMore` counts only non-deleted
  rows; a cursorless poll can page by time so an empty thread sees its first
  reply.

Measured on the demo tenant (`scripts/messaging-mirror-capture.mjs` and
`scripts/messaging-two-party.mjs`, 390×844 @3x, no socket server):

| Check | Result |
| --- | --- |
| DOM on the phone | 523 nodes on the list, 600 on a 51-message thread; no desktop composer mounted |
| Send → bubble on screen | 24–29 ms (desktop 120 ms) |
| Send → server confirm | ~980 ms; one copy after the next poll tick |
| Composer after send | empty and still focused |
| Older page prepended (51 → 101) | anchor drift 0 px, 0 duplicates, no long tasks |
| Server actions in a 16 s window | 3 thread polls + 1 list poll (one poller per thread) |
| Incoming while scrolled up | scrollTop unchanged, jump button badge 1, arrives within the 5 s poll |
| Console on the route | none (the `ws://localhost:3001` attempts are the local `NEXT_PUBLIC_SOCKET_URL`) |

### Chat surface fidelity (2026-09-10)

The conversation view's skin is measured against a real WhatsApp capture
(`public/whatsapp/IMG_2591.PNG`, a 3x iPhone screenshot) rather than eyeballed.
Values that came out of that measurement, and should not drift:

| Element | Value |
| --- | --- |
| Wallpaper tile | `432px` pitch, `/icons/whatsapp/wp-wa-chat-bg.svg` |
| Outgoing balloon | `--wa-surface-baloon-me: #d8fdd2` |
| Encryption card | `--wa-surface-notice: #fff0d3`, text `#0a0a0a`, 14.5px/20px |
| Balloon body | 17px/24px, padding 8px top / 9px sides / 7px bottom |
| Balloon clock | 12px |
| Day pill | 13px/15px semibold, no border, 19px tall |
| Composer field | 17px/21px, `min-h-[31px]`, `py-[5px]` |

**The wallpaper is one seamless pattern tile.** The doodle art is a 540x981
image that fills exactly one tile; the SVG's canvas is that tile and nothing
else, so `background-repeat: repeat` at `432px auto` joins invisibly. It was
previously a 393x852 canvas holding a 432-wide pattern, tiled at `412px` — two
mismatched pitches, so every repeat chopped the doodles mid-stroke. If the
wallpaper is ever regenerated, keep canvas == tile, and keep the four call
sites (`chat-wallpaper.tsx`, three layers in `message-list.tsx`, and
`.wa-doodle-bg` in `globals.css`) on the same pitch.

Strokes look lighter here than in the capture. That is the capture being 3x,
not a defect — rendered at the art's native resolution the stroke measures
`#E9E3D9`, against the reference's `#EAE0D4`.

Two deliberate departures from the capture, both standing decisions: balloon
sides stay **logical** (Arabic mirrors the thread), and the desktop header
carries **no call buttons** while there is no telephony backend.

Tests live in `src/tests/school-dashboard/messaging/` (URL-mirror convention):
`actions`, `authorization`, `multi-tenant`, `validation`, `whatsapp-bridge`,
`link-preview`, `rtl-verification` — plus `src/tests/lib/whatsapp/` for the
Evolution client retry policy.

### Status

**Completion:** 100% code | **Status:** 🟢 CODE PRODUCTION-READY, blocked on ops only (hardened 2026-06-05, perf+WhatsApp pass 2026-06-12)

Application code is production-ready. The 2026-06-05 pass added group-WhatsApp delivery+retry, a durable rate limiter, correctness fixes, and removed ~1,740 lines of dead code. The **2026-06-12 pass** fixed the dead raw SQL (unread counts + full-text search referenced unmapped table names and could never run), Arabic search, webhook dedup/group-sender/status-sync, unified phone normalization, bounded notification retries, added 6 DB indexes (incl. GIN FTS + a unique direct-pair dedup index), and removed the typing/socket re-render cascades client-side. The feature is **not live end-to-end** until ops completes: the Socket.IO server is not deployed (tracked in [#262](https://github.com/databayt/hogwarts/issues/262)), so realtime currently falls back to polling, and the inbound/realtime ops secrets (`WHATSAPP_WEBHOOK_SECRET`, `EMIT_SECRET`, `SOCKET_SECRET`, `NEXT_PUBLIC_SOCKET_URL`) are unset. The unit suite is **green (221/221 as of 2026-06-12)**. See `ISSUE.md` → "WhatsApp Activation Balance" for the exact remaining ops steps.

### WhatsApp Integration

Messages sent in-app are automatically dual-delivered to WhatsApp when the school has an active WhatsApp session. The integration is bidirectional -- incoming WhatsApp replies are bridged back into conversations. The WhatsApp connect dialog (QR) and per-conversation `W` toggle are embedded directly in the messaging UI.

**Key files:**

- `whatsapp-bridge.ts` -- Dispatch, phone resolution (Guardian > Teacher > StaffMember), retry with exponential backoff
- `src/lib/whatsapp/evolution-client.ts` -- REST client for self-hosted Evolution API
- `src/app/api/webhooks/whatsapp/route.ts` -- Webhook handler for incoming messages and status updates
- `src/app/api/cron/process-whatsapp-notifications/route.ts` -- Retry failed dispatches every 5 minutes

**How it works:**

1. `createConversation()` checks for active WhatsApp session -- auto-enables if connected
2. `sendMessage()` calls `dispatchMessageToWhatsApp()` non-blocking when `conversation.whatsappEnabled`
3. Phone numbers resolved from domain models: Guardian > Teacher > StaffMember, then normalized to canonical digits-only form (`formatPhoneForWhatsApp` strips `+`/`00`/spaces) — the same form the inbound webhook uses to resolve senders
4. Rate limited: 1 msg/sec, 500 DMs/day per school
5. Failed dispatches retried with exponential backoff (max 5 attempts) -- **1:1 (Message scalars) AND group (per-recipient `MessageWhatsappDelivery` rows)** as of 2026-06-05; notification-channel sends get the same bounded retry (metadata counter) as of 2026-06-12
6. Chat header has a **W** toggle to enable/disable per conversation
7. Message bubbles show WhatsApp delivery status (sent/delivered/read/failed)

### Integration Points

- `src/components/school-dashboard/communication/` -- Broadcast and announcement system
- `src/components/school-dashboard/notifications/` -- `notification-helpers.ts` produces `message` / `message_mention` notifications on new messages
- `src/lib/whatsapp/` -- WhatsApp Evolution API client, rate limiter, templates
- `src/components/school-dashboard/whatsapp/` -- WhatsApp admin dashboard (QR connection, groups, templates)
- Route: `src/app/[lang]/s/[subdomain]/(school-messaging)/messages/page.tsx`
- Header icon: `mail-icon.tsx` with unread badge (fetches `/api/messages/unread-count` on mount + focus, increments via Socket.IO)
- Prisma models: 12 in `prisma/models/messages.prisma` (Conversation, ConversationParticipant, Message, MessageAttachment, MessageReaction, MessageReadReceipt, TypingIndicator, MessageDraft, PinnedMessage, ConversationInvite, StarredMessage, **MessageWhatsappDelivery** — group WhatsApp per-recipient delivery); WhatsApp models (WhatsAppSession, WhatsAppMessage, …) in `prisma/models/whatsapp.prisma`

### Agents & Skills

- `agent:nextjs` — Socket.io + webhook routes
- `agent:react` — messaging surface
- `agent:comment` — copy + i18n strings
- `skill:/wire` — UI layer sweep
- `skill:/check` — quality gate

### Mobile chat chrome — the icons are the originals (2026-09-10)

`public/icons/whatsapp/` now holds the seven originals Abdout captured (`public/whatsapp/ico-*.svg`):
chevron-lt, phone, video, plus-input, mic, camera-small, sticker. The previous copies were
tight-bbox crops — `ic-wa-chevron-lt-32.svg` in particular drew an L-corner, not a chevron, which
is why `top-contact-header.tsx` carried a hand-drawn inline polyline. All seven now sit on the
32x32 grid the reference uses (the video original ships on a 26x17 canvas and was re-homed).

Rendered through `WaIcon`'s mask mode so the `--wa-*` tokens drive the colour and dark mode still
works: chevron and the input-bar glyphs read primary, the call buttons read secondary. They were
`tint={false}` before, which pinned them to whatever colour sat inside the file.

The conversation header dropped its bottom hairline (the footer panel has none) and the
"tap here for contact info" subtitle, whose dictionary key is gone from both languages.
Swapping the sticker `<img>` for a mask `<span>` grew the message field's automatic minimum size
and pushed the mic off-screen, so the field now carries `min-w-0`.

### The Arabic face is the phone's own system font (2026-09-10)

WhatsApp on iPhone is a native UIKit app drawing in the system font, so its Arabic
is whatever iOS hands a system-font label. Since iOS 16 that is **SF Arabic**, which
Apple's Human Interface Guidelines list beside SF Pro: "San Francisco (SF) is a sans
serif typeface family that includes the SF Pro, SF Compact, SF Arabic, SF Armenian,
SF Georgian, SF Hebrew, and SF Mono variants." Apple describes it as "a contemporary
interpretation of the Naskh style."

We do not ship the file, and cannot: Apple's SF Arabic license forbids embedding the
font in a product or using it to produce website content. The family is also installed
dot-prefixed (`.SF Arabic`), so naming it in CSS reaches nothing — measured, a rule of
`font-family: "SF Arabic"` falls through to Geeza Pro.

So the block asks the platform for its system font and lets per-glyph fallback do the
rest. `.font-ios-system` in `globals.css` sets the stack, and the `(school-messaging)`
layout wrapper carries the class. Verified on the live `/ar/messages` page with
`CSS.getPlatformFontsForNode`: Arabic renders in `.SF Arabic`, Latin in `.SF NS` —
the real system faces, no download. The class sets `font-family` as well as the
`--font-sans` token, because `body` computes its family once and descendants inherit
the computed string, so a token override alone would have changed nothing.

Off Apple hardware the browser supplies its own system Arabic UI face, which is what
WhatsApp Web does too. Everywhere outside this route the app keeps Thmanyah for Arabic.

Note `WA_TYPOGRAPHY.family` in `mobile/wa-tokens.ts` still reads `"SF Pro Text"` from
the Figma extraction. Nothing consumes it; the CSS class is the live source.

## Demo inboxes (seed)

`prisma/seeds/messaging-demo.ts` gives the accounts a demo is actually driven from
a populated inbox. The generic `prisma/seeds/messages.ts` pairs teachers and
students at random, which left `student@` with one thread and `teacher@` /
`parent@` with one apiece.

The pass resolves counterparts from the real graph — the student's own section
teachers (by timetable slot, so the copy names the subject that teacher really
teaches), their homeroom teacher, their classmates, the school admin — then
writes authored multi-turn dialogues rather than disconnected one-liners. Threads
land across today, yesterday, this week and last week; a few stay unread and one
is pinned so the Unread and Favourites filters have content.

Read state is expressed by moving `ConversationParticipant.lastReadAt`, never by
`Message.status`: unread is derived as `message.createdAt > lastReadAt` in
`getUnreadCountsPerConversation`. A dialogue that ends on the reader's own reply
is always written as read.

Run it alone with `pnpm db:seed:single messaging-demo`. It is idempotent —
direct threads are guarded by participant pair, groups by title, and an existing
conversation is never rewritten.

### Unread counts reach the list

`getConversationsList` (and the polling twin) now attach a per-row `unreadCount`
for the reader via `getUnreadCountsPerConversation`. The list select carries
participant rows but never carried an unread figure, so `conv.unreadCount` was
`undefined` on the client: the mobile Unread filter matched nothing on load and
no row drew a badge until a live socket event incremented a counter.

## The mobile chat header is liquid glass over the wallpaper

Measured off `public/whatsapp/IMG_2634..2637` (iOS, 3x, 390pt wide):

| Element | Geometry |
| --- | --- |
| Back disc | 44px circle, 16px from the leading edge |
| Avatar | 40px, 9px after the disc, name 10px after that |
| Name / subtitle | 17px semibold over 13px secondary |
| Call capsule | 102 x 44, 16px from the trailing edge |
| Capsule glyphs | video ink 27 x 21, phone ink 21 x 21, 27px of air between |

The header has no bar of its own. The wallpaper runs to the top of the screen
and the thread scrolls under the controls, so `TopContactHeader` is positioned
out of flow and the scroller carries its height as `padding-top` — padding on
the scroller keeps `scrollHeight` whole, which the prepend anchor in
`messages-view.tsx` measures.

Behind the controls sits `.wa-scroll-edge`, a frosted strip (blur, the
wallpaper's cream at partial alpha, feathered by a mask) so bubbles that
scroll under the header fade out instead of showing through the name —
IMG_2637 clips its top bubble at that band the same way. Without it a long
thread drew the contact's name over message text.

The material and the 44px size are the toolbar instantiation of Figma node
`1:59`, the same one `ios-header.tsx` carries, so the back disc lands at the
same y as the chat list's buttons. The capsule has no kit variant of its own —
it is that material at one width. The one addition is `.wa-glass-chat`, which
swaps the fill for `--wa-glass-bg-chat`: WhatsApp's glass is adaptive and a
flat token cannot be both surfaces, reading `#f1f1f1` over the near-white chat
list but a warm white over a thread's wallpaper.

Two other things came off the same captures. The thread's opening date pill
sits **above** the encryption card, and that card is 280px wide, not the full
column. And the mic in the input bar is a filled product-green disc with a
white glyph, not a bare one.

The composer behaves like the app's (2026-09-12): the field grows to about
five lines then scrolls inside, a tap on send / camera / mic cancels its
pointer-down so the keyboard stays up, the caret is product green, a draft
survives leaving the thread (per conversation, `sessionStorage`), typing
start/stop go out while a socket is connected, and while the on-screen
keyboard is up the whole view is sized to `window.visualViewport` so the
composer sits on the keys and the last message stays just above them.
Return on a touch keyboard inserts a line, as in the iPhone app; Enter on a
hardware keyboard sends, as on WhatsApp Desktop. Bubble text is `dir="auto"`,
so an Arabic message is right-aligned inside the English UI and an English one
left-aligned inside the Arabic UI, exactly as the captures show. Ticks: clock
while sending, a single tick once the server has it, the double tick only on
`message:delivered` from the socket server, blue on read.

**Do not sample a vivid colour straight out of those PNGs.** iOS writes Display
P3, and a reader that ignores the profile turns the brand green into a muted
`#51A768`. Greys and near-whites survive the round trip; saturated colours do
not.

## The mobile shell has five tabs, not one

`mobile/ios-shell.tsx` owns which tab is showing, draws the floating tab bar
once, and swaps the body beneath it. Before this, `activeTab` lived inside
`ios-chat-list.tsx` together with the bar, so Updates, Calls, Communities and
Settings were drawn but inert — there was nowhere for another body to come
from. The chat list is now the Chats body and nothing more.

| Tab | Page | Data |
| --- | --- | --- |
| Chats | `ios-chat-list.tsx` | conversations (already in the client) |
| Updates | `mobile/tabs/updates-view.tsx` | announcements, via `getMobileUpdatesFeed` |
| Calls | `mobile/tabs/calls-view.tsx` | the viewer's live classes, via `getMobileCallsFeed` |
| Communities | `mobile/tabs/communities-view.tsx` | the same conversations, read as rooms |
| Settings | `mobile/tabs/settings-view.tsx` | the viewer's name, bio and avatar |

Structure came from the WhatsApp community file's own `Updates`, `Calls`,
`Communities` and `Settings` frames (file `EKXg4Ib9flIgtjIVgPXqxl`, page
`13:1317`). That file is the **previous** WhatsApp design — solid bars and a
labelled tab bar — so only the structure was taken. Every page wears the
floating `IosHeader` and the liquid-glass tab bar this app already ships.

Three decisions worth keeping:

- **Nothing inert.** The reference's My status row, Channels section and Add
  favourite row are all left out; each would be a control that does nothing in
  a school.
- **Updates is audience-scoped, and has to be.** `/api/mobile/announcements`
  filters on `published` alone, which would show a student the staff-only
  notices. `getMobileUpdates` narrows to school-wide, the viewer's role, and
  the viewer's own classes — with ADMIN and DEVELOPER seeing everything.
- **Calls does not pretend to be a phone log.** Incoming, outgoing and missed
  have no meaning for a scheduled class, so the outcomes are attended, missed,
  upcoming and live. Missed is drawn in red exactly as the reference draws a
  missed call.

Both data pages fetch lazily on first open through a server action rather than
riding along with the conversation list. Two extra queries on every messages
page load would slow the primary surface down for secondary ones. A page that
has been opened once then stays mounted, hidden by `display`, so the fetch
really does happen once and a page keeps its scroll position across switches.
