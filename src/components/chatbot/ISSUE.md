<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Chatbot — issues

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

Plan: `~/.claude/plans/read-hogwarts-chatbot-idempotent-micali.md` (phases 2–6).

- Conversations are not persisted across reloads (phase 2: threads, the chats
  sheet, the anonymous visitor cookie, 90-day purge).
- Claude Haiku 5.5 on the included API credits, $20/month cap, Groq fallback
  (phase 3) — waits on the /decide record and a dedicated key.
- Learned notes and recall (phase 4); page-aware answers, feedback, next steps
  (phase 5).
- Prompt templates still ship in the client dictionary chunk (phase 3 moves
  them server-side).
- Verify streaming end to end on prod: `curl -N` must show `delta` events
  spread over time with no `content-encoding`.
- Browser pass of the new panel owed (port 3000 was held by another session
  on 2026-10-21; jsdom + axe tests cover it meanwhile).
- `src/lib/rate-limit.ts` `getRateLimitKey` and `report-issue.ts` still key on
  the head of X-Forwarded-For (outside the chatbot; same fix as here).
