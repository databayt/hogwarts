// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { normalizeForSearch, type TocEntry, type TwinPage } from "./parse"

/**
 * The spine of the book — pure functions that turn the twin's pages, the DB
 * chapters and the optional authoring structure into (1) a contents table
 * with a PDF page per chapter/lesson and (2) the sections the client
 * paginates one screen at a time. Nothing here touches the DOM.
 */

export interface StructureLesson {
  title: string
  page: number | null
}
export interface StructureChapter {
  title: string
  page: number | null
  lessons: StructureLesson[]
}
export interface StructurePages {
  /** Whether `page` fields count printed pages ("book") or PDF pages. */
  pageNumbers: "book" | "pdf"
  chapters: StructureChapter[]
}

function positiveInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v) && v > 0) return v
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v)
  return null
}

/** Accept only what the reader needs from an arbitrary structure.json. */
export function normalizeStructure(json: unknown): StructurePages | null {
  if (!json || typeof json !== "object") return null
  const o = json as Record<string, unknown>
  if (!Array.isArray(o.chapters)) return null
  const chapters: StructureChapter[] = o.chapters.map((c) => {
    const cc = (c && typeof c === "object" ? c : {}) as Record<string, unknown>
    const lessons: StructureLesson[] = Array.isArray(cc.lessons)
      ? cc.lessons.map((l) => {
          const ll = (l && typeof l === "object" ? l : {}) as Record<
            string,
            unknown
          >
          return { title: String(ll.title ?? ""), page: positiveInt(ll.page) }
        })
      : []
    return {
      title: String(cc.title ?? ""),
      page: positiveInt(cc.page),
      lessons,
    }
  })
  return { pageNumbers: o.pageNumbers === "pdf" ? "pdf" : "book", chapters }
}

export interface DbChapter {
  id: string
  name: string
  lessons: { id: string; name: string }[]
}
export interface TocLesson {
  id: string
  name: string
  /** PDF page the lesson starts on, or null when unknown. */
  page: number | null
}
export interface TocChapter {
  id: string
  name: string
  page: number | null
  lessons: TocLesson[]
}

function sameTitle(a: string, b: string): boolean {
  const x = normalizeForSearch(a)
  const y = normalizeForSearch(b)
  if (!x || !y) return false
  return x === y || (x.length >= 6 && (x.startsWith(y) || y.startsWith(x)))
}

/**
 * A PDF page for every chapter and lesson. Structure pages win (mapped
 * through the printed→PDF offset and clamped to the book); anything the
 * structure cannot place falls back to the name-matched anchors. Pages must
 * increase along the book, so a stray value is dropped rather than trusted.
 */
export function resolveToc(
  chapters: DbChapter[],
  structure: StructurePages | null,
  offset: number | null,
  sourcePages: number | null,
  anchors: TocEntry[]
): TocChapter[] {
  const anchorPage = new Map<string, number>()
  const walk = (e: TocEntry) => {
    const m = e.anchor?.match(/^p-(\d+)$/)
    if (m) anchorPage.set(e.id, Number(m[1]))
    e.children.forEach(walk)
  }
  anchors.forEach(walk)

  const toPdf = (p: number | null): number | null => {
    if (p === null || !structure) return null
    const pdf =
      structure.pageNumbers === "pdf" ? p : offset === null ? null : p + offset
    if (pdf === null || pdf < 1) return null
    if (sourcePages && pdf > sourcePages) return null
    return pdf
  }
  const pick = <T extends { title: string }>(
    list: T[] | undefined,
    name: string,
    byIndex: T | undefined
  ): T | undefined => {
    if (!list) return undefined
    if (byIndex) return byIndex
    return list.find((x) => sameTitle(x.title, name))
  }

  const sameCount =
    structure !== null && structure.chapters.length === chapters.length
  let prev = 0
  return chapters.map((ch, i) => {
    const sc = pick(
      structure?.chapters,
      ch.name,
      sameCount ? structure?.chapters[i] : undefined
    )
    let page = toPdf(sc?.page ?? null)
    if (page !== null && page <= prev) page = null
    if (page === null) {
      const a = anchorPage.get(ch.id)
      if (a !== undefined && a > prev) page = a
    }
    if (page !== null) prev = page

    const lessonsSame = sc ? sc.lessons.length === ch.lessons.length : false
    let lprev = page ?? 0
    const lessons = ch.lessons.map((l, j) => {
      const sl = pick(
        sc?.lessons,
        l.name,
        lessonsSame ? sc?.lessons[j] : undefined
      )
      let lp = toPdf(sl?.page ?? null)
      if (lp !== null && lp < lprev) lp = null
      if (lp === null) {
        const a = anchorPage.get(l.id)
        if (a !== undefined && a >= lprev) lp = a
      }
      if (lp !== null) lprev = lp
      return { id: l.id, name: l.name, page: lp }
    })
    return { id: ch.id, name: ch.name, page, lessons }
  })
}

/**
 * A front-matter page that is mostly digits and symbols — an aggregator's
 * cover, a barcode page — reads as garbage once OCR'd; letters must carry
 * the page for it to be worth a screen.
 */
export function isNoisePage(page: TwinPage): boolean {
  let letters = 0
  let total = 0
  for (const b of page.blocks) {
    const texts =
      b.kind === "heading" || b.kind === "paragraph"
        ? [b.text]
        : b.kind === "list"
          ? b.items
          : b.kind === "table"
            ? b.rows.flat()
            : []
    for (const t of texts)
      for (const ch of t) {
        if (/\s/.test(ch)) continue
        total++
        if (/\p{L}/u.test(ch)) letters++
      }
  }
  return total > 0 && letters / total < 0.6
}

export type SectionKind = "front" | "chapter" | "chunk"
export interface Section {
  kind: SectionKind
  /** Index into the contents table for chapter sections. */
  chapterIndex: number | null
  pages: TwinPage[]
}

/**
 * Split the book into the flows the client lays out: the front matter, then
 * one flow per chapter (from its start page to the next chapter's). A book
 * whose chapters could not be placed is cut into fixed chunks so no single
 * flow grows unbounded; a marker-less twin is one flow.
 */
export function groupSections(
  pages: TwinPage[],
  toc: TocChapter[],
  hasPageMarkers: boolean,
  chunk = 10
): Section[] {
  const textPages = pages.filter((p) => p.blocks.length > 0)
  if (textPages.length === 0) return []
  if (!hasPageMarkers)
    return [{ kind: "chunk", chapterIndex: null, pages: textPages }]

  const starts: { index: number; page: number }[] = []
  toc.forEach((c, i) => {
    if (
      c.page !== null &&
      (starts.length === 0 || c.page > starts[starts.length - 1].page)
    )
      starts.push({ index: i, page: c.page })
  })
  if (starts.length === 0) {
    const out: Section[] = []
    for (let i = 0; i < textPages.length; i += chunk)
      out.push({
        kind: "chunk",
        chapterIndex: null,
        pages: textPages.slice(i, i + chunk),
      })
    return out
  }

  const out: Section[] = []
  const num = (p: TwinPage) => p.number ?? 0
  const front = textPages.filter(
    (p) => num(p) < starts[0].page && !isNoisePage(p)
  )
  if (front.length)
    out.push({ kind: "front", chapterIndex: null, pages: front })
  starts.forEach((s, k) => {
    const end = k + 1 < starts.length ? starts[k + 1].page : Infinity
    const ps = textPages.filter((p) => num(p) >= s.page && num(p) < end)
    if (ps.length)
      out.push({ kind: "chapter", chapterIndex: s.index, pages: ps })
  })
  return out
}
