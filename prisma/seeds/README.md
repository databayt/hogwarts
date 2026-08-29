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

## Profiles — `full` (default) vs `lite`

Set **`SEED_PROFILE=lite`** to seed a small-but-realistic demo: ~50 students across a full
K-12 span, ~12 teachers, ~110 guardians, one homeroom (section A) per grade. Everything
downstream — attendance, grades, exams, invoices, guardians — scales off those counts, so
the whole DB stays tiny (~40-70 MB static). This exists so the demo can run on a **fresh
Neon Free project** (512 MB storage + a monthly compute quota) for a whole month without
tripping either cap. Unset / anything else = `full`, the canonical ~800-student demo.

The knobs live in one place: `SEED_IS_LITE` + `SEED_PROFILE_COUNTS` in `constants.ts`
(student/teacher/guardian user counts, per-level cap, section letters) **and** the matching
`SEED_THRESHOLDS` in `index.ts`. They move together on purpose: if the "fully seeded"
threshold didn't drop with the data, `ensure-demo` would re-grow the lean demo to full on
the next deploy. Set the env var in the target project's Vercel env, not in code.

### `ensure-demo.ts` (the default)

Runs on every deploy against the **production** demo school. It is **build-safe** — every
DB error is swallowed and the process exits 0, so a Neon hiccup never fails the build.

- **Fast path** — when the demo is already fully seeded (`≥500 students AND ≥100 classes`,
  see `getDemoSeedStatus` in `index.ts`) it skips the heavy seed and only re-asserts the
  critical accounts (`admin@balqalam.com`, and the protected `dev@balqalam.com` DEVELOPER
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

Phase 10 follows the same rule for **grades**. `grades.ts` does not invent scores: it
projects every GRADED `AssignmentSubmission` into the unified `Result` gradebook (scored
with the gradebook spine's own `toPercentage` + `letterGradeFor` against the school's real
`GradeBoundary` rows, de-duped on the spine's `assignmentId` match key), then calls the
production `generateReportCardsCore` to build `ReportCard` + `ReportCardGrade` + rank +
attendance days. Before this the seed rolled a _random_ GPA straight onto the report card —
a student with all-F exams could print an A+ — and wrote no `ReportCardGrade` rows at all,
so the `.docx` report-card template's subject loop rendered empty. Demo totals: 14,306
gradebook rows, 970 report cards, 14,738 subject grades.

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

## Conference — the online-school demo (`pnpm db:seed:single conference`)

The block shipped with no seed, and that hid the real blocker: 719 of the
demo's 840 slots had no teacher, because the expertise seed is count-guarded
and never re-ran after the catalog grew (the demo's Math alone is ten per-grade
`catalog_subjects` rows). No teacher → no HOST → the materializer skips the
slot. This module **repairs before it seeds**, in order, each step idempotent:

1. `Period.isBreak` for rows seeded before the column existed (a one-time
   name-based data repair — readers must never do this, see timetable CLAUDE.md).
2. Expertise top-up: every active `SubjectSelection` gets 3 qualified teachers;
   `teacher@balqalam.com` gets everything `student@balqalam.com`'s grade takes.
3. Teacher backfill on teacherless slots — qualified, free at that
   (day, period), under 25/week, `teacher@`'s slots first and on `student@`'s
   section. Additive: never moves an existing assignment. Demo: 121 → 815 of 840.
4. Policy: online by default over LiveKit, timetable mode, attendance sync on,
   recording off (no bucket); two sections in person, one opted in explicitly.
5. History (5 school days × 3 focus sections): ended sessions, participants
   with join/leave/duration, webhook audit events, and the VIRTUAL attendance
   the sync writes — by the sync's own rules, presence floor included.
6. Next school day: `scheduled` sessions for every online slot, day-qualified
   exactly as the cron writes them (it finds `exists`, never double-creates),
   one hosted by a CONFIRMED substitute, one carrying a catalog lesson + exam
   - assignment + link. Plus a school-wide assembly, three recurring external
     links and one declared holiday.

Count-guard: sessions skip when any `Conference` with a `timetableId` exists;
`SEED_FORCE=1` rebuilds them (and the VIRTUAL attendance). The repairs and the
policy always run and are no-ops the second time. Runs in ~7 min against Neon
from a laptop, ~9 s when already seeded.

**Every write carries `select: { id: true }`.** A write with no select returns
every column and P2022s on a database one column behind the schema — prod
lacks `schools.trialEndsAt` today and that is exactly how the first run died.

**Prod note:** flipping the demo online arms the live cron: real
materialization every 15 min and `starting_soon` reminders into every demo
student's and guardian's bell. Those rows also accrue `emailSent:false` —
`process-email-notifications` stays off until it has an age gate.
