# i18n + Translation Route Audit

> Exhaustive classification of every app route against the two translation systems,
> plus the remediation backlog. Regenerate the machine pass with `pnpm i18n:audit`
> (script: `scripts/i18n-audit.ts`). Key parity is gated by `pnpm i18n:check`.

## The two systems

| | System A — Static dictionary | System B — Dynamic content |
|---|---|---|
| **For** | UI chrome: labels, buttons, toasts, placeholders, validation | user-stored DB text (announcement bodies, route names, …) |
| **How** | `getDictionary(lang)` (or a `get<X>Dictionary` partial) in the server page → `dictionary` prop → `dictionary.<ns>.<key>` | `getDisplayText(text, contentLang, displayLang, schoolId)` / `getDisplayFields(...)` — **server-only**; Google Translate v2 + `TranslationCache` |
| **Source** | `src/components/internationalization/{en,ar}.json`, `school-*.json`, `stream-*.json`, `operator-*.json`, `dictionaries/{en,ar}/*.json` | record `.lang` ?? `School.preferredLanguage` ?? `"ar"`; display = route locale |
| **Loader** | `internationalization/dictionaries.ts` (`Dictionary` type is inferred) | `@/lib/content-display` → `components/translation/{display,actions,google}.ts` |

A new dictionary namespace must be registered in 3 places: the JSON pair, the spread in `getDictionary`, and `get-dictionary-client.ts` (for client use). Some clusters (exam template/generate wizards) use an alternative **inline bilingual `labels.ts` map + `useLocale()`** instead of dictionary JSON — that is a legitimate, accepted pattern.

## Method

`scripts/i18n-audit.ts` walks every `page.tsx` under `src/app`, resolves the page's local import closure (depth 2: page → content → children), and records whether any file references a dictionary (A) or `getDisplayText` (B). The 31 pages with no detectable dictionary were then verified file-by-file by agents. Pages tagged `FULLY-I18N` load a dictionary at the page level; a residual hardcoded-string scan (below) covers strings buried deeper than the page-level wiring.

## Summary

| Metric | Count |
|---|---|
| Total `page.tsx` routes | 465 |
| Page-level dictionary wired | 352 |
| Delegate to a dict-consuming content component (OK) | 48 |
| Redirect / data-only (NO-UI) | 26 |
| Dev/test/preview (out of scope) | 8 |
| **Fully-hardcoded routes (STATIC-GAP) — verified** | **22** |
| Residual hardcoded-string hits inside otherwise-wired routes | ~375 (63 dirs) |
| Models with a `lang` field | 30 |
| Feature areas already routing dynamic content through `getDisplayText` | 18 |

## Tier 1 — Fully-hardcoded routes (STATIC-GAP) — must internationalize

These routes render UI text that does **not** switch language at all.

| # | Route | Content component | Fix namespace | Notes |
|---|---|---|---|---|
| 1 | `/parent/announcements` | `school-dashboard/parent-portal/announcements/content.tsx` | **new** `parentPortal` | titles/labels hardcoded; dynamic body already via `getDisplayText` |
| 2 | `/parent/events` | `parent-portal/events/content.tsx` | **new** `parentPortal` | `EVENT_TYPE_LABELS` hardcoded |
| 3 | `…/school/configuration/academic` | `school-dashboard/school/academic/content.tsx` | `school.configuration` | "Academic Setup" etc. |
| 4 | `…/school/configuration/hero` | `school/configuration/config-hero-form.tsx` | `school.configuration` | title/description keys exist; body hardcoded |
| 5 | `…/school/configuration/legal` | inline in `page.tsx` | `school.configuration` | "Legal & Compliance" |
| 6 | `…/school/configuration/name-format` | `school/configuration/config-name-format-form.tsx` | `school.configuration` | |
| 7 | `…/grades/promotion` | `grades/promotion/dashboard.tsx` | `results.promotion` | "Year-End Evaluation" |
| 8 | `…/grades/reports` | `grades/report-cards/table.tsx` | `results.reportCards` | term selector, headers |
| 9 | `…/grades/transcripts` | `grades/transcripts/table.tsx` | `results.transcripts` | search placeholder, headers |
| 10 | `…/finance/receipt/manage-plan` | inline in `page.tsx` | `finance` | portal error/empty states |
| 11–13 | exam **generate** wizard: `exam`, `questions`, `template` steps | `exams/wizard/exam-wizard-v2/<step>/form.tsx` | `school.exams.wizard.examWizard` | step heading is i18n (labels.ts); **form bodies** hardcoded — adopt `useDictionary()` like sibling `paper-config/form.tsx` |
| 14–17 | exam **template** wizard: `difficulty`, `duration-marks`, `gallery`, `question-types` | `exams/wizard/template-wizard/<step>/form.tsx` | `template-wizard/labels.ts` (inline bilingual map) | reuse exported `QUESTION_TYPE_LABELS`; add `difficulty`/`gallery`/`duration-marks` sections |
| 18 | `/(auth)/access-denied` | inline in `page.tsx` | `en/ar.json` → `accessDenied` | also `…/s/[subdomain]/access-denied` (shares the namespace) |
| 19 | `…/s/[subdomain]/access-denied` | inline in `page.tsx` | `en/ar.json` → `accessDenied` | |
| 20 | `/accept-invite` | `accept-invite/{page,form}.tsx` | `en/ar.json` → `acceptInvite` | invalid-link + accept/decline |
| 21 | `/certificate/[shareToken]` | inline in `page.tsx` | `en/ar.json` → `certificate` | error/empty states (public page) |
| 22 | `/verify/[code]` | inline in `page.tsx` | `en/ar.json` → `verify` | error/empty states (public page) |

**DELEGATES-OK (not gaps, minor):** 8 exam template-wizard steps (`answer-sheet`, `cover`, `footer-layout`, `header`, `instructions`, `preview`, `student-info`, `subject`) are fully bilingual via `labels.ts` + `registry.ts`; only a `"Failed to save"` toast **fallback** string remains hardcoded in each `form.tsx`. **FULLY-I18N (false positive in scan):** exam generate `preview` step. **NO-UI:** `/parent/attendance`.

## Tier 2 — Dynamic content not translated (System B)

Models carry a `lang` field but their render paths do not route user text through `getDisplayText`, so content shows in its stored language regardless of the UI locale.

| Surface | Status | Action |
|---|---|---|
| **transportation** (Route/RouteStop/Vehicle/Driver names — 8 `lang` fields) | **0 usages** — confirmed gap, highest value | wrap names in `getDisplayText` in the server data-loaders feeding the (client) transportation pages |
| quiz / quick-assessments / question / qbank | no usages found | audit quiz/question render paths |
| curriculum / curriculum-standards / academic-structure / grading-scheme | no usages found | audit standard/scheme name rendering |
| textbook / material / document / chapter / video (standalone detail/list) | partial (catalog/stream covered) | audit non-catalog render paths |
| whatsapp templates | no usages found | template body display |

Already covered (correct): `listings`, `admission`, `attendance`, `exams`, `finance`, `notifications`, `parent-portal`, `profile`, `school`, `messaging`, `dashboard`, `library/catalog`, `saas-dashboard/catalog`, `stream/data`, `template/site-header` (18 areas, ~80 call sites).

## Tier 3 — Residual hardcoded-string long-tail (backlog)

Routes that **are** internationalized (page-level wired) but contain hardcoded strings in deeper form/table/dialog components. ~375 hits across 63 dirs (FormLabel / toast-literal / Button-text / placeholder patterns; excludes tests, dictionaries, `labels.ts`/`registry.ts` bilingual maps). Densest areas — a prioritized cleanup backlog, **not silently dropped**:

| Hits | Area | | Hits | Area |
|---:|---|---|---:|---|
| 64 | `school-dashboard/listings` | | 8 | `school-dashboard/settings` |
| 37 | `saas-dashboard/catalog` | | 7 | `school-dashboard/{reports,grades,timetable}` |
| 27 | `atom/lab` (dev) | | 6 | `saas-dashboard/products` |
| 24 | `school-dashboard/dashboard` | | 4 | `saas-dashboard/{domains,tenants,billing}` |
| 22 | `school-dashboard/attendance` | | 4 | `school-dashboard/{parent-portal,communication}` |
| 22 | `school-dashboard/school` | | 3 | `saas-marketing/pricing`, `library/admin` |
| 17 | `onboarding/newcomers` | | 2 | `stream/shared`, `library/*`, `file/import` |
| 16 | `table/_components` (shared) | | … | (43 more dirs, 1–2 each) |
| 10 | `school-marketing/visit` | | | |

Some hits are false positives (vendored `billingsdk/`, `theme/use-theme.ts`, demo files, dev `lab`). Run `pnpm i18n:audit` + the hook patterns in `.claude/hooks/check-i18n.sh` to refresh.

## Cleanups applied in this sweep

- `get-dictionary-client.ts`: added missing `transportation` + `whatsapp` namespaces (was silently `undefined` for client consumers).
- Key parity: fixed `school.onboarding.importingStatus` (English import-status line was rendering blank). `pnpm i18n:check` now fully green.
- `package.json`: added `i18n:validate` / `i18n:check` / `i18n:fix` / `i18n:audit` scripts (docs referenced `i18n:validate`, which didn't exist).
- README: corrected the stale `src/middleware.ts` pointer to `src/proxy.ts` (the live edge middleware).
