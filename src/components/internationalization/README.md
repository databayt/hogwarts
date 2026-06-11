---
epic: 08
sprint: Q3-2026
title: Internationalization
file_type: readme
owner: Samia
maturity: Production-ready
completion: 92
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/internationalization
last_audited: 2026-06-11
---

## Internationalization — Static Dictionary System (System A)

### Overview

Feature-based i18n for all STATIC UI text: Arabic (RTL, default) and English
(LTR), URL-routed under `[lang]/`, with a single namespace registry feeding
both the server and client dictionary loaders. Dynamic user-generated DB
content is the sibling block: [`src/components/translation/`](../translation/README.md)
(System B — registry-driven batched `localize()` + Google Translate cache).

**The guard:** en/ar key parity, untranslated-placeholder detection, a
hardcoded-string ratchet, and a repo-wide RTL physical-class ratchet all run
in `pnpm test` (and therefore CI). Drift fails the build — see
`src/tests/i18n/`.

### File Structure

```
src/components/internationalization/
├── config.ts                 # i18n {locales, defaultLocale}, Locale type, localeConfig, isRTL()
├── namespaces.ts             # ⭐ SINGLE namespace registry (flat + 19 feature namespaces)
├── dictionaries.ts           # Server loaders (server-only, React cache()-wrapped)
├── get-dictionary-client.ts  # Client loader — derives from the SAME registry
├── locale-detect.ts          # detectLocale()/pathnameHasLocale() — THE live proxy logic
├── dictionary-context.tsx    # DictionaryProvider + useDictionaryContext
├── use-dictionary.ts         # Client hook (context-first, self-load fallback)
├── use-locale.ts             # useLocale() + useSwitchLocaleHref()
├── language-switcher.tsx     # Language toggle (dropdown/inline/toggle)
├── actions.ts                # setLocale server action (cookie + redirect)
├── helpers/index.ts          # ValidationHelper / ToastHelper / ErrorHelper / interpolate
├── lib/
│   ├── key-diff.ts           # Pure diff engine (flattenKeys/diffKeys)
│   └── parity.ts             # Real-file en/ar comparator + placeholder scanner
├── AUDIT.md                  # Route-by-route i18n coverage audit
├── {en,ar}.json              # General/marketing (flat)
├── school-{en,ar}.json       # School dashboard (flat, the largest pair)
├── stream-{en,ar}.json       # Stream/LMS (flat)
├── operator-{en,ar}.json     # SaaS operator (flat)
└── dictionaries/{en,ar}/     # 19 nested feature namespaces (admin, attendance,
                              # banking, compliance, finance, generate, lab, library,
                              # live-classes, marking, messages, messaging, notifications,
                              # parentPortal, profile, results, sales, transportation, whatsapp)
```

### How loading works

- `getDictionary(locale)` merges 4 flat pairs + all 19 feature namespaces.
  Every loader is wrapped in React `cache()` — one merge per request no
  matter how many components call it.
- **Route-scoped loaders** (`getExamDictionary`, `getMessagingDictionary`,
  `getSaasDashboardDictionary`, …) return a narrow subset — use them in
  `DictionaryProvider` layouts to keep the RSC payload small (~30% cut on
  the swapped layouts).
- **Adding a namespace = ONE registration** in `namespaces.ts` (plus the
  en/ar JSON pair). Server and client loaders both derive from it;
  `dictionary-loader-sync.test.ts` fails if the shapes ever diverge.
- `type Dictionary = Awaited<ReturnType<typeof getDictionary>>` — inferred
  from the merge, so JSON shape IS the type.

### Locale detection (live path)

`src/proxy.ts` (Next 16 proxy convention) → `detectLocale()` in
`locale-detect.ts`: valid `NEXT_LOCALE` cookie → first `Accept-Language`
tag → `ar`. Sets `x-locale` header + cookie. `<html lang dir>` is
server-rendered in `src/app/layout.tsx` with the locale list interpolated
from `i18n.locales` (no hardcoded `(en|ar)` anywhere).

### Scripts

| Command                                              | Purpose                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `pnpm i18n:check`                                    | en/ar parity + placeholder check (CI step; exit 1 on drift) |
| `pnpm i18n:fix`                                      | Scaffold `[AR]/[EN]` placeholders for missing keys          |
| `pnpm i18n:audit`                                    | Route classifier (STATIC-GAP detection)                     |
| `npx tsx scripts/i18n-hardcoded-ratchet.ts --by-dir` | Hardcoded-string counts                                     |

### Integration Points

- **Server Components**: `const dict = await getDictionary(lang)` → pass slices as props
- **Client Components**: props, or `useDictionary()` (context-first)
- **Validation/toasts/errors**: `createI18nHelpers(dictionary.messages)` → `ValidationHelper`/`ToastHelper`/`ErrorHelper`; server actions return error CODES
- **Locale switching**: `useSwitchLocaleHref()` / `setLocale` action

### Agents & Skills

- `agent:internationalization` — Arabic/English, RTL/LTR
- `skill:/i18n-check` — hardcoded-string scan
- `skill:/lang` — RTL/LTR + translation check
