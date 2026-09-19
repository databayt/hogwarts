// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The single derivation for every catalog CDN key.
 *
 * Scheme (2026-09-19) — a browsable hierarchy that mirrors how the content is
 * actually organised on disk:
 *
 *   catalog/<curriculum>/<grade>/<subjectDir>/textbook.pdf
 *   catalog/<curriculum>/<grade>/<subjectDir>/<chapterSlug>/qbank.json
 *   catalog/<curriculum>/<grade>/<subjectDir>/<chapterSlug>/<lessonSlug>/quiz.json
 *
 * It replaces the flat `catalog/textbooks/<dbSlug>/` prefix, which restated
 * curriculum + grade + subject in a form nothing could browse and had no room
 * to address anything below a subject.
 *
 * `<subjectDir>` is the CURRICULUM FOLDER name (`math`), not the DB slug
 * suffix (`basic-math`) — so the scheme is 1:1 with `curriculum/sd/` on disk
 * and the publish path needs no dir->slug override table. The 14 global + ~25
 * per-grade overrides in `prisma/seeds/catalog/sd.ts` map dir->slug and are NOT
 * invertible in general, which is why callers holding only a DB slug read
 * `prisma/seeds/catalog/sd-subject-dirs.json` instead of reversing them.
 *
 * Runtime does not derive these at all: it reads the stored `Subject.pdf` key
 * and strips the filename (see `catalogSibling`, and the equivalent inline
 * expression in `school-dashboard/listings/subjects/textbook/content.tsx`).
 *
 * This module is PURE — no env, no I/O — so seeds, scripts and RSC can all
 * import it. It only JOINS segments; it never appends a suffix. The
 * `-{sm,md,lg,original}.webp` variant convention still belongs to
 * `./image-url.ts`.
 */

export const CATALOG_ROOT = "catalog"

/** The flat prefix this scheme replaces. Kept for the migration + rollback. */
export const CATALOG_LEGACY_ROOT = "catalog/textbooks"

export interface CatalogScope {
  /** Curriculum FOLDER name — "sd", "uk", "in". Lowercase. */
  curriculum: string
  /** Grade FOLDER name, including the "g" — "g12". */
  grade: string
  /** Subject FOLDER name — "biology", "math" (never "basic-math"). */
  subjectDir: string
  /** Chapter slug — "01-asexual-reproduction". */
  chapterSlug?: string
  /** Lesson slug — "01-characteristics-of-asexual-reproduction". */
  lessonSlug?: string
}

/** Every filename the scheme addresses. `pages/<N>.webp` is templated. */
export type CatalogAsset =
  | "textbook.pdf"
  | "textbook.md"
  | "structure.json"
  | "cover.jpg"
  | "thumbnail.jpg"
  | "banner.jpg"
  | "qbank.json"
  | "exams.json"
  | "quiz.json"
  | `pages/${number}.webp`

/** Control characters are invalid in a path segment; built without a literal. */
const CONTROL_CHARS = new RegExp(
  `[${String.fromCharCode(0)}-${String.fromCharCode(31)}${String.fromCharCode(127)}]`
)

/**
 * A path segment must be a real directory name. Rejecting `.` / `..` / `/` and
 * control characters keeps a malformed slug from escaping its prefix — an empty
 * `subjectDir` would otherwise silently collapse `catalog/sd/g12//textbook.pdf`
 * into a sibling of the grade.
 *
 * Non-ASCII is ALLOWED: 61 lesson slugs under sd-g5 are raw Arabic. They are
 * valid S3 keys; it is the URL that needs encoding, not the key.
 */
function assertSegment(value: string, field: string): string {
  if (!value) throw new Error(`catalogKey: ${field} is empty`)
  if (value.includes("/"))
    throw new Error(
      `catalogKey: ${field} contains a slash — ${JSON.stringify(value)}`
    )
  if (value === "." || value === "..")
    throw new Error(`catalogKey: ${field} is a relative path segment`)
  if (value.startsWith("."))
    throw new Error(
      `catalogKey: ${field} starts with a dot — ${JSON.stringify(value)}`
    )
  if (CONTROL_CHARS.test(value))
    throw new Error(`catalogKey: ${field} contains a control character`)
  return value
}

/**
 * The directory a scope addresses, with no trailing slash.
 *
 *   catalogBase({ curriculum: "sd", grade: "g12", subjectDir: "biology" })
 *     -> "catalog/sd/g12/biology"
 */
export function catalogBase(scope: CatalogScope): string {
  if (scope.lessonSlug && !scope.chapterSlug)
    throw new Error("catalogKey: lessonSlug given without chapterSlug")

  const segments = [
    CATALOG_ROOT,
    assertSegment(scope.curriculum, "curriculum"),
    assertSegment(scope.grade, "grade"),
    assertSegment(scope.subjectDir, "subjectDir"),
  ]
  if (scope.chapterSlug)
    segments.push(assertSegment(scope.chapterSlug, "chapterSlug"))
  if (scope.lessonSlug)
    segments.push(assertSegment(scope.lessonSlug, "lessonSlug"))
  return segments.join("/")
}

/**
 *   catalogKey({ curriculum: "sd", grade: "g12", subjectDir: "biology" }, "textbook.md")
 *     -> "catalog/sd/g12/biology/textbook.md"
 */
export function catalogKey(scope: CatalogScope, asset: CatalogAsset): string {
  // `pages/<N>.webp` is the one asset carrying a slash, so it is validated as a
  // pair rather than through assertSegment.
  if (asset.startsWith("pages/")) {
    const page = asset.slice("pages/".length)
    if (!/^\d+\.webp$/.test(page))
      throw new Error(
        `catalogKey: malformed page asset ${JSON.stringify(asset)}`
      )
  } else {
    assertSegment(asset, "asset")
  }
  return `${catalogBase(scope)}/${asset}`
}

/** The flat prefix a DB slug used to live under, WITH its trailing slash. */
export function catalogLegacyPrefix(dbSlug: string): string {
  return `${CATALOG_LEGACY_ROOT}/${assertSegment(dbSlug, "dbSlug")}/`
}

/**
 * A sibling of an already-stored key — the runtime path.
 *
 * Mirrors what the textbook reader does inline today:
 *   `subject.pdfKey.replace(/\/[^/]+$/, "") + "/textbook.md"`
 *
 * Scheme-agnostic on purpose: it works against both the legacy and the new
 * prefix, so the reader keeps working across the flip with no code change.
 *
 *   catalogSibling("catalog/sd/g12/biology/textbook.pdf", "textbook.md")
 *     -> "catalog/sd/g12/biology/textbook.md"
 *   catalogSibling("catalog/sd/g12/biology/textbook.pdf", "01-mitosis", "qbank.json")
 *     -> "catalog/sd/g12/biology/01-mitosis/qbank.json"
 */
export function catalogSibling(
  storedKey: string,
  ...segments: string[]
): string {
  const base = storedKey.replace(/\/[^/]+$/, "")
  if (!base || base === storedKey)
    throw new Error(
      `catalogSibling: ${JSON.stringify(storedKey)} has no parent directory`
    )
  return [base, ...segments].join("/")
}

/**
 * Percent-encode a key for use in a URL, segment by segment.
 *
 * `encodeURIComponent` over the whole key would eat the separators, and leaving
 * it raw breaks the 61 Arabic lesson slugs under sd-g5. Feed the result to
 * `getCloudFrontUrl`, which is a plain concat and does no encoding of its own.
 */
export function encodeCatalogKey(key: string): string {
  return key.split("/").map(encodeURIComponent).join("/")
}
