<!--
Copyright (c) 2025-present databayt
Licensed under SSPL-1.0 -- see LICENSE for details
-->

# Docs

The `/docs` site (fumadocs-mdx, mirrors the shadcn docs block). Routes live in
`app/[lang]/(saas-marketing)/docs/` (`layout.tsx` = sidebar shell,
`[[...slug]]/page.tsx` = page); content in `content/docs-en/` and
`content/docs-ar/`, compiled by `source.config.ts` into the `docs` /
`docsArabic` collections (`src/lib/source.ts`).

## Behaviour

- Every page is pre-rendered per locale (`generateStaticParams`).
- **Arabic falls back to English** (2026-10-19): `/ar/docs/<slug>` with no
  Arabic file renders the English page LTR under `docs.notTranslated`, so a
  link from an Arabic page never 404s. The Arabic sidebar lists Arabic pages
  only.
- Canonical / OG / copy-page URLs use the live platform host
  (`mainHostFor(LIVE_ROOT_DOMAIN)`), not the dead `ed.databayt.org`.
- The help center (`content/docs-*/support/`) feeds the chatbot:
  `scripts/build-support-index.mjs` → `chatbot/support-index.json`.
- Media (videos, stills) comes from `media-manifest.json` via `media.ts`
  (server-only); `mermaid.tsx` imports mermaid lazily.

## Files

| File | Purpose |
| --- | --- |
| `docs-sidebar.tsx`, `docs-config.ts` | Role-grouped sidebar, link lists |
| `toc.tsx`, `docs-copy-page.tsx` | Table of contents, copy-as-markdown |
| `media.ts`, `media-manifest.json`, `media-view.tsx`, `shot.tsx`, `tutorial-video.tsx` | CDN media |
| `*-structure.tsx`, `flow-chart.tsx`, `mermaid.tsx`, `auth-flow.tsx` | Diagrams used from MDX |

## Checks

- `pnpm docs:lint` — both `docs-en` and `docs-ar` (Arabic links resolve
  against both sets). Fails on `main` already: long descriptions.
- `node scripts/build-support-index.mjs --check` — prebuild drift guard.

## Open

- 50 English pages still have no Arabic version (fallback covers them).
  Translated 2026-10-19: finance-* (12), timetable, exams, classrooms, lms,
  library, notifications.
- Mermaid labels in `docs-ar/lms.mdx` are still English.
- Anchor links (`#routes` …) in translated pages may not resolve: Arabic
  headings slug differently.
