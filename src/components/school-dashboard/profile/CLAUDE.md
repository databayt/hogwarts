# Profile Block

## Context

GitHub-style user profile for any school member (student/teacher/parent/staff),
~95% complete. Rebuilt 2026-06-15 from a fabricated prototype into a real,
tenant-scoped feature. Read `README.md` for the file map and `ISSUE.md` for the
live backlog + what shipped this pass.

## Before You Start

1. Read `README.md` (architecture) and `ISSUE.md` (status, deploy-pending DB).
2. The single read path is `queries.ts → getProfileView`. The page
   (`app/.../profile/[[...id]]/page.tsx`) calls it and passes typed
   `ProfileViewData` down. Don't reintroduce `Record<string,unknown>` props.

## Key Decisions

- **One typed read, many client views.** `getProfileView` (queries.ts, NOT
  "use server" — keep it that way so callers can `cache()`) returns everything
  the page needs, already permission-masked. Client components are pure
  presenters of `ProfileViewData`; they must NOT fetch or fabricate data.
- **No fabrication, ever.** The prior version hardcoded stats/achievements/orgs
  and used `Math.random()` for the activity feed. Every number/string on the
  page now traces to a real DB row. When a real source is missing, render an
  honest empty state — never a placeholder number.
- **Badges are earned, not authored.** `badges.ts → recomputeProfileBadges`
  derives badges from real signals (attendance, results, merit rank, activity
  volume, org membership, student `Achievement` records) and reconciles the
  auto-managed rows idempotently. Manual badges (keys outside the catalog /
  `achievement_` prefix) are never touched.
- **Permission model is cross-tenant-safe.** `getPermissionLevel`
  (detail/permissions.ts) only elevates ADMIN/STAFF/TEACHER/ACCOUNTANT when
  `viewerSchoolId === profileSchoolId`. DEVELOPER is the ONLY cross-school role.
  The DB fetch is already schoolId-scoped; the permission check is the
  field-level defense-in-depth layer.
- **Badge catalog content is Arabic.** `BADGE_CATALOG` titles/descriptions are
  stored in Arabic (the schools' content language, `lang: "ar"`); English is
  produced on demand by the getLabels batch in `queries.ts`. Don't revert them
  to English "canonical" strings — that renders English on the Arabic UI.
- **Badge art lives on the CDN**, `hogwarts/<icon>.png` (source PNGs in
  `/public/github`; re-upload via `prisma/scripts/upload-badge-art.ts` — the
  CDN origin bucket is `databayt-cdn`, NOT the app's `AWS_S3_BUCKET`, and the
  bucket rejects ACLs).
- **Profile dates render in UTC** (`timeZone: "UTC"` in every Intl call:
  activity feed, graph tooltips, sidebar joined/badge dates). Instants near
  midnight otherwise format to different calendar dates on server vs browser →
  SSR hydration mismatch. Keep any new date rendering on this rule.
- **Seed `profile-activity`** keeps the block demonstrable: current-year
  attendance/feed/pins/messages/approvals + badge recompute, idempotent. If a
  demo profile looks empty, run `pnpm db:seed:single profile-activity`.
- **Dictionary lives at `dictionary.school.profile`** — NOT `dictionary.profile`.
  Components receive the already-scoped `p = dictionary.school.profile` object
  from the page. (A long-standing `.profile` bug silently rendered the whole UI
  in English; don't reintroduce it.) Keys are mirrored in `school-en.json` +
  `school-ar.json` in the same edit (parity test enforces this).

## Danger Zones

- **schoolId scope** — every read/action is tenant-scoped; userId-parameterized
  reads (`getRecentActivity`, `getContributionData`) must gate or scope, never
  trust the caller's userId.
- **New Prisma tables are deploy-pending** — `profile_badges`, `organizations`,
  `organization_memberships`. Until the migration is applied to prod, the page
  works but badges/orgs are empty. Apply via the additive migration-of-record,
  NOT `prisma migrate deploy`.
- **Avatar upload** writes both `User.image` and the role entity's
  `profilePhotoUrl` — keep both in sync or the photo won't show.
- **Don't make `queries.ts` "use server"** — it would break `cache()`.

## Related Blocks

- [Auth](../../auth/CLAUDE.md) — session/role/schoolId + viewer permission
- [Attendance](attendance/CLAUDE.md) / Exams / Admission — feed the graph + badges
- [File upload](../../file/upload) — avatar pipeline
- [Translation](../../translation/CLAUDE.md) — on-demand name/bio/label localization
- [Internationalization](../../internationalization/CLAUDE.md) — `school-*.json` dictionaries

## After You Finish

1. Update `ISSUE.md` / `README.md` (status, completion, decisions)
2. `pnpm db:seed:single profile-extras` after the migration is applied
3. `NODE_OPTIONS='--max-old-space-size=8192' pnpm tsc --noEmit`
4. `pnpm vitest run src/tests/school-dashboard/profile/`
5. Update `content/docs-en/profile.mdx` (+ `docs-ar/`)
