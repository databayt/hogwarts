<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Chatbot

A floating AI assistant mounted on the **public marketing layouts** (no auth)
and, as a tech-support desk, in the **school dashboard** (signed in). It runs in
three modes from the same component, decided by `promptType`:

| Mode            | `promptType`    | Mounted at                                               | Audience                          |
| --------------- | --------------- | -------------------------------------------------------- | --------------------------------- |
| **SaaS**        | `saasMarketing` | `app/[lang]/(saas-marketing)/layout.tsx`                 | School owners evaluating Databayt |
| **School site** | `schoolSite`    | `app/[lang]/s/[subdomain]/(school-marketing)/layout.tsx` | Prospective parents/students      |
| **Support desk** | `schoolSupport` | `app/[lang]/s/[subdomain]/(school-dashboard)/layout.tsx` | Signed-in admins, teachers, parents |

The support desk (2026-10-17) re-reads the member's role and school from
`auth()` on every message (`supportMember` in `server.ts`) — the client's
`supportRole` prop only picks the quick asks. It matches up to 3 guides with a
boost for the member's audience (`matchTopics(texts, n, role)`), lists only that
audience's guides, never captures or asks for contact details, rate-limits per
user, and points uncovered problems to **Report an issue**. Help-center links
carry the main-domain origin: a school subdomain has no `/docs` route.

Answers come from Groq (`openai/gpt-oss-20b`, override `GROQ_CHAT_MODEL`; `llama-3.1-8b-instant` was retired by Groq) via the AI SDK, **streamed**
(2026-10-19) from `POST /api/chatbot`. The **system prompt _is_ the knowledge
base** — it's assembled server-side and never shipped to the client; only the
assistant's reply crosses the wire. `chatbot.tsx` strips the prompt keys
(`*Prompt*`, `schoolHeader*`, `schoolPhrase*`, `role*`, `reply*`) from the
dictionary before it becomes a client prop.

### Request flow (2026-10-19)

1. `use-chatbot.ts` POSTs the last 10 turns to `/api/chatbot` (`app/api/chatbot/route.ts`).
2. `prepareChat()` (`server.ts`, server-only) does sign-in check (desk), rate
   limit, capture, topic match, cards and the system prompt — and returns a
   plan: `error` (4xx JSON, localized), `reply` (answered in code) or `model`.
3. The route `streamText`s the model; `replyStream()` writes one JSON line of
   `ChatMeta` (cards + localized fallback) then the reply **a line at a time**,
   so the markdown strip and the repeat-ask cut still apply. An empty or failed
   stream sends the fallback — never an empty bubble.
4. The hook shows the bubble on the first line and grows it as lines arrive.

## Structure

```
chatbot/
├── chatbot.tsx          # Server entry — loads dictionary + school context, renders content
├── content.tsx          # Client shell — wires button + window + useChatbot hook
├── chat-button.tsx      # Floating FAB (robot, or school logo on tenant sites)
├── chat-window.tsx      # The panel: messages, quick-asks, CTA chips, input pill, mic
├── use-chatbot.ts       # Client state hook — streams from /api/chatbot
├── server.ts            # server-only — prepareChat, replyStream, cached school read
├── capture.ts           # Funnel capture — deterministic identifier extraction → Prospect upsert
├── prompts.ts           # buildSaasMarketingPrompt / buildSchoolSitePrompt (data → prompt)
├── constant.ts          # Positions, sizes, CONTACT_EMAIL, history window, pricing-nudge config
├── pricing-nudge.tsx    # One-shot proactive open on /pricing (30s, cooldown-gated)
├── icons.tsx            # Inline SVGs (Send, Voice, quick-ask category icons…)
├── type.ts              # ChatbotDictionary + props/context types
└── utils.ts             # mergeConfig
```

## Knowledge base

- **SaaS** (`buildSaasMarketingPrompt`): pulls **live** pricing from
  `saas-marketing/pricing/rates.ts` at today's exchange rates (`formatPricing`
  — the formula plus worked examples, since a 20B model computes badly) and the
  85-feature / 10-category catalogue from `saas-marketing/features/constants.ts`
  (`formatFeatures`). Edit marketing config → the bot's facts update with it.
- **Support** (2026-10-10, `support.ts` + `support-media.ts`): one
  `SupportTopic` per help guide under `content/docs-{ar,en}/support/`,
  **generated from the guides** into `support-index.json` by
  `scripts/build-support-index.mjs` (predev writes it, prebuild `--check`s it):
  frontmatter `summary`/`keywords`/`roles`/`flow` + the guide's Steps and Good
  to know sections are the answer — the MDX is the only source. Each
  turn, `matchTopics` picks ≤2 topics (≤3 on the desk): Arabic-normalised
  keyword phrases decide, latest message weighted over the one before; since
  2026-10-19 the guide's own title + summary words (both languages, stemmed:
  article, `ات` plural, English `-s`; IDF-weighted) break ties under the role
  boost and stand in when no keyword hits — with a noise floor, so an
  unrelated question attaches no card; the prompt's `{support}` block
  carries every guide's title + the matched answers. The reply gets
  **resource cards** (`resource-cards.tsx`) built in code, never by the model:
  the guide link, the flow's tutorial video and 3 spaced screenshots, read from
  `docs/media-manifest.json` by flow prefix — a flow /shoot publishes appears
  in the chat with no code change. A how-to question turns the WhatsApp ask
  off; the Support chip's "what can you help with?" is answered in code (the
  guide list + help-center card) because the model invented steps for it.
  **Add a topic:** write the guide MDX (ar + en) with `summary`, `keywords`,
  `roles` frontmatter and a `## Steps` / `## الخطوات` section, list it in
  `support/meta.json`, set `flow` to the /shoot flow slug, run
  `node scripts/build-support-index.mjs`. `roles` also files the guide under
  the docs sidebar's Admins / Teachers / Parents groups.
- **School** (`buildSchoolSitePrompt`): pulls **live** school data via
  `fetchSchoolData(subdomain)` (cached 5 min per subdomain, tag
  `chatbot-school:<subdomain>`, shared by page render and every message) — admissions campaigns, fee structures,
  scholarships, events, announcements, academic levels, contact. All scoped to
  the one school by `domain` lookup.
- Prompt _wording_ (intro, rules, section headers, phrases) lives in the i18n
  dictionary (`internationalization/{en,ar}.json` → `chatbot.*`), so it's fully
  bilingual and translatable. `prompts.ts` only assembles structure + data.

## Key decisions

- **No model in the dictionary / no hardcoded prompts in code.** Prompt text is
  dictionary-driven; data is injected via `{pricing}`/`{features}`/`{schoolName}`
  placeholders. Keep it that way — never hardcode prices or features in code.
- **CTA chips are computed client-side** from `promptType` + school flags, never
  from LLM output. Paths use `/${locale}/…` only (gotcha #11 — no `/s/${subdomain}/`).
- **Generation params** (`app/api/chatbot/route.ts`): `temperature: 0.3`
  (factual, never invent prices) + `maxOutputTokens: 600` (reasoning tokens
  count against it; `reasoningEffort: "low"`) + history trimmed to the last 10
  turns on both client and server.
- **A route handler, not a Server Action** — the one deliberate exception to
  "mutations are actions": the reply streams. Auth and tenant reads stay in
  `server.ts`; the route only validates (Zod) and streams.
- **Visitor-facing replies are dictionary keys** (`chatbot.reply*`): sign-in,
  rate limit, not configured, the four fallbacks, the help-index intro/outro.
  Prompt fragments (`askState`, `formatPricing`) stay in code — model input,
  not UI.

## Capture + rate limit — the funnel surface (2026-08-22)

`/api/chatbot` (formerly the `sendMessage` Server Action) is public and unauthenticated; every call costs a
Groq request — so it now does two things before the model runs:

- **Throttle.** `checkUserRateLimit` keyed on IP + truncated UA, two windows
  (`RATE_LIMITS.CHATBOT` 12/min + `CHATBOT_HOURLY` 120/h). Distributed only when
  `UPSTASH_REDIS_REST_URL` is configured; otherwise per-process counters — on
  Vercel that means burst protection only, so getting `UPSTASH_*` into the prod
  env is the real fix.
- **Capture** (`capture.ts`). A parallel deterministic pass over the user's own
  words: emails and phones (Arabic-Indic digits normalized, conservative E.164 —
  a wrong number is worse than none) upsert a `Prospect` on the same synthetic
  keys as the inbound forms (`inbound:<email>` / `inbound:wa:<e164>`), status
  `replied`, with the last user turns in `notes`. It runs BEFORE the LLM call so
  an identifier survives a Groq outage, never throws, and fires in
  **`saasMarketing` mode only** — `schoolSite` visitors are the school's
  prospective parents, not Databayt's sales pipeline, and they stay out of our CRM.
- **Alert, create-only.** A NEW identifier emails `SALES_NOTIFY_EMAIL`
  (fallback `hi@databayt.org`) with the conversation tail — the reply SLA
  starts at capture, not when someone opens the CRM. `findUnique` before the
  upsert gates it: every later turn re-upserts the same row, and without the
  gate the founder gets one email per message and stops reading them. A mail
  failure never blocks capture; capture never blocks the reply.
- The normalizers live in `@/lib/funnel/identifiers` (ONE implementation,
  shared with the inbox applier and the funnel scripts); this module
  re-exports them.
- Sessions/transcripts are still NOT persisted — capture keeps identifiers, not
  conversations. The `FunnelSession` design lives in kun's `/funnel` runbook §7.

Tests: `src/tests/components/chatbot/capture.test.ts` (12 — extraction, E.164
expansion, Arabic-Indic digits, null-rather-than-guess, and the four
dedup/alert paths with mocked db + mail).

## Input controls (UI)

One rounded pill holds the text input with an inline **mic** (quiet ghost,
pulses red while listening via Web Speech `SpeechRecognition`) and a **filled
primary Send** button. There is **no text-to-speech** control — TTS was removed
2026-06-15 (rarely used, cluttered the control row). RTL: logical props
throughout (`ps-/pe-`), Send icon mirrors via `scale-x-[-1]`.

## Status — 2026-06-15

Optimized for both modes (goal: "optimize chatbot for SaaS + multi-tenant").

- **Removed** the text-to-speech toggle (button, state, two `useEffect`s, the
  `Volume*` icons, and the `ttsEnabled`/`ttsDisabled` dictionary keys).
- **Redesigned** the control row → single concise input pill with inline
  mic + filled Send (was three loose 40–48px buttons in a row).
- **Simplified** the empty-state title/desc: welcome is now just
  "Hi! I'm the Databayt assistant" / "Hi! I'm the {name} assistant" and the
  sub-line is "Pick a question or type your own" (the quick-ask chips carry the
  specifics). Both languages.
- **Rewrote both system prompts** for practical value: an explicit "answer the
  question first, then one useful detail" protocol, plan/price mapping, yes/no
  capability answers, free-plan onboarding framing, and honest "I don't know →
  contact" fallbacks. Placeholders unchanged.
- **Tuned generation** (kept the model per request): low temperature + output
  cap + history trim.

Verified: `tsc --noEmit` exit 0; i18n dictionary-parity green. The
`errorReturn`/RTL ratchets are red on `main` already (offenders in unrelated
files) — this block adds **zero** new violations.

## Known gaps / next

- Tests: `capture.test.ts` + `support.test.ts` (topic matching, help-index
  detection, manifest → resource cards). Mode selection is still untested.
- Guides with screenshots on the CDN: add/bulk student/teacher (stills +
  video); login, attendance, fees, parents (stills only, shot 2026-10-17).
  Timetable, Quick Attendance, the QR code, fee structures/assignments and
  the child's tabs wait on better demo data (media-qa 2026-10-17: weekend
  date, empty timetable, implausible fees, a child with no records); tutorial
  videos are still owed via `/record`.
- Topic matching is keywords + guide words, not embeddings: a phrasing in
  neither falls through to the general prompt — add the phrase to the topic.
- `how do I set up the timetable` lands on get-started first (its `set up`
  keyword is two parts vs timetable's one) — a keyword-weight issue, pre-2026-10-19.
- Conversation is not persisted across reloads (`enablePersistence` is wired in
  config but the SaaS/school mounts don't use it).
