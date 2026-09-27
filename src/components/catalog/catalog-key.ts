// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The single derivation for every catalog CDN key.
 *
 *   catalog/<curriculum>/<grade>/<subject>/textbook.pdf
 *   catalog/<curriculum>/<grade>/<subject>/c<N>/qbank.json
 *   catalog/<curriculum>/<grade>/<subject>/c<N>/l<N>/exams.json
 *
 * The key is the repository path prefixed with `catalog/` — the repo mirrors
 * the CDN (github.com/databayt/catalog, src/paths.ts), and the subject id is `<curriculum>-<grade>-<subject>` —
 * so a key, a path and an id are three spellings of the same thing, with no
 * override table in between.
 *
 * Runtime code usually holds a stored key (e.g. a subject's textbook.pdf) and
 * derives siblings from it with `catalogSibling`.
 *
 * PURE — no env, no I/O — so apps, seeds, scripts and RSC can all import it.
 * It only joins segments; URL encoding is `encodeCatalogKey`'s job.
 */

export const CATALOG_ROOT = "catalog"

/** @deprecated The flat pre-2026-09-19 prefix, kept only for rollback tooling. */
export const CATALOG_LEGACY_ROOT = "catalog/textbooks"

export interface CatalogScope {
  /** Curriculum id — "sd", "gb", "cbse", "ib-dp". */
  curriculum: string
  /** Grade id, including the "g" — "g12". */
  grade: string
  /** Subject folder — "biology", "islamic-studies", "math-specialized". */
  subjectDir: string
  /** Chapter — "c1" (positional, like grades). */
  chapterSlug?: string
  /** Lesson within the chapter — "l3". */
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
  | `pages/${number}.webp`
  | `pages-md/${number}.md`

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
 * Catalog slugs are ASCII (the validator enforces it), but this guard stays
 * permissive so it can also build keys for legacy objects.
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
  if (asset.startsWith("pages/") || asset.startsWith("pages-md/")) {
    const page = asset.slice(asset.indexOf("/") + 1)
    if (!/^\d+\.(webp|md)$/.test(page))
      throw new Error(
        `catalogKey: malformed page asset ${JSON.stringify(asset)}`
      )
  } else {
    assertSegment(asset, "asset")
  }
  return `${catalogBase(scope)}/${asset}`
}

/** @deprecated The flat prefix a DB slug used to live under, WITH its trailing slash. */
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
 *   catalogSibling("catalog/sd/g12/biology/textbook.pdf", "c1", "l3", "qbank.json")
 *     -> "catalog/sd/g12/biology/c1/l3/qbank.json"
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

/** `chapterSlug(1)` -> "c1". Chapters are numbered in book order from 1. */
export const chapterSlug = (n: number): string => `c${n}`

/** `lessonSlug(3)` -> "l3". Lessons are numbered from 1 within their chapter. */
export const lessonSlug = (n: number): string => `l${n}`
