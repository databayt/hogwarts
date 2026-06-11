---
epic: 08
sprint: Q3-2026
title: Internationalization
file_type: issue
owner: Samia
maturity: Production-ready
completion: 92
tracker: https://github.com/databayt/hogwarts/issues/326
docs: https://ed.databayt.org/en/docs/internationalization
last_audited: 2026-06-11
---

# Internationalization — Live Work List

## Done (2026-06-10/11 production-readiness pass)

- [x] Shared namespace registry (`namespaces.ts`) — server/client loader drift structurally impossible
- [x] Client loader missing `compliance`/`liveClasses` — fixed
- [x] React `cache()` on all dictionary loaders (one merge/request)
- [x] Translation guard in CI: real-file parity test + placeholder scanner + `pnpm i18n:check` step + fixed `pnpm tests` typo (unit-test job was a silent no-op)
- [x] Hardcoded-string ratchet (8 patterns) + STATIC-GAP ratchet + RTL physical-class ratchet (baseline 0)
- [x] 46 broken translation tests repaired; helpers/index.ts 0→41 tests
- [x] Locale list single-sourced from `i18n.locales`; dead reference middleware deleted, 16 tests repointed at live proxy logic
- [x] RSC payload: 7 DictionaryProvider layouts on route-scoped loaders (~30% cut each)
- [x] Tier-1/2 route gaps: 21 STATIC-GAP routes wired (exam wizard ×13, parent child pages, transcript verify)

## P1 — remaining

- [ ] **Tier-3 hardcoded-string sweep to ~0**: ratchet baselines locked at measured values
      (formLabel 25, toast 115, button 35, errorReturn 1582, selectLabel 1624, zodMessage 880,
      bilingualField 123, placeholder 163). Run `npx tsx scripts/i18n-hardcoded-ratchet.ts --by-dir`
      for the live per-dir distribution (densest: school-dashboard, api, saas-dashboard, onboarding).
      Sweep per-dir, lower baselines in `src/tests/i18n/hardcoded-ratchet.test.ts` as you win.
      Many `errorReturn`/`selectLabel` hits are internal/dev surfaces — classify before translating;
      DEV-ONLY dirs (lab, atom showcase, \*-demo) may be excluded with a note here.
- [x] ~~Remaining `STATIC-GAP?` rows~~ — driven to ZERO 2026-06-11; ratchet baseline locked at 0
- [ ] **DataTable filter-operator labels** (`src/components/table/config.ts`, ~80 selectLabel
      hits): "Contains"/"Is empty"/… render in every list page's filter menu but live in a
      module-level const consumed by shared table internals + saas-dashboard/lib parsers.
      Needs a `getDataTableConfig(dictionary)` factory threaded through the table block —
      do it as its own PR, not in a sweep batch (shared-component blast radius).

## Tier-3 sweep exemptions (dev-only, counted but not translated)

- `src/components/table/_components/*` — shadcn/dice-ui tasks-table DEMO (reference impl,
  "Do a kickflip" placeholders; not product UI)
- `src/components/lab/`, `src/components/atom/` showcase, `*-demo.tsx` — dev surfaces

## P2 — enhancements

- [ ] New-locale dry run (e.g. `fr`): should be config.ts + JSON pairs only — validate the claim
- [ ] Route-scoped loader for the school-dashboard layout (consumes ~16 namespaces; measure first)
- [ ] `interpolate()` ICU-style plurals (currently flat `{param}` substitution)

## Resolved gotchas (for the record)

- `get-dictionary-client.ts` drifted from `dictionaries.ts` because there were two namespace lists — the registry fixed the bug class; `dictionary-loader-sync.test.ts` guards the regression
- CI ran `pnpm tests` (nonexistent script) — unit tests never actually ran in CI before 2026-06-10
- Old `dev-i18n-sync --fix` wrote top-level pair fixes to the wrong path (dictionaries/ subdir)
