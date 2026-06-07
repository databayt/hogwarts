# catalog (shared core)

The **shared catalog core**. Curriculum content (subjects → chapters → lessons) is platform-wide
(no `schoolId`); this module holds the non-surface logic every catalog consumer depends on. It is
not itself route-bound — the route-bound **surfaces import from here**.

## Modules

| File           | Was                                | Purpose                                                                                                                                                                                                                                                                                                  |
| -------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `setup.ts`     | `src/lib/catalog-setup.ts`         | Provisioning engine — `setupCatalogForSchool`, `inferCurriculum`, `findSubjects`, `ensureSubjectSelections`, academic-structure + subject-selection bridges. ⚠️ ~1,716 lines; scaffold is still hardcoded to the Sudanese 6+3+3 / Arabic / Science-Arts model (see [/docs/catalog](/docs/catalog) gaps). |
| `image.ts`     | `src/lib/catalog-image.ts`         | Server-only Sharp → WebP pipeline + S3 upload (`processAndUploadCatalogImage`, `deleteCatalogImage`).                                                                                                                                                                                                    |
| `image-url.ts` | `src/lib/catalog-image-url.ts`     | Client-safe CDN URL construction (`getCatalogImageUrl`, `getCatalogImageSrcSet`).                                                                                                                                                                                                                        |
| `__tests__/`   | `src/lib/__tests__/catalog-setup*` | `setup.test.ts`, `setup.level-config.test.ts`.                                                                                                                                                                                                                                                           |

Import directly by path, e.g. `import { setupCatalogForSchool } from "@/components/catalog/setup"`.

## Surfaces that consume this core (stay route-bound, mirror pattern)

- `src/components/saas-dashboard/catalog/` — platform authoring (DEVELOPER).
- `src/components/school-dashboard/listings/subjects/catalog/` — school adoption + contribution.
- `src/components/stream/data/catalog/` — LMS read/query adapter.
- `src/components/library/catalog/` — library book picker.
- `src/components/school-dashboard/exams/generate/catalog-tab.tsx` — exam-generation browse.

## Deliberately NOT here

- **Prisma models** — `prisma/models/*.prisma` (`catalog.prisma`, `chapter.prisma`, `lesson.prisma`, `bridge.prisma`, …).
- **Seeds** — `prisma/seeds/*` (`catalog.ts`, `us-catalog.ts`, `sd-catalog.ts`, `sync-sd-curriculum.ts`, `world-curricula.ts`, `concept-images.ts`, …).
- **Content store** — `curriculum/` (5-country on-disk source), `public/subjects/concepts/`.
- **Scripts** — `scripts/*` (`upload-textbooks-all.ts`, `migrate-catalog-images.ts`, …).

## History

Consolidated from scattered `src/lib/catalog-*` + `src/lib/catalog/` into this one short-named module
(see [/docs/catalog](/docs/catalog)). Four dead files (0 importers) were deleted in the
move: `catalog-engagement.ts`, `catalog/exam-generator.ts`, `catalog/coverage.ts`, `ui/catalog-image.tsx`.
