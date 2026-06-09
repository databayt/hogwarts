# Community Block

## Context

Public, anonymous learning-resource hub at `/[lang]/community`. Replaces the legacy `/blog` stub.

**Phase 2 (current)** — subjects-first:

- Hub renders a SubjectsGrid (one card per `Subject` row in the global catalog)
- Per-subject route `/community/[slug]` mirrors `school-dashboard/(listings)/subjects/[slug]` — chapters scroller, video tiles per lesson, materials/exams/qbank/assignments pipelines
- Default curriculum: `US` (canonical ISO code)
- Curriculum dropdown + grade pill nav (1..12) under the hero — kun homepage style

NO `auth()` and NO `getTenantContext()`. The `Subject`, `Chapter`, `Lesson`, `Material`, `Exam`, `Question`, `Assignment`, `Book`, `Textbook` tables are platform-wide (no `schoolId` column). `Video` has an optional `schoolId` and we filter on `visibility: "PUBLIC"` to surface only opt-in rows.

## Before You Start

1. Read `queries.ts` — every resource query follows the public-content gate (`status: PUBLISHED`, `approvalStatus: APPROVED`, `visibility: PUBLIC`). Textbook has no `visibility`/`approvalStatus` columns, so it gates on `status` only.
2. Route shape: `/community` (hub) + `/community/[slug]` (subject detail). The Phase 1 `[type]/page.tsx` drill-down is gone — resources are surfaced through their parent subject.
3. URL state lives in `?curriculum=US&grade=7`. Server pages parse via `communitySearchParams`; the client `<TabsNav>` and `<FilterBar>` write via `nuqs/useQueryStates`. The `grade` param is driven by the under-hero TabsNav (not a dropdown).

## Key Decisions

- **Subjects-first, not categories-first.** Cross-subject category pages (`/community/textbooks` etc.) were dropped in Phase 2. Per-subject pages reuse `school-dashboard/listings/subjects/{catalog-hero,catalog-detail,catalog-content-sections}.tsx` directly — those components take plain data props and consume the dictionary via `<DictionaryProvider>` (already wired by the saas-marketing layout).
- **`Subject.curriculum` is a string column**, not an enum or FK. Canonical values: a bare ISO country code (`"US"`, `"SD"`, `"GB"`, …) or `"IB-DP"` / `"CAIE-IGCSE"`. The dropdown URL round-trips `Curriculum.code`, which matches `Subject.curriculum` directly.
- **Default `curriculum=US`** — set in `search-params.ts` via `parseAsString.withDefault("US")`. The dropdown label is looked up by `Curriculum.slug` against `dictionary.community.curriculum.names`; the underlying option `value` stays `Curriculum.code` (`"US"`).
- **Lang gating**: queries restrict `where: { lang: currentLocale }` so an English visitor doesn't see Arabic-stored content. Skips translation since the catalog doesn't yet support it.
- **PageHeader heading style** mirrors kun's homepage (`/Users/abdout/kun/src/components/atom/page-header.tsx`) via class overrides on the existing hogwarts atom: `max-w-2xl text-balance text-4xl font-semibold tracking-tight lg:leading-[1.1] xl:text-5xl xl:tracking-tight` on the heading, hairline `border-b border-border/50 dark:border-border` on the section.
- **TabsNav under hero** is grade-based (1..12), trimmed by the active curriculum's `gradeRange`. Defensively resets the active grade to "All" when the user picks a curriculum whose range doesn't include it (`useEffect` inside `tabs-nav.tsx`).
- **Subject grid is a server component** that forks the school-dashboard `<SubjectsGrid>` (which is `"use client"` and hardcodes `/${lang}/subjects/${slug}` hrefs). Our fork routes to `/${lang}/community/${slug}` and avoids the unnecessary client boundary.

## Danger Zones

- The `publicRoutes` allowlist must include `/community` in BOTH `src/routes.ts` AND `src/proxy.ts`. The middleware uses `pathWithoutLocale.startsWith("/community")` so the slug + nested routes inherit publicness.
- Visibility/approval filters are the only thing keeping non-public rows from leaking. Never weaken without a security review.
- `Question.catalogSubjectId` is nullable — orphan questions (no subject) are intentionally dropped from filtered results.
- The reused `CatalogContentSections` component hardcodes `/${lang}/subjects/...`, `/${lang}/exams/...`, and `/${lang}/stream/dashboard/...` deep links. On the public domain (no school subdomain) those routes 404 — known MVP limitation. The inline content (chapter scroll, video tiles, materials/exams/qbank pipelines) is what carries the page.
- The `getText()` translation pipeline in school-dashboard subject detail is gated on `schoolId` (`schoolId ? getText(...) : Promise.resolve(text ?? "")`). For the public mirror, schoolId is null and original-language text falls through. We additionally filter rows by `lang === currentLocale` so the fall-through is correct.

## Related Blocks

- [SaaS Marketing](../CLAUDE.md) — parent layout chain (SiteHeader, SiteFooter, DictionaryProvider).
- [School Dashboard / Subjects](../../school-dashboard/listings/subjects/) — reused detail components live there. We don't fork them; we render them.
- [Catalog](../../saas-dashboard/catalog/CLAUDE.md) — DEVELOPER authoring side. Content surfaces here when `visibility/approvalStatus/status` flip to PUBLIC/APPROVED/PUBLISHED.

## After You Finish

1. `pnpm tsc --noEmit` — zero new errors.
2. Visit `/en/community` and `/ar/community` — anonymous render, hero + tabs (`All / 1 / 2 / … / 12`) + curriculum dropdown showing "International US" + subjects grid.
3. Visit `/en/community/us-g1-arts` — hero banner + chapter scroll + materials/exams/qbank/assignments + per-lesson video tiles. (Anonymous; no schoolId.)
4. Visit `/en/community/textbooks` — must 404 (Phase 1 [type] route deleted).
5. Validate JSON: `node -e "require('./src/components/internationalization/ar.json')"`. Both files have `community.tabs` and `community.curriculum.internationalUS`.
