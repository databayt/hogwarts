<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Chatbot

A floating AI assistant mounted on the **public marketing layouts** (no auth).
It runs in two modes from the same component, decided by `promptType`:

| Mode            | `promptType`    | Mounted at                                               | Audience                          |
| --------------- | --------------- | -------------------------------------------------------- | --------------------------------- |
| **SaaS**        | `saasMarketing` | `app/[lang]/(saas-marketing)/layout.tsx`                 | School owners evaluating Databayt |
| **School site** | `schoolSite`    | `app/[lang]/s/[subdomain]/(school-marketing)/layout.tsx` | Prospective parents/students      |

Answers come from Groq (`llama-3.1-8b-instant`) via the AI SDK. The **system
prompt _is_ the knowledge base** — it's assembled server-side and never shipped
to the client; only the assistant's reply crosses the wire.

## Structure

```
chatbot/
├── chatbot.tsx          # Server entry — loads dictionary + school context, renders content
├── content.tsx          # Client shell — wires button + window + useChatbot hook
├── chat-button.tsx      # Floating FAB (robot, or school logo on tenant sites)
├── chat-window.tsx      # The panel: messages, quick-asks, CTA chips, input pill, mic
├── use-chatbot.ts       # Client state hook (messages, send, loading, error)
├── actions.ts           # "use server" — fetchSchoolData, resolveSystemPrompt, sendMessage
├── capture.ts           # Funnel capture — deterministic identifier extraction → Prospect upsert
├── prompts.ts           # buildSaasMarketingPrompt / buildSchoolSitePrompt (data → prompt)
├── constant.ts          # Positions, sizes, DEFAULT_DICTIONARY fallback, pricing-nudge config
├── pricing-nudge.tsx    # One-shot proactive open on /pricing (30s, cooldown-gated)
├── icons.tsx            # Inline SVGs (Send, Voice, quick-ask category icons…)
├── type.ts              # ChatbotDictionary + props/context types
├── utils.ts             # mergeConfig
└── dictionary-client.ts # Client-side dictionary loader (legacy fallback path)
```

## Knowledge base

- **SaaS** (`buildSaasMarketingPrompt`): pulls **live** pricing from
  `saas-marketing/pricing/config.ts` (`formatPricing`) and the 85-feature /
  10-category catalogue from `saas-marketing/features/constants.ts`
  (`formatFeatures`). Edit marketing config → the bot's facts update with it.
- **School** (`buildSchoolSitePrompt`): pulls **live** school data via
  `fetchSchoolData(subdomain)` — admissions campaigns, fee structures,
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
- **Generation params** (`actions.ts`): `temperature: 0.3` (factual, never invent
  prices) + `maxOutputTokens: 400` (2–3 sentences / short list) + history trimmed
  to the last 10 turns (the system prompt already carries the full context).

## Capture + rate limit — the funnel surface (2026-08-22)

`sendMessage` is a public, unauthenticated Server Action where every call costs a
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

- No `chatbot.mdx` docs page yet (user-facing — candidate for `content/docs-en/`).
- Automated tests cover capture only (`capture.test.ts`, 8 units); prompt
  assembly + mode selection remain the highest-value untested paths.
- Live visual QA still pending: a hogwarts dev server on :3000 was unavailable
  this session (port held by the reference codebase server).
- Conversation is not persisted across reloads (`enablePersistence` is wired in
  config but the SaaS/school mounts don't use it).
