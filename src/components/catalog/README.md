# catalog (shared core)

The **shared catalog core**. Curriculum content (subjects → chapters → lessons + exams,
questions, materials, assignments, books, videos) is platform-wide (no `schoolId`); this
module holds the non-surface logic every catalog consumer depends on. It is not itself
route-bound — the route-bound **surfaces import from here**.

## Modules

| File                 | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup.ts`           | Catalog provisioning engine — `setupCatalogForSchool`, `inferCurriculum`, `findSubjects` (progressive fallback, PUBLISHED-only), `ensureSubjectSelections` (lazy self-heal), `setupDefaultsForSchool`, academic-structure + subject-selection bridges.                                                                                                                                                                  |
| `provision.ts`       | School-side provisioning + the **provisioning doctor** — `applyTimetableStructureForNewSchool` (year/periods/terms, idempotent), `autoProvisionSections`, `autoGenerateTimetableForSchool`, `setupLibraryForSchool` (manual-only), `getProvisioningStatus` + `repairProvisioning` (detect/repair missing stages; used by onboarding, publishSchool, operator tenants "Repair Provisioning").                            |
| `academic-config.ts` | Per-curriculum academic structure — `CURRICULUM_ACADEMIC_CONFIG` + `getAcademicConfig(code)` + `gradesForLevel` + `getStreamTypeForSubject` (curriculum-owned `streamSubjectPatterns`). SD/SA/EG/AE/QA/KW/JO = Arabic 6+3+3 with Science/Arts streams (byte-identical to the original Sudanese constants); US/CAIE-IGCSE/IB-DP = English 5+3+4; GB = key stages (`Year N`); CBSE = `Class N`; generic English fallback. |
| `image.ts`           | Server-only Sharp → WebP pipeline + S3 upload (`processAndUploadCatalogImage`, `deleteCatalogImage`, `putRawObject`).                                                                                                                                                                                                                                                                                                   |
| `image-url.ts`       | Client-safe CDN URL construction (`getCatalogImageUrl`, `getCatalogImageSrcSet`) — no AWS SDK in the client bundle.                                                                                                                                                                                                                                                                                                     |
| `concepts-data.ts`   | Shared concept registry — `colorFor`, `nearestConcept`, `SUBJECT_CONCEPT_BY_SLUG`, `CONCEPT_POOL` (used by seeds + UI).                                                                                                                                                                                                                                                                                                 |

Import directly by path, e.g. `import { setupCatalogForSchool } from "@/components/catalog/setup"`.

## Surfaces that consume this core (stay route-bound, mirror pattern)

- `src/components/saas-dashboard/catalog/` — platform authoring + moderation (DEVELOPER):
  subject/chapter/lesson CRUD, content approval (`approveContent` — also publishes), flag
  management (`updateContentFlags` + `content-flags-dialog`), proposal review
  (`approveProposal`/`rejectProposal` — opt-in publish + notification back to the school).
- `src/components/school-dashboard/listings/subjects/catalog/` — school adoption + contribution:
  `subject-picker` (with the pinned "requested by your school" section +
  `catalog-ready-reminder`), `queries.ts` (pinned proposal lookup), subject selections,
  `ContentOverride` hide/show, proposals, contributions.
- `src/components/stream/data/catalog/` — LMS read/query adapter (gating engine in
  `get-lesson-with-progress.ts`).
- `src/components/library/catalog/` — library book picker (`BookSelection`).
- `src/components/school-dashboard/exams/generate/catalog-tab.tsx` and
  `exams/qbank/actions/catalog-browse.ts` — exam-generation browse/adopt.
- `src/app/[lang]/s/[subdomain]/(school-dashboard)/(listings)/subjects/[slug]/page.tsx` —
  subject detail; applies `ContentOverride` filtering for non-admin roles and mounts the
  admin `SchoolCatalogCustomization` panel.

## Deliberately NOT here

- **Prisma models** — `prisma/models/*.prisma` (`catalog.prisma`, `chapter.prisma`,
  `lesson.prisma`, `bridge.prisma`, `proposal.prisma`, `video.prisma`, …).
- **Seeds** — `prisma/seeds/catalog/` (`index.ts` orchestrator, `registry.ts` 12-curricula
  source of truth, `engine.ts` generic tree engine, `sd.ts`/`us.ts` deep seeds, national
  subjects-only seeds, `content.ts` (idempotent), media seeds).
- **Content store** — `curriculum/` (on-disk source trees: sd, us, uk, in, fr, ib, caie-igcse).
- **Scripts** — `scripts/*` (`upload-textbooks-all.ts`, `seed-s3-videos.ts`,
  `migrate-catalog-images.ts`, `catalog-deploy-sync.ts` (deploy runbook as one
  plan/execute command), `snapshot-book-covers.ts` (OpenLibrary → own S3), …).

## Tests

- `src/tests/lib/catalog-setup.test.ts` — provisioning engine (49, incl. periods idempotency).
- `src/tests/lib/catalog-provision.test.ts` — provisioning doctor: status detection + repair-only-missing-stages + failure isolation (10).
- `src/tests/lib/catalog-banners.test.ts` — banner nearest-neighbor fallback (5).
- `src/tests/lib/catalog-setup.level-config.test.ts` — level filtering invariants (4).
- `src/tests/lib/catalog-setup.curriculum-config.test.ts` — per-curriculum config incl. SD
  byte-identity (13).
- `src/tests/lib/catalog/coverage.test.ts` — coverage helpers (9).
- Surface tests live mirror-style under `src/tests/saas-dashboard/catalog/` and
  `src/tests/school-dashboard/listings/subjects/catalog/`.
- Full catalog gate: 361 tests / 21 files (2026-06-12).

## Docs

Single consolidated hub: [/docs/catalog](/docs/catalog) (architecture, provisioning,
proposals & approval, visibility & paid content, curricula, assets, operations).
Block context for agents: [CLAUDE.md](CLAUDE.md). Live backlog: [ISSUE.md](ISSUE.md).
