<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Chatbot — issues

## Done 2026-11-03 — the Claude lane is on (key, smoke, eval, deploy)

- Key `hogwarts` in its own Console workspace `hogwarts-chatbot` with a
  $20 monthly spend limit, the backstop above the app's $18 cap. It is
  stored in the Keychain as `cf-hogwarts-CHATBOT_ANTHROPIC_API_KEY` and as
  the Worker secret.
- `claude-smoke.ts`: run 1 wrote 25,436 tokens to the cache ($0.0033); run 2
  read them ($0.00043, first token after 1.1 s).
- `eval.ts` first scored 80 % guide accuracy, under both the 90 % gate and
  the matcher's 85 %. The answers were right, but 7 of the 8 misses had no
  tag: rule 2's "answer first" let a yes/no, a price or a one-line reply
  open with the answer and skip rule 1's `[[guide:…]]` line. `f00fe2855`
  makes the tag the first line of every reply. Two runs since: **95 %
  guide, 100 % language, PASS** (about $0.015 a run). The two misses left
  are a reasonable exams/grades call and one Arabic sales question about
  security.
- The prod tables from phase 2 exist (`chatbot_threads`,
  `chatbot_messages`, `chatbot_notes`, `chatbot_profiles`; checked
  2026-11-03), so that DDL is no longer owed.
- **The Claude lane is ON in prod**: Worker `f7a980f8` (source `f00fe2855`,
  the 11-01 app plus this fix), new container live at 10:01 CAT. The flag
  `CHATBOT_CLAUDE_ENABLED=1` is baked from the Keychain item
  `cf-hogwarts-CHATBOT_CLAUDE_ENABLED`, so later builds keep it. A first
  attempt was killed partway through `next build` by Claude Code's
  low-memory reaper (8 sessions open, a food build alongside). The rerun
  used `NEXT_BUILD_CPUS=1`: 29 min of build, then smoke, then deploy on the
  first push.
- Verified on prod:
  - `/api/chatbot` returns `done.provider: "anthropic"` with no fallback.
    The `delta` events are spread over the reply (14 to 25 per answer) and
    there is no `content-encoding`. That closes "verify streaming end to
    end".
  - SaaS bot: "Is our data safe?" in English gets the security guide card.
    Arabic pricing for 300 students gets 4,800 SAR a year. "Add a teacher"
    in English gets the video, 3 screenshots and the guide.
  - Desk on kingfahd, after the admin login lands on Overview: Arabic "how
    do I add a teacher" gets 6 steps with bold button names, the video,
    the screenshots and the Open page / Open guide buttons.
  - `ai_usage_logs` holds 4 platform `chatbot` rows, $0.007 in total, and
    the $18 cap reads them.
- Latency: a warm answer starts in about 1.9 s. The first answer in a
  language after the 5-minute cache has lapsed starts in 6–7 s, because it
  rewrites the 25K-token help center.

## Done 2026-10-21 — fewer taps (phase 5)

- Page-aware first quick ask and answers (`routes:` on 15 guides).
- "Open <page>" card on the desk; help-center links open in a new tab.
- 👍/👎 → resolved / one-tap next steps; Report prefilled with the question
  only (verified in the browser: dialog opened, thread ESCALATED, -1 saved).
- `review-feedback.ts`. Claude's `[[choose:…]]` emits a `choices` event —
  the chips UI for it is still owed.

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

- Cold first answers: with sparse traffic the 5-minute cache often lapses,
  so a visitor waits 6–7 s and the answer pays a $0.0033 cache write. A
  1-hour cache TTL (write at 2× input instead of 1.25×) would cut that.
  Measure the read/(read+write) ratio from `chatbot_messages` after a week
  first (the decision's bar is 0.6).
- Learned notes and recall (phase 4): unblocked now that the Claude lane is on.
- Choice chips for Claude's `[[choose:a,b]]` (the `choices` event is sent, not drawn).
- Prompt templates still ship in the client dictionary chunk (phase 3 moves
  them server-side).
- `src/lib/rate-limit.ts` `getRateLimitKey` and `report-issue.ts` still key on
  the head of X-Forwarded-For (outside the chatbot; same fix as here).
- Dev only: the Next.js dev badge sits over the RTL floating button.
