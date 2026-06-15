# Catalog image migration: concept-shared → per-entity slug paths

**Status:** PLAN — review before any code change.
**Goal:** every Subject / Chapter / Lesson resolves its OWN image from a clean, deterministic CDN
key derived purely from its slugs, replacing today's concept-shared keys. Preserve the existing
coupling (DB key prefix + `getCatalogImageUrl`) and the ClickView provenance.

---

## 1. Where we are today (verified)

**Key shape (concept-shared).** `prisma/seeds/catalog/us.ts` (~L1062–1122):

```ts
const gradeConceptPrefix = concept
  ? `catalog/concepts/g${grade}-${concept}`
  : null
subject.thumbnail = `${gradeConceptPrefix}/thumbnail` // catalog/concepts/g3-math/thumbnail
subject.banner = `${gradeConceptPrefix}/banner`
subject.cover = `catalog/concepts/${concept}/cover` // one per concept, all grades
chapter.thumbnail = `${gradeConceptPrefix}/thumbnail` // SHARED — every g3-math chapter identical
```

→ all Grade-3 Math entities share one image; chapters/lessons have no unique art.

**Schema already supports per-entity keys — NO migration needed** (`prisma/models/*.prisma`):

- `Subject`: `slug @unique` (grade-stamped, e.g. `us-g3-math`), `curriculum` (e.g. `"US"`),
  `thumbnail @map("thumbnailKey")`, `banner @map("bannerUrl")`, `cover`.
- `Chapter`: `slug`, `@@unique([subjectId, slug])`, `thumbnail @map("thumbnailKey")`.
- `Lesson`: `slug`, `@@unique([chapterId, slug])`, `thumbnail @map("thumbnailKey")`, `coverId`
  (ClickView source id, e.g. `JjKENb`).

**Resolver — UNCHANGED** (`src/components/catalog/image-url.ts`): `getCatalogImageUrl(prefix, size)`
→ `getCloudFrontUrl(`${prefix}-${size}.webp`)`. It only cares that the stored value is a prefix; it
is agnostic to how the prefix is shaped. The migration changes only the stored prefix.

**Image pipeline** (`src/components/catalog/image.ts`): `processAndUploadCatalogImage(buffer, prefix)`
→ Sharp → uploads `${prefix}-{sm,md,lg,original}.webp`. Sources: `scripts/snapshot-covers.ts`
(ClickView `coverId` → `catalog/source-covers/{coverId}`) and
`scripts/download-topic-illustrations.ts` (concept illustrations).

---

## 2. Target key scheme (canonical — matches codebase `cdn.mdx`)

`catalog/<curriculum>/<subjectSlug>/[<chapterSlug>/[<lessonSlug>/]]<asset>`

| Entity              | Stored prefix (thumbnail/banner)                             | Resolver output       |
| ------------------- | ------------------------------------------------------------ | --------------------- |
| Subject             | `catalog/us/us-g3-math/thumbnail` · `…/banner`               | `…/thumbnail-md.webp` |
| Subject cover (raw) | `catalog/us/us-g3-math/cover.jpg`                            | exact, no `-size`     |
| Subject textbook    | `catalog/us/us-g3-math/textbook.pdf`                         | exact                 |
| Chapter             | `catalog/us/us-g3-math/fractions/thumbnail`                  | `…-md.webp`           |
| Lesson              | `catalog/us/us-g3-math/fractions/adding-fractions/thumbnail` | `…-md.webp`           |
| Source snapshot     | `catalog/source-covers/JjKENb` (UNCHANGED)                   | provenance only       |

`subjectSlug` is global + grade-stamped, so there is no grade segment. `chapterSlug`/`lessonSlug`
are unique only within their parent → ancestors mandatory.

---

## 3. Changes (ordered, smallest-blast-radius first)

### 3.1 NEW `src/components/catalog/catalog-key.ts` — the single key derivation

Mirrors codebase `cdn.catalog()`. Pure, slug-only, used by seeds AND any runtime key build.

```ts
export function catalogKey(p: {
  curriculum: string // Subject.curriculum ("US")
  subjectSlug: string // Subject.slug ("us-g3-math")
  chapterSlug?: string
  lessonSlug?: string
  asset?: "thumbnail" | "banner"
}): string {
  const segs = ["catalog", p.curriculum.toLowerCase(), p.subjectSlug]
  if (p.chapterSlug) segs.push(p.chapterSlug)
  if (p.lessonSlug) segs.push(p.lessonSlug)
  segs.push(p.asset ?? "thumbnail")
  return segs.join("/")
}
// raw assets: catalogRawKey(p, "cover.jpg" | "textbook.pdf") — same path, exact filename
```

### 3.2 Seed rewrite (`prisma/seeds/catalog/us.ts`, then `sd.ts` / other curricula)

Replace the `gradeConceptPrefix` block:

```ts
// FROM: shared concept prefix
subject.thumbnail = `${gradeConceptPrefix}/thumbnail`
chapter.thumbnail = `${gradeConceptPrefix}/thumbnail`
// TO: per-entity, slug-derived
subject.thumbnail = catalogKey({ curriculum, subjectSlug })
subject.banner = catalogKey({ curriculum, subjectSlug, asset: "banner" })
chapter.thumbnail = catalogKey({ curriculum, subjectSlug, chapterSlug })
lesson.thumbnail = catalogKey({
  curriculum,
  subjectSlug,
  chapterSlug,
  lessonSlug,
})
```

`concept` and `coverId` stay (concept = which source illustration to use; coverId = ClickView
provenance). They become inputs to the BACKFILL, not the key.

### 3.3 Backfill script `scripts/catalog/backfill-per-entity-images.ts` (the real work)

For every entity, upload its image to the new per-entity prefix via `processAndUploadCatalogImage`:

- **Lesson** → source = `catalog/source-covers/{coverId}` (snapshot it first if missing) → process
  to `catalog/us/<subj>/<chap>/<lesson>/thumbnail-*.webp`.
- **Subject/Chapter** → source = the concept illustration (today's `catalog/concepts/...`
  original, or the `download-topic-illustrations` asset for `concept`) → process to the per-entity
  prefix.
- Idempotent (skip if target `-original.webp` exists); concurrency-limited; dry-run flag.
- **Volume:** ~4,000 lessons + subjects/chapters × 4 variants ≈ 16–18k PutObjects. Budget a run +
  CloudFront invalidation. (Lessons without a `coverId` fall back per §5.)

### 3.4 Cutover & cleanup

- Reseed (or a data migration that rewrites the stored `thumbnailKey`/`bannerUrl` columns) so DB
  rows point at the new prefixes. Resolver needs no change.
- Verify a sample across grades/subjects renders. Then optionally delete `catalog/concepts/**`
  (keep `catalog/source-covers/**` — it is the re-seed source of truth).

### 3.5 Provenance (already done on the codebase side)

`catalog/**` assets carry `slug: "clickview"` in the CDN manifest (`provenanceSlug()` in
`scripts/cdn/harvest-rules.ts`) — no hogwarts schema change; the showroom filters by it.

---

## 4. Migration order

1. Add `catalog-key.ts` (+ unit test: known slugs → known keys).
2. Rewrite `us.ts` key derivation to `catalogKey` (no DB write yet — verify generated keys in a dry run).
3. Write + dry-run the backfill script against a handful of subjects.
4. Full backfill to S3 (per-entity webp variants) + CloudFront invalidation.
5. Reseed / column-rewrite so rows point at per-entity prefixes.
6. Visual verify; then prune `catalog/concepts/**`.

Reversible at every step: the stored key column is the only switch — revert the seed block and
re-point rows to `catalog/concepts/...` while those objects still exist.

---

## 5. Open questions (decide before step 3)

1. **Lessons without a `coverId`** (not all ~4,000 have one) — fall back to chapter thumbnail, or
   subject thumbnail, or a concept default? (Recommend: lesson → chapter → subject cascade in the
   resolver, so missing per-lesson art degrades gracefully without dead keys.)
2. **`curriculum` segment redundancy** — `subjectSlug` already starts `us-…`, so `catalog/us/us-g3-math`
   repeats `us`. Keep for browsability (matches the doc) or drop the segment (`catalog/us-g3-math/…`)?
3. **Cover/textbook scope** — covers are per-concept today (`catalog/concepts/{concept}/cover`).
   Move to per-subject (`catalog/us/us-g3-math/cover.jpg`) or keep one shared cover per concept?
4. **Other curricula** — `sd.ts` (Sudan) and any others need the same rewrite; confirm the full list.
5. **Run budget** — ~16–18k uploads is within the new `databayt-cdn` once the IAM key exists;
   confirm we run the backfill AFTER the bucket is provisioned (depends on the CDN infra go-live).

---

## 6. Risks

- **Volume/cost** of the backfill (16k+ objects). Mitigate: idempotent + skip-existing + batch.
- **Slug instability** — if a chapter/lesson slug changes later, its key changes; the image must be
  re-backfilled. Acceptable (slugs are stable identifiers) but document it.
- **Depends on the dead CDN being replaced** — hogwarts `data.ts`/CloudFront still reference the
  decommissioned `d1dlwtcfl0db67…`; the backfill must target the net-new `databayt-cdn` +
  `cdn.databayt.org` (see codebase `scripts/cdn/`), not the old infra.
- **Partial cutover** — if some rows point at new keys and the objects aren't uploaded yet, images 404. Mitigate: backfill (step 4) strictly before column-rewrite (step 5).
