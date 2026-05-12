# Spotlight (Cmd+K) Command Menu

A surface-aware command palette that combines static navigation, quick
actions, and dynamic entity search across the school dashboard.

## Architecture

```
PlatformHeader (server: passes serverRole + schoolId)
   │
   ▼
spotlight-search.tsx (React.lazy dispatcher per surface)
   │
   ▼
surfaces/<surface>.tsx (chunk: imports config + GenericCommandMenu)
   │
   ▼
index.tsx — GenericCommandMenu
  • dictionary-driven labels (commandMenu.placeholder/categories/kinds)
  • diacritic-aware filterByQuery (normalize.ts)
  • useDebounce(query, 300) → useTransition
  • role: clientRole ?? serverRole
   │
   ├─[ q < 2 ]   static items derived from platformNav
   │             (derive-from-platform-nav.ts)
   │
   └─[ q ≥ 2 ]   useSpotlightSearch hook
                       │
                       ▼
                actions.ts → globalSpotlightSearch()
                       │
                       ▼
                server/global-search.ts (parallel findMany)
                       │
                       ▼
                server/rbac-predicates.ts (per-kind where + RBAC)
                       │
                       ▼
                Postgres (with optional pg_trgm GIN indexes — see Phase 3)
```

## Files

| File                          | Purpose                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `index.tsx`                   | `GenericCommandMenu` — main client component. Wires dictionary, debounce, dynamic results, recents, theme. |
| `spotlight-dialog.tsx`        | UI primitives (`SpotlightDialog`, `SpotlightInput`, …). Exports `buildSpotlightCategories(cm)` factory.    |
| `spotlight-search.tsx`        | `React.lazy` dispatcher; one chunk per surface.                                                            |
| `types.ts`                    | `SearchItem`, `SearchContext`, `SpotlightGroupKind`, `SpotlightResult`.                                    |
| `utils.ts`                    | `filterByQuery`, `filterByRole`, recents helpers.                                                          |
| `normalize.ts`                | NFD + Arabic alef/ya/ta-marbuta/tatweel/harakat collapse.                                                  |
| `derive-from-platform-nav.ts` | Convert `platformNav` → `SearchItem[]`. Single source of truth.                                            |
| `kind-icon-map.ts`            | `Record<SpotlightGroupKind, LucideIcon>`.                                                                  |
| `result-renderer.tsx`         | Entity-aware row (kind icon + label + secondary + breadcrumb).                                             |
| `use-recent-items.ts`         | localStorage-backed recents (30-day TTL, 10 max).                                                          |
| `use-spotlight-search.ts`     | Hook: debounce + transition + cancellation.                                                                |
| `actions.ts`                  | `globalSpotlightSearch` server action with `unstable_cache`.                                               |
| `server/global-search.ts`     | Per-kind `findMany` orchestrator.                                                                          |
| `server/rbac-predicates.ts`   | `buildEntityKindList(role)` + per-kind Prisma `where` builders.                                            |
| `surfaces/*.tsx`              | Lazy chunks per surface.                                                                                   |
| `__tests__/*.test.ts`         | Unit tests for normalize + RBAC matrix.                                                                    |

## Adding a new entity kind

1. Add the kind to `SpotlightGroupKind` union in `types.ts`.
2. Add a row to `kindIconMap` in `kind-icon-map.ts`.
3. Implement `<entity>Where(ctx)` in `server/rbac-predicates.ts`. It must
   - hard-code `schoolId: c.schoolId` (cross-tenant guard)
   - return `null` for roles that should not see this kind
   - apply role-narrowing for STUDENT/GUARDIAN/TEACHER as appropriate
4. Add a case to the `searchKind` switch in `server/global-search.ts`. Use
   a narrow `select` to keep the projection cheap and project rows into
   `SpotlightResult`.
5. Update `buildEntityKindList` in `server/rbac-predicates.ts` so the role
   gate allows this kind for the correct roles.
6. Add the kind label to `commandMenu.kinds.<kind>` in `en.json` + `ar.json`.
7. Add a test case in `__tests__/rbac-matrix.test.ts` covering the
   permitted and denied roles for the new kind.

## Applying Phase 3 (pg_trgm GIN indexes)

The app works without these indexes — Prisma's `findMany` with `contains`
falls back to sequential ILIKE scans within tenant scope. For tenants with
≥ 10 k students/teachers, the GIN trigram indexes drop p95 latency from
~ 400 ms to ~ 20-50 ms.

Apply protocol (per project `CLAUDE.md` "branch-before-touch"):

```ts
// 1. Create a Neon branch
const { data: branch } = await mcp__Neon__create_branch({
  projectId: "<hogwarts-project-id>",
  branchName: "spotlight-trgm",
})

// 2. Run the migration on the branch
await mcp__Neon__run_sql({
  projectId: branch.project_id,
  branchId: branch.id,
  sql: <contents of prisma/sql/spotlight-search-trgm.sql>,
})

// 3. Validate the planner picks up the new indexes
await mcp__Neon__run_sql({
  projectId: branch.project_id,
  branchId: branch.id,
  sql: `EXPLAIN ANALYZE
        SELECT id FROM students
         WHERE "schoolId" = '<id>' AND "givenName" ILIKE '%ahm%'
         LIMIT 5;`,
})
// → look for "Bitmap Index Scan on idx_students_givenname_trgm"

// 4. If plans look right, apply on main
await mcp__Neon__run_sql({
  projectId: "<hogwarts-project-id>",
  // omit branchId → main branch
  sql: <contents of prisma/sql/spotlight-search-trgm.sql>,
})
```

For a busy production database, replace each `CREATE INDEX` with
`CREATE INDEX CONCURRENTLY` and run statements one at a time
(`CONCURRENTLY` cannot run inside a transaction).

The application code does **not** change — Prisma `findMany` queries pick
up the indexes automatically.

## Cache invalidation (Phase 4)

The server action wraps results in `unstable_cache` with a 60 s TTL and
the tag `spotlight:${schoolId}`. Most entity creates surface within a
minute without explicit invalidation. For instant freshness, call
`revalidateSpotlight(schoolId)` from the relevant entity's create/delete
server action — see `src/lib/spotlight-cache.ts`.

## i18n

All static labels (placeholder, category buttons, group names, theme,
kind chips) read from `dictionary.commandMenu.*`. Dynamic result labels
ship in the entity's stored language (no per-keystroke translation —
spotlight latency budget cannot afford it). The kind chip ("Student" /
"طالب") _is_ translated.

Arabic search input is normalized via `normalize.ts`:

- Alef variants ا أ إ آ → ا (so `أحمد` matches `احمد`)
- Ya ى → ي (so `على` matches `علي`)
- Ta-marbuta ة → ه (so `فاطمة` matches `فاطمه`)
- Tatweel ـ stripped
- Harakat (tashkeel) stripped
- NFD + combining mark strip for Latin diacritics (`Café` → `cafe`)

Server-side normalization mirrors the client so cache keys stay aligned
between the two.

## RBAC

Strict per-entity narrowing (see `server/rbac-predicates.ts` and the
test matrix in `__tests__/rbac-matrix.test.ts`):

| Role             | student      | teacher | guardian          | class                | finance | transportation |
| ---------------- | ------------ | ------- | ----------------- | -------------------- | ------- | -------------- |
| DEVELOPER, ADMIN | school       | school  | school            | school               | school  | school         |
| STAFF            | school       | school  | school            | school               | —       | school         |
| TEACHER          | own classes  | self    | school (filtered) | own teaching         | —       | school         |
| ACCOUNTANT       | school       | —       | school            | —                    | school  | school         |
| STUDENT          | self         | —       | own guardians     | own classes          | —       | —              |
| GUARDIAN         | own children | —       | self              | own children classes | —       | —              |
| USER             | —            | —       | —                 | —                    | —       | —              |

`USER` (signed-in but not yet onboarded) gets `FORBIDDEN` from the action
and never reaches the database.
