<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Chatbot — issues

## Done 2026-10-21 — the Claude lane, dark (phase 3)

- Claude Haiku 5.5 behind `CHATBOT_CLAUDE_ENABLED`, its own key, a ledger
  that fails closed, a breaker, and the ladder Claude → Groq → guide steps.
- Whole help center in a cached block shared by every bot and school; the
  answer names its guide on the first line and the cards follow it.
- Usage and cost saved on every answer (`chatbot_messages`) and in
  AIUsageLog (platform rows) — the cap reads the latter.
- `scripts/chatbot/eval.ts` (40 questions, ar/en, dialects, off-topic) and
  `scripts/chatbot/claude-smoke.ts` (cache proof) — need the key to run.
- Decision recorded in kun (D-20261021-included-api-credits-for-hogwarts-chatbot);
  funnel doctrine amended.

## Done 2026-10-21 — memory and the chats sheet (phase 2)

- Conversations are saved (profiles, threads, messages, notes tables) and come
  back after a reload; the history the model reads is the thread's, from the
  database — the route rejects a client-sent history.
- Menu button → chats sheet inside the panel: search, day groups, open,
  rename, delete, delete all, forget this device (visitors).
- Visitors are a hashed host-only cookie; 90-day purge cron at 02:00.
- Saving never blocks an answer; a stale or foreign thread id starts a new chat.
- Model down + guide matched → the guide's own steps; Groq gets no retries.
- A new question owns its topic: earlier messages only fill in for a bare
  follow-up (attendance after add-student used to get add-student's cards).
- Assistant guide: the menu, Stop, and "Your chats and privacy" (ar + en).
- Browser pass on localhost: SaaS en (answer, reload restore, sheet, second
  chat, delete) and the desk ar at 1280 and 390 px.
- Tests: 175 (identity, threads, actions, route, retention, sheet in panel).

## Done 2026-10-21 — P0 hardening + the new panel

- Real questions reach the guides: the help index fires only for its chip or a
  bare help phrase ("Can you help me add a student?" used to get the list).
- The desk keeps every guide step: the WhatsApp line cut now targets the
  contact ask itself and never runs on the desk.
- The desk answers members of the school the Host names (or DEVELOPER) only.
- Tenant and mode come from the Host; a body `subdomain` that disagrees is 400.
- Rate limits key on `cf-connecting-ip`; public school sites get a 300/h ceiling.
- The public school bot no longer prints staff announcements, placeholder fee
  rows or the plan quota; registration fee is labelled as such; school text is
  cleaned, capped and fenced as data.
- Capture: newest message only, one row for phone-then-email, never regresses
  a lead's status, appends notes, survives the create race, runs in `after()`.
- Term-only matches need two shared words or one rare one; screen words
  ("page", "button") don't count; the desk never matches the sales guides.
- Server-sent events with token streaming, `no-transform`, 25 s model deadline,
  one retry; cut-off answers say so and offer Retry.
- New panel: a real dialog (title, Escape, focus return), header with new chat
  and close on desktop too, persistent on desktop while the member works the
  page, modal full screen on phones above the keyboard, typing dots, Stop,
  markdown with bold button names, scroll that follows only at the bottom,
  allow-listed links, one error presentation. `chat-window.tsx` is gone.
- Tests: support 80, capture 16, prompts 7, server 12, stream 6, markdown 13,
  panel 7 (incl. an axe audit).

## Done 2026-10-19 — optimization pass

- Replies stream from `POST /api/chatbot` (was a blocking `generateText`
  Server Action); `server.ts` holds the logic, `replyStream()` releases whole
  lines so the markdown strip / repeat-ask cut still apply.
- Prompt templates no longer reach the browser: `chatbot.tsx` strips the
  server-only keys from the dictionary prop. The 135-key `DEFAULT_DICTIONARY`
  client copy and the unused `dictionary-client.ts` loader are deleted.
- The school-site read is cached per subdomain (5 min, tag
  `chatbot-school:<subdomain>`) and shared by page render and every message.
- The client sends only the last 10 turns.
- Visitor-facing replies moved to `chatbot.reply*` dictionary keys; the
  contact email is one constant (`CONTACT_EMAIL`).
- `matchTopics` also scores the guide's own title + summary words (stemmed,
  IDF-weighted) as tie-breaker and fallback, with a noise floor.
- New guide `support/assistant` (ar + en) — the user-facing page for the bot.

## Open

Plan: `~/.claude/plans/read-hogwarts-chatbot-idempotent-micali.md` (phases 3–6).

- **Prod DDL owed before the phase-2 deploy:** apply
  `prisma/migrations/20261021150000_chatbot_memory/migration.sql` out-of-band
  (Neon branch first). Until then prod answers but saves nothing, and the
  chats sheet shows "Couldn't load your chats".
- **Groq's free tier is spent by midday:** on 2026-10-21 `gpt-oss-20b` hit its
  200K tokens/day (TPD) cap on the key prod shares with mkan. Members get the
  guide steps meanwhile. The Claude lane is built (phase 3); it waits on
  Abdout's key (`cf-hogwarts-CHATBOT_ANTHROPIC_API_KEY`), then the smoke run
  and the eval, then `CHATBOT_CLAUDE_ENABLED=1`.
- Learned notes and recall (phase 4); page-aware answers, feedback, next steps
  (phase 5).
- Prompt templates still ship in the client dictionary chunk (phase 3 moves
  them server-side).
- Verify streaming end to end on prod: `curl -N` must show `delta` events
  spread over time with no `content-encoding`.
- `src/lib/rate-limit.ts` `getRateLimitKey` and `report-issue.ts` still key on
  the head of X-Forwarded-For (outside the chatbot; same fix as here).
- Dev only: the Next.js dev badge sits over the RTL floating button.
