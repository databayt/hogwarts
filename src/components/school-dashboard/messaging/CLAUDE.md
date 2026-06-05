---
epic: 06
sprint: Q3-2026
title: Messaging
file_type: claude
owner: Abdout
maturity: Built+Polish
completion: 90
tracker: https://github.com/databayt/hogwarts/issues/324
docs: https://ed.databayt.org/en/docs/messages
last_audited: 2026-05-25
---

# Messaging Block

## Context

Real-time messaging for a school: 1:1 direct + group chats, with file attachments, reactions, read receipts, search, typing/presence, and WhatsApp dual-delivery. ~13k LOC across 80 files — a large, polished block with **no TODO/stub markers**. **Status: 100% code, 0% ops** — code has been frozen since 2026-04-25 and is multi-tenant-solid, but it is **not live end-to-end**: the Socket.IO server isn't deployed (#262), so realtime is on a polling fallback, and several ops env vars are unset. The unit suite is currently red (18 failing / 192 passing — fixture gaps, not bugs). Read `ISSUE.md` before assuming anything is "shipped." Note the directory is `messaging/`, but the route is `/messages` under the `(school-messaging)` route group.

## Before You Start

1. Read `ISSUE.md` here — the production-readiness tracker (P0 group-WhatsApp join table, P1 ops blockers/#262, P2 + i18n debt, optimization backlog, test status)
2. Read `README.md` here for the file inventory, routes, and WhatsApp flow
3. Read `QUERY_OPTIMIZATION.md` before touching `queries.ts` — documents the raw-SQL unread-count fix, cursor pagination, and index strategy
4. WhatsApp work spans 3 places: this block's `whatsapp-bridge.ts`, `src/lib/whatsapp/`, and `src/app/api/webhooks/whatsapp/route.ts`

## Key Decisions

- **Not the DataTable triplet.** This is a chat UI (split-pane: contacts/conversation list + chat interface + info panel), so there's no `*-content/*-table/*-columns`. Server entry is `content.tsx`; client orchestrator is `messaging-client.tsx`.
- **Realtime = Socket.IO (external `socket-server/`) with a polling fallback.** When the socket is disconnected, the client polls every 15s (list) / 10s (active conversation). Server→client pushes go through `POST /api/emit*` guarded by `x-emit-secret`.
- **Only `direct` + `group` are creatable.** `class`/`department`/`announcement` are in the enum + RBAC config but have no creation UI.
- **WhatsApp status on `Message` is scalar → 1:1 only.** Group delivery is logged per-recipient in `WhatsAppMessage`; group retry is intentionally not wired (needs a join table — P0).
- **Client UI is dictionary-keyed** (dedicated `messaging` namespace), but server errors + `validation.ts` still hardcode English (i18n debt, see ISSUE.md).
- Message bodies have **no `lang` field** by design — user-to-user content, translated on demand at render, not stored bilingually.

## Danger Zones

- **Multi-tenant scoping is the block's strongest property — keep it that way.** Every action calls `getTenantContext()` and returns `actionError(ACTION_ERRORS.MISSING_SCHOOL)` when absent; every query filters by `schoolId` directly or via `conversation: { schoolId }`. Actions that take raw IDs (`forwardMessage`, `pollNewMessages`, `removeReaction`) re-assert `schoolId`. Don't add a query path that skips it — `__tests__/multi-tenant.test.ts` guards this.
- **`whatsapp-bridge.ts` group path:** do not "fix" the 1:1-only scalar mirroring by writing group status to `Message` — that reintroduces the last-writer-wins corruption patched on 2026-04-22. The correct fix is the `MessageWhatsappDelivery` join table (needs migration approval).
- **Ops env vars fail closed in production:** the webhook (`WHATSAPP_WEBHOOK_SECRET`) and cron (`CRON_SECRET`) refuse to run when unset. Don't loosen these to "make it work" — set the env vars (#262).
- **Subdomain URLs:** conversation switching uses clean `/${locale}/messages` paths via `history.replaceState` — never introduce `/s/${subdomain}/`.
- **Socket events are conversation-scoped:** emit functions key off `conversationId`/`userId` after schoolId validation. Don't broaden room membership without re-checking tenant.

## Related Blocks

- [School Dashboard](../CLAUDE.md) — parent block
- [Notifications](../notifications/CLAUDE.md) — messaging produces `message` / `message_mention` notifications via `notification-helpers.ts` (one-way producer)
- [WhatsApp](../whatsapp/CLAUDE.md) — admin dashboard for QR connection, groups, templates; shares `src/lib/whatsapp/` + the Evolution client

## After You Finish

1. Update `ISSUE.md` — check off completed items, adjust the test-status line, update the optimization backlog
2. Update `README.md` if the file structure, routes, or action/query counts changed
3. Re-run `pnpm exec vitest run src/components/school-dashboard/messaging` and update the failing count
4. Run `pnpm tsc --noEmit` to verify no regressions
5. Test: `admin@databayt.org` (pw: 1234) on `demo.localhost:3000/messages`
