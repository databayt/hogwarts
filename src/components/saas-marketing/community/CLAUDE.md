# Community Block

## Context

Public, anonymous learning-resource hub at `/[lang]/community`. Replaces the legacy `/blog` stub. Surfaces six types of catalog content (textbooks, mock exams, qbank, videos, materials, library books) with curriculum + grade filters. NO `auth()` and NO `getTenantContext()` — this entire block is unauthenticated and tenant-agnostic.

## Before You Start

1. Read `queries.ts` — every per-type query follows the same public-content gate (`status: PUBLISHED`, `approvalStatus: APPROVED`, `visibility: PUBLIC`)
2. The route shape is hub + drill-down. `/community` shows category cards with counts; `/community/{type}` shows the resource grid for one type
3. URL state lives in `?curriculum=...&grade=...`. The server `<page.tsx>` parses with `communitySearchParams`; the client `<FilterBar>` writes via `nuqs/useQueryStates`

## Key Decisions

- **No auth, no schoolId.** Catalog tables either have no `schoolId` column at all (`Subject`, `Textbook`, `Exam`, `Question`, `Material`, `Book`) or treat `schoolId` as optional and use `visibility: "PUBLIC"` to opt rows in (`Video`)
- **`Textbook` has only `status`** — no approval pipeline. Future approval work would require a schema migration. Document any change here in this CLAUDE.md
- **`Book` skips grade filtering** because `Book.gradeLevel` is a `String` (`"GENERAL"` etc.), not an `Int[]`. Curriculum still flows through `catalogSubject`
- **`Subject.curriculum` is a string column**, not an enum or FK. Values: `"national" | "us-k12" | "british" | "ib"`. The dropdown URL stores `Curriculum.code` (which mirrors that string), not the DB id, so old rows that only have the legacy column still match
- **Lang gating**: queries restrict `where: { lang: currentLocale }` so an English visitor doesn't see Arabic-stored content (and vice versa). Removes a translation step the catalog doesn't yet support
- **Six parallel queries on the hub**, one query per drill-down. Acceptable for SSR; wrap in `unstable_cache` if traffic grows
- **No legacy redirect from `/blog`** — the old route was an unindexed stub, deleted clean

## Danger Zones

- The `publicRoutes` allowlist must mention `/community` in BOTH `src/routes.ts` AND `src/proxy.ts`. Missing either one and middleware redirects anonymous users to `/login`
- The visibility filter is the only thing protecting non-public catalog rows from leaking. Never weaken it without a security review
- `Question.catalogSubjectId` is nullable — the curriculum/grade filter intentionally drops orphan rows. If you change that, audit for leak risk
- Adding a new resource type? You must update: `RESOURCE_TYPES` in `config.ts`, the discriminated union in `resource-grid.tsx`, the dictionary `community.types` block in both `en.json` and `ar.json`, and add a new drill page under `community/{type}/page.tsx` plus a query in `queries.ts`

## Related Blocks

- [SaaS Marketing](../CLAUDE.md) — parent layout chain (SiteHeader, SiteFooter)
- [Catalog](../../../components/saas-dashboard/catalog/CLAUDE.md) — DEVELOPER-only authoring side. Content surfaces here when its visibility/approval flips to PUBLIC/APPROVED
- [Library](../../library/CLAUDE.md) — tenant-scoped library; this block reads the same `Book` table but only PUBLIC rows
- [Stream](../../stream/CLAUDE.md) — `Video` rows are written through stream/lessons; PUBLIC + APPROVED ones surface here

## After You Finish

1. Run `pnpm tsc --noEmit` and confirm zero new errors
2. Visit `/en/community` and `/ar/community` — both must render anonymously
3. Visit `/en/blog` — must 404 (the old route is intentionally deleted)
4. Test filter state in URL: change Curriculum, hard reload — selection persists
5. Validate JSON: `node -e "require('./src/components/internationalization/ar.json')"` — no parse errors
