# Seed System

Seeds the **demo school** (`domain: "demo"`) with a full, realistic dataset. The seed is
**idempotent** and doubles as the **default auto-provision** that runs on every deploy.

## Entry points

| Command                      | File                      | When                                         |
| ---------------------------- | ------------------------- | -------------------------------------------- |
| `prebuild` (automatic)       | `ensure-demo.ts`          | Every `pnpm build` / Vercel deploy           |
| `pnpm db:seed`               | `index.ts` → `seedMain()` | Manual full seed (idempotent)                |
| `pnpm db:seed:single <name>` | `single.ts`               | Re-seed one module against the existing demo |
| `pnpm db:seed:single --list` | `single.ts`               | List module targets                          |

### `ensure-demo.ts` (the default)

Runs on every deploy against the **production** demo school. It is **build-safe** — every
DB error is swallowed and the process exits 0, so a Neon hiccup never fails the build.

- **Fast path** — when the demo is already fully seeded (`≥500 students AND ≥100 classes`,
  see `getDemoSeedStatus` in `index.ts`) it skips the heavy seed and only re-asserts the
  critical accounts (`admin@databayt.org`, and the protected `dev@databayt.org` DEVELOPER
  role per `.claude/rules/accounts.md`). A couple of queries, a few seconds.
- **Slow path** — an empty or partially-seeded demo runs the full `seedMain`, which resumes
  only the missing work (every phase is idempotent).

## Idempotency

A second run against an already-seeded school creates **zero** duplicate rows and deletes
nothing. This is enforced two ways:

1. **Top-level short-circuit** (`index.ts`) — a fully-seeded demo exits after a quick
   users + academic-structure idempotency pass. `SEED_FORCE=1` bypasses it to re-walk every
   phase (also useful for verifying idempotency: run twice, assert equal row counts).
2. **Per-phase guards** — each module either `upsert`s, uses `createMany({ skipDuplicates })`,
   or early-returns on a `count > 0` check. Destructive `deleteMany`-then-recreate patterns
   were replaced with non-destructive count-guards (payroll, banking, stream, invoices).

> Verified on a Neon branch (2026-06-14): re-running the academic/catalog pipeline produced
> 0 new rows across academic_grades, subject_selections, score_ranges, departments,
> year_levels, academic_levels, academic_streams.

## Unified provisioning (one source of truth)

Academic structure is **not** hand-rolled in the seed. `index.ts` Phase 3 calls the same
production pipeline that real schools get at onboarding:

- `setupDefaultsForSchool` (`@/components/catalog/setup`) → ScoreRanges (+ YearLevels /
  Departments when none exist yet).
- `setupCatalogForSchool` → AcademicLevels / Grades / Streams / SubjectSelections, read from
  the school's `country`/`curriculum` (demo = SD). `skipIfExists` makes re-runs a no-op.

The retired `catalog/demo.ts` (`seedDemoSchool`) used to duplicate this logic and drifted
from `setup.ts`. `seedDepartments` reuses any pre-existing departments instead of inserting
language-duplicate rows (the demo may already carry English departments from an earlier
`setupDefaultsForSchool` run).

> `tsx` resolves the `@/*` tsconfig paths, so seed scripts can import the production
> `@/components/catalog/*` modules directly. `import "dotenv/config"` must come first
> because that chain pulls in the `@/lib/db` singleton, which reads `DATABASE_URL` at import.

## Safety

- **Never** point a seed at production manually. `ensure-demo` is the only sanctioned path,
  and it only ever targets `domain: "demo"`.
- To test the full seed, run it against a **Neon branch** (Branch-Before-Touch protocol),
  not the default branch. Set `DATABASE_URL` (and `DIRECT_URL`) to the branch connection.
