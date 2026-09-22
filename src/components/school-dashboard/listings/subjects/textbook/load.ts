// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// Server-only read: fetches the book's text twin from the CDN and builds the
// reader's structure. Not a "use server" action.
import "server-only"

import { getCloudFrontUrl } from "@/lib/cloudfront-url"

import { fill, formatNumber, gradeLine, stageLine } from "./format"
import { anchorToc, parseTwin, type TwinPage } from "./parse"
import {
  groupSections,
  isCoverPage,
  resolvePageOffset,
  resolveToc,
  type DbChapter,
  type TocChapter,
} from "./spine"
import { fetchStructure } from "./structure"
import type { BookMeta, CoverInfo, ReaderLabels, SectionMeta } from "./types"

const RTL_LANGS = new Set(["ar", "fa", "ur", "he", "ps", "ku"])

export interface TextbookSubject {
  name: string
  slug: string
  pdfKey: string
  coverKey: string | null
  description: string | null
  grade: number | null
  level: string | null
  chapters: DbChapter[]
}

/** The heading a chapter's or lesson's first page opens with. */
export interface Opener {
  kicker: string | null
  title: string
  level: "chapter" | "lesson"
}

export interface LoadedSection {
  meta: SectionMeta
  pages: TwinPage[]
  /** Openers keyed by PDF page number. */
  openers: Record<number, Opener>
}

export type LoadedTextbook =
  | { status: "unavailable" | "noText"; pdfUrl: string }
  | {
      status: "ok"
      pdfUrl: string
      /** The book's folder on the CDN; figure `src`s are relative to it. */
      assetBaseUrl: string
      pagesBaseUrl: string
      meta: BookMeta
      cover: CoverInfo
      toc: TocChapter[]
      sections: LoadedSection[]
    }

async function fetchTwin(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    return res.ok ? await res.text() : null
  } catch {
    return null
  }
}

/**
 * The textbook as the reader lays it out: the text twin parsed into pages,
 * the contents resolved to pages, the book split into flows (front matter,
 * then one per chapter), and each chapter's and lesson's opener placed.
 *
 * The web reader (`content.tsx`) and `/api/mobile/textbooks/[slug]` both
 * build from this, so a phone and a browser can never disagree about what
 * is on a page — they only differ in how they paginate it.
 */
export async function loadTextbook(
  subject: TextbookSubject,
  labels: ReaderLabels,
  lang: string
): Promise<LoadedTextbook> {
  const base = subject.pdfKey.replace(/\/[^/]+$/, "")
  const pdfUrl = getCloudFrontUrl(subject.pdfKey)
  const assetBaseUrl = getCloudFrontUrl(base)
  const mdUrl = getCloudFrontUrl(`${base}/textbook.md`)
  const pagesBaseUrl = getCloudFrontUrl(`${base}/pages`)
  const structureUrl = getCloudFrontUrl(`${base}/structure.json`)

  const [markdown, structure] = await Promise.all([
    fetchTwin(mdUrl),
    fetchStructure(structureUrl),
  ])

  if (markdown === null || markdown.trim().length === 0)
    return { status: markdown === null ? "unavailable" : "noText", pdfUrl }

  const parsed = parseTwin(markdown)
  if (!parsed.pages.some((p) => p.blocks.length > 0))
    return { status: "noText", pdfUrl }

  const coverUrl = subject.coverKey ? getCloudFrontUrl(subject.coverKey) : null
  const pages = coverUrl
    ? parsed.pages.filter((p) => !isCoverPage(p))
    : parsed.pages
  const offset = resolvePageOffset(pages, structure)
  const anchors = anchorToc(pages, subject.chapters)
  const toc = resolveToc(
    subject.chapters,
    structure,
    offset,
    parsed.meta.sourcePages,
    anchors
  )
  const groups = groupSections(pages, toc, parsed.hasPageMarkers)

  const bookLang = parsed.meta.lang || "ar"
  const dir: "rtl" | "ltr" = RTL_LANGS.has(bookLang) ? "rtl" : "ltr"
  const title = subject.name || parsed.meta.title || ""

  const sections: LoadedSection[] = groups.map((g) => {
    const ch = g.chapterIndex != null ? toc[g.chapterIndex] : null
    const meta: SectionMeta = {
      kind: g.kind,
      title: ch ? ch.name : g.kind === "front" ? labels.frontMatter : title,
      kicker:
        ch && g.chapterIndex != null
          ? fill(labels.unitN, { n: formatNumber(g.chapterIndex + 1, lang) })
          : null,
      pages: g.pages.flatMap((p) => (p.number != null ? [p.number] : [])),
      chapterIndex: g.chapterIndex,
    }

    const openers: Record<number, Opener> = {}
    const first = g.pages[0]?.number
    if (ch && first != null)
      openers[first] = { kicker: meta.kicker, title: ch.name, level: "chapter" }
    for (const lesson of ch?.lessons ?? []) {
      const start = lesson.page
      if (start == null) continue
      const page = g.pages.find((p) => p.number != null && p.number >= start)
      if (
        !page ||
        page.number == null ||
        page.number === first ||
        openers[page.number]
      )
        continue
      openers[page.number] = {
        kicker: null,
        title: lesson.name,
        level: "lesson",
      }
    }
    return { meta, pages: g.pages, openers }
  })

  const meta: BookMeta = {
    title,
    edition: parsed.meta.edition,
    lang: bookLang,
    dir,
    sourcePages: parsed.meta.sourcePages,
    offset,
    notice:
      parsed.meta.quality && parsed.meta.coverage != null
        ? fill(labels.notice, {
            quality: parsed.meta.quality,
            coverage: parsed.meta.coverage,
          })
        : null,
    hasPageImages: parsed.hasPageMarkers,
  }
  const cover: CoverInfo = {
    url: coverUrl,
    stage: stageLine(subject.level, labels),
    gradeLine: gradeLine(subject.grade, subject.level, labels, lang),
  }

  return {
    status: "ok",
    pdfUrl,
    assetBaseUrl,
    pagesBaseUrl,
    meta,
    cover,
    toc,
    sections,
  }
}
