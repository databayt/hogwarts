<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Chatbot — issues

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

- Conversation is not persisted across reloads.
- Mode selection (`promptType` → prompt) has no test.
- `how do I set up the timetable` → get-started (keyword weight, see README).
- Rate limit is per-process unless `UPSTASH_REDIS_REST_URL` is set in prod —
  verify on the Cloudflare container.
- Verify streaming end to end on prod (Worker → container must not buffer).
