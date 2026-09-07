// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  detectPageOffset,
  normalizeForSearch,
  type Block,
  type TocEntry,
  type TwinPage,
} from "./parse"

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
  /** The author's printed→PDF offset (PDF = printed + offset), for a scan
   *  whose folios are too damaged for the reader to vote one. */
  pageOffset: number | null
  chapters: StructureChapter[]
}

function positiveInt(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v) && v > 0) return v
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v)
  return null
}

function nonNegativeInt(v: unknown): number | null {
  if (v === 0 || v === "0") return 0
  return positiveInt(v)
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
  return {
    pageNumbers: o.pageNumbers === "pdf" ? "pdf" : "book",
    pageOffset: nonNegativeInt(o.pageOffset),
    chapters,
  }
}

function blockTexts(b: Block): string[] {
  return b.kind === "heading" || b.kind === "paragraph"
    ? [b.text]
    : b.kind === "list"
      ? b.items
      : b.kind === "table"
        ? b.rows.flat()
        : []
}

/**
 * The printed→PDF offset, from the most trustworthy source that has one:
 * the author's statement, the folios the OCR kept, and finally the
 * structure's own headings found in the page text.
 */
export function resolvePageOffset(
  pages: TwinPage[],
  structure: StructurePages | null
): number | null {
  if (structure?.pageOffset != null) return structure.pageOffset
  return detectPageOffset(pages) ?? inferPageOffset(pages, structure)
}

/**
 * Vote the offset from the structure's chapter and lesson titles: each page
 * whose text contains a title votes (PDF page − printed page). A page that
 * matches many titles at once is a contents page and abstains. The winner
 * needs a clear majority, else null — a wrong offset misplaces every chapter.
 */
export function inferPageOffset(
  pages: TwinPage[],
  structure: StructurePages | null
): number | null {
  if (!structure || structure.pageNumbers !== "book") return null
  const titles: { key: string; page: number }[] = []
  for (const c of structure.chapters) {
    if (c.page !== null)
      titles.push({ key: normalizeForSearch(c.title), page: c.page })
    for (const l of c.lessons)
      if (l.page !== null)
        titles.push({ key: normalizeForSearch(l.title), page: l.page })
  }
  const usable = titles.filter((t) => t.key.length >= 6)
  if (usable.length === 0) return null

  const votes = new Map<number, number>()
  for (const p of pages) {
    if (p.number === null || p.blocks.length === 0) continue
    const text = normalizeForSearch(p.blocks.flatMap(blockTexts).join(" "))
    const hits = usable.filter((t) => text.includes(t.key))
    if (hits.length === 0 || hits.length >= 4) continue
    for (const t of hits) {
      const off = p.number - t.page
      if (off < 0 || off > 80) continue
      votes.set(off, (votes.get(off) ?? 0) + 1)
    }
  }
  let best: number | null = null
  let bestVotes = 0
  let second = 0
  for (const [off, n] of votes) {
    if (n > bestVotes) {
      second = bestVotes
      best = off
      bestVotes = n
    } else if (n > second) second = n
  }
  return best !== null && bestVotes >= 3 && bestVotes >= 2 * second
    ? best
    : null
}

/**
 * A scanned PDF opens on its cover: a few lines of title text, no prose,
 * and whatever the OCR made of the artwork. The reader shows the cover
 * image instead, so that page's text is not a page of the book. Counted in
 * words of three letters or more — the artwork's debris is shorter.
 */
export function isCoverPage(page: TwinPage): boolean {
  if (page.number !== 1) return false
  const words = page.blocks
    .flatMap(blockTexts)
    .join(" ")
    .split(/\s+/)
    .filter((w) => /\p{L}{3,}/u.test(w)).length
  return words <= 40
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
 * not go backwards along the book, so a stray value is dropped rather than
 * trusted; two short chapters may open on the same page.
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
    if (page !== null && page < prev) page = null
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
    for (const t of blockTexts(b))
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
