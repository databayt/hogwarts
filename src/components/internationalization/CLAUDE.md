---
epic: 08
sprint: Q3-2026
title: Internationalization
file_type: claude
owner: Samia
maturity: Production-ready
completion: 92
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/internationalization
last_audited: 2026-06-11
---

# Internationalization Block

## Context

Static-dictionary i18n (System A) — Q3 2026 epic 08, production-ready.
See [README](README.md) for structure and [ISSUE](ISSUE.md) for the live
backlog. Dynamic DB-content translation is the sibling block:
[translation/CLAUDE.md](../translation/CLAUDE.md). Tracker:
[326](https://github.com/databayt/hogwarts/issues/326).

## Before You Start

1. Read `README.md` here — especially "How loading works"
2. Read `ISSUE.md` for the current backlog
3. Adding UI text? The key goes in BOTH `dictionaries/en/<ns>.json` AND
   `dictionaries/ar/<ns>.json` in the same edit — the parity test
   (`src/tests/i18n/dictionary-parity.test.ts`) fails the suite on any drift

## Key Decisions

- **Single namespace registry** (`namespaces.ts`): server (`dictionaries.ts`)
  and client (`get-dictionary-client.ts`) loaders BOTH derive from it.
  Historically they kept separate lists and drifted (client silently missing
  `compliance`/`liveClasses` while the type claimed they exist). Adding a
  namespace is now a one-place registration; `dictionary-loader-sync.test.ts`
  is the tripwire.
- **`Dictionary` type is inferred** from the EN merge
  (`Awaited<ReturnType<typeof getDictionary>>`) — JSON shape is the type.
  AR drift is invisible to tsc; only the parity test catches it.
- **React `cache()` on every loader** — one merge per request across all
  call-sites. Never remove it; 500+ files call `getDictionary` per render.
- **Locale detection lives in `locale-detect.ts`** and is consumed by the
  live edge middleware `src/proxy.ts`. A dead negotiator-based reference
  middleware was deleted (2026-06-10) precisely because two implementations
  drift — do not reintroduce one.
- **Locale list single-source**: every regex/branch derives from
  `i18n.locales` (config.ts) — `setLocale`, root layout `<html dir>` +
  corrective inline script, proxy. Adding a 3rd locale = config.ts +
  dictionary files only.
- **Error-code pattern**: server actions return codes
  (`{ errorCode: "NOT_AUTHENTICATED" }`); clients map via `ErrorHelper`.
  Never return English error strings.
- **Client components get the dictionary from context, never as a prop from
  a server component** (2026-09-28). A prop to a client component is
  serialized into the RSC payload once per prop: the dashboard layout's
  provider put ~1.3 MB of Arabic JSON into every document and every
  revalidating Server Action response, and `/exams/mark` carried five copies.
  Layouts render `LocaleDictionaryProvider lang={lang}` (static per-locale
  chunks in `client/`, next/dynamic so a page loads only its own locale);
  client components call `useDictionary()` / `useDictionaryFallback(prop)`.
  Passing a small subtree a component needs is fine; passing the whole
  dictionary or `dictionary.school` is not.
- **`client/ar.ts` and `client/en.ts` are generated** from `namespaces.ts` by
  `scripts/i18n/generate-client-dictionaries.mjs`. Adding a namespace means
  re-running it; `client-dictionary.test.ts` fails until you do.

## Danger Zones

- **Never add a namespace to only one loader** — always via `namespaces.ts`.
- **Route-scoped loaders return PARTIAL dictionaries** cast `as Dictionary`
  at 7 provider layouts (saas-marketing, saas-dashboard, school-messaging,
  onboarding, application…). A component newly consuming an extra namespace
  under one of those subtrees gets `undefined` — the house rule (optional
  chaining + fallback) keeps it safe at runtime, but if you add a namespace
  dependency to a subtree, verify its layout's loader covers it (see the
  comment at each swap site).
- **`pnpm i18n:fix` scaffolds `[AR]`/`[EN]` placeholders** — the parity test
  REJECTS committed placeholders; translate them before committing.
- **Ratchets only go down**: `src/tests/i18n/hardcoded-ratchet.test.ts`
  (8 anti-pattern baselines + STATIC-GAP count) and
  `rtl-physical-class.test.ts` (baseline 0). If your change trips one, fix
  the string/class — never raise a baseline.
- **`x-locale` header is set by `src/proxy.ts`** — `getDisplayLang()`
  (translation block) and the root layout depend on it; touching proxy
  locale logic requires running `src/tests/i18n/middleware.test.ts`.

## Related Blocks

- [translation/](../translation/CLAUDE.md) — System B: dynamic DB-content
  translation (localize/prewarm/LRU); its `getDisplayLang` reads the
  `x-locale` header this block's proxy logic sets.
- School dashboard, onboarding, auth — all consume `Dictionary` via props.

## After You Finish

1. Keys added? `pnpm i18n:check` must exit 0
2. `pnpm vitest run src/tests/i18n/` — the full guard suite
3. `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. Update `ISSUE.md` / `README.md` if structure or completion changed
