// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Textbook twin parser — turns a `textbook.md` (the Markdown twin that sits
 * beside every `textbook.pdf` on the CDN, produced by the kun `textbook`
 * skill) into a page/block tree the reader renders as native HTML.
 *
 * Deliberately NOT a Markdown engine: the twins are machine-extracted text
 * (OCR or a PDF text layer) with stray brackets, U+FFFD placeholders and the
 * odd mojibake line, so anything that treats `<`, `{` or `|` as markup would
 * break on them. We recognise only what the generator emits — YAML front
 * matter, `<!-- page N -->` markers, `#` headings, `-`/`*`/`1.` lists, `|`
 * tables and blank-line paragraphs — and render everything else verbatim.
 * Works for any curriculum: nothing here knows about Sudan or grade 12.
 */

export interface TwinMeta {
  title: string | null
  /** The edition line from the front matter (e.g. "الطبعة الثانية ٢٠٠٥م"). */
  edition: string | null
  lang: string
  sourcePages: number | null
  quality: string | null
  coverage: number | null
  extraction: string | null
}

export type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "table"; rows: string[][] }
  | { kind: "rule" }

export interface TwinPage {
  /** 1-based PDF page index from the marker; null when the twin has no markers. */
  number: number | null
  /** The generator's "no text recognised" marker. */
  empty: boolean
  /** The printed page number found standing alone at the top or bottom of the
   *  page's text (folio), or null. Feeds `detectPageOffset`. */
  folio: number | null
  blocks: Block[]
}

export interface ParsedTwin {
  meta: TwinMeta
  pages: TwinPage[]
  /** True when at least one `<!-- page N -->` marker was found. */
  hasPageMarkers: boolean
}

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/
const PAGE_MARKER = /^<!--\s*page\s+(\d+)\s*(?::\s*([^>]*?))?\s*-->\s*$/i
const HEADING = /^(#{1,4})\s+(.+?)\s*#*\s*$/
const BULLET = /^\s*[-*•]\s+(.+)$/
const NUMBERED = /^\s*(?:\d+|[٠-٩]+)[.)]\s+(.+)$/
const TABLE_ROW = /^\s*\|.*\|\s*$/
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/
const RULE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/

function unquote(v: string): string {
  const t = v.trim()
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  )
    return t.slice(1, -1)
  return t
}

/** Minimal YAML: top-level `key: value` lines only (lists/maps are skipped). */
export function parseFrontMatter(md: string): {
  fields: Record<string, string>
  body: string
} {
  const m = md.match(FRONT_MATTER)
  if (!m) return { fields: {}, body: md }
  const fields: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    if (/^\s/.test(line) || !line.includes(":")) continue
    const idx = line.indexOf(":")
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1)
    // strip trailing `# comment` (not inside quotes)
    if (!/^\s*["']/.test(value)) value = value.replace(/\s+#.*$/, "")
    fields[key] = unquote(value)
  }
  return { fields, body: md.slice(m[0].length) }
}

/** Inline clean-up: emphasis markers and escapes the generator/prettier add. */
export function cleanInline(text: string): string {
  return text
    .replace(/\\([*_`[\]#>\\])/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/(^|[^*\w])\*(?!\s)([^*]+?)\*(?!\w)/g, "$1$2")
    .replace(/\(cid:\d+\)/g, "")
    .replace(/[ \t]+/g, " ")
    .trim()
}

function flushParagraph(buf: string[], blocks: Block[]) {
  if (buf.length === 0) return
  const text = cleanInline(buf.join(" "))
  if (text) blocks.push({ kind: "paragraph", text })
  buf.length = 0
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = []
  const para: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) {
      flushParagraph(para, blocks)
      i++
      continue
    }
    let m: RegExpMatchArray | null
    if (RULE.test(line)) {
      flushParagraph(para, blocks)
      blocks.push({ kind: "rule" })
      i++
      continue
    }
    if ((m = line.match(HEADING))) {
      flushParagraph(para, blocks)
      const level = Math.min(m[1].length, 4) as 1 | 2 | 3 | 4
      const text = cleanInline(m[2])
      if (text) blocks.push({ kind: "heading", level, text })
      i++
      continue
    }
    if (TABLE_ROW.test(line)) {
      flushParagraph(para, blocks)
      const rows: string[][] = []
      while (i < lines.length && TABLE_ROW.test(lines[i])) {
        if (!TABLE_SEP.test(lines[i])) {
          const cells = lines[i]
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((c) => cleanInline(c))
          if (cells.some((c) => c)) rows.push(cells)
        }
        i++
      }
      if (rows.length) blocks.push({ kind: "table", rows })
      continue
    }
    if (BULLET.test(line) || NUMBERED.test(line)) {
      flushParagraph(para, blocks)
      const ordered = NUMBERED.test(line) && !BULLET.test(line)
      const items: string[] = []
      while (i < lines.length) {
        const mm = ordered ? lines[i].match(NUMBERED) : lines[i].match(BULLET)
        if (!mm) break
        const item = cleanInline(mm[1])
        if (item) items.push(item)
        i++
      }
      if (items.length) blocks.push({ kind: "list", ordered, items })
      continue
    }
    para.push(line)
    i++
  }
  flushParagraph(para, blocks)
  return blocks
}

/** Split the body on page markers; a marker-less twin is one page (number null). */
export function parseTwin(md: string): ParsedTwin {
  const { fields, body } = parseFrontMatter(md)
  const coverage = Number(fields.coverage)
  const sourcePages = Number(fields.sourcePages)
  const meta: TwinMeta = {
    title: fields.title || null,
    edition: fields.edition || null,
    lang: fields.lang || "ar",
    sourcePages:
      Number.isFinite(sourcePages) && sourcePages > 0 ? sourcePages : null,
    quality: fields.quality || null,
    coverage: Number.isFinite(coverage) ? coverage : null,
    extraction: fields.extraction || null,
  }

  const lines = body.split(/\r?\n/)
  const pages: TwinPage[] = []
  let current: { number: number | null; empty: boolean; lines: string[] } = {
    number: null,
    empty: false,
    lines: [],
  }
  let hasPageMarkers = false
  const push = () => {
    // The generator writes `# <title>` before the first marker — keep it as
    // the book's front page only when it carries text beyond that heading.
    const { folio, lines: bodyLines } = extractFolio(
      current.lines,
      current.number
    )
    const blocks = parseBlocks(bodyLines)
    const onlyTitle =
      current.number === null &&
      blocks.length === 1 &&
      blocks[0].kind === "heading" &&
      blocks[0].level === 1
    if (blocks.length > 0 && !onlyTitle)
      pages.push({
        number: current.number,
        empty: current.empty,
        folio,
        blocks,
      })
    else if (current.number !== null)
      pages.push({ number: current.number, empty: true, folio, blocks: [] })
  }
  for (const line of lines) {
    const m = line.match(PAGE_MARKER)
    if (m) {
      push()
      hasPageMarkers = true
      current = {
        number: Number(m[1]),
        empty: /no text/i.test(m[2] ?? ""),
        lines: [],
      }
      continue
    }
    current.lines.push(line)
  }
  push()
  return { meta, pages, hasPageMarkers }
}

// ─── Printed page numbers (folios) ───────────────────────────────────────────

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩"
const FOLIO_LINE =
  /^[\s.\-–—_()\u200e\u200f]*([0-9٠-٩]{1,3})[\s.\-–—_()\u200e\u200f]*$/

/** A line that is nothing but a 1–3 digit number (Latin or Arabic-Indic). */
function folioValue(line: string): number | null {
  const m = line.match(FOLIO_LINE)
  if (!m) return null
  const latin = [...m[1]]
    .map((ch) => {
      const i = ARABIC_INDIC.indexOf(ch)
      return i >= 0 ? String(i) : ch
    })
    .join("")
  const v = Number(latin)
  return Number.isInteger(v) && v > 0 ? v : null
}

/**
 * Scanned textbooks carry their printed page number as a lone line at the top
 * or bottom of every page. Read it from the first/last three non-empty lines
 * (it must not exceed the PDF index, which rules out most figure numbers),
 * and drop those lines so the number does not render as a stray paragraph.
 */
function extractFolio(
  lines: string[],
  pdfPage: number | null
): { folio: number | null; lines: string[] } {
  if (pdfPage === null) return { folio: null, lines }
  const nonEmpty: number[] = []
  for (let i = 0; i < lines.length; i++) if (lines[i].trim()) nonEmpty.push(i)
  const edge = new Set([...nonEmpty.slice(0, 3), ...nonEmpty.slice(-3)])
  let folio: number | null = null
  const drop = new Set<number>()
  for (const i of edge) {
    const v = folioValue(lines[i])
    if (v === null || v > pdfPage) continue
    if (folio === null) folio = v
    if (v === folio) drop.add(i)
  }
  if (folio === null) return { folio: null, lines }
  return { folio, lines: lines.filter((_, i) => !drop.has(i)) }
}

/**
 * The constant to subtract from a PDF page index to get the printed page
 * number (front matter is unnumbered, so PDF 10 is often printed 2). Voted
 * across every page that carries a folio; null when too few pages agree,
 * so callers fall back to PDF numbering rather than trust a guess.
 */
export function detectPageOffset(pages: TwinPage[]): number | null {
  const votes = new Map<number, number>()
  let marked = 0
  for (const p of pages) {
    if (p.number === null) continue
    marked++
    if (p.folio === null) continue
    const off = p.number - p.folio
    if (off < 0) continue
    votes.set(off, (votes.get(off) ?? 0) + 1)
  }
  let best: number | null = null
  let bestVotes = 0
  for (const [off, n] of votes)
    if (n > bestVotes || (n === bestVotes && best !== null && off < best)) {
      best = off
      bestVotes = n
    }
  if (best === null) return null
  return bestVotes >= Math.max(5, Math.ceil(marked * 0.15)) ? best : null
}

// ─── Arabic-aware normalisation (search + TOC anchoring) ─────────────────────

const DIACRITICS = /[ً-ٰٟۖ-ۭ]/g
const TATWEEL = /ـ/g

/** Fold Arabic orthographic variants so searches match regardless of تشكيل,
 *  hamza seat or the ة/ه and ى/ي spellings. Lowercases Latin. */
export function normalizeForSearch(text: string): string {
  return text
    .normalize("NFKC")
    .replace(DIACRITICS, "")
    .replace(TATWEEL, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[​-‏‪-‮﻿]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Same folding as normalizeForSearch, but keeps a map from every character of
 * the normalised string back to its index in the source, so a hit found in the
 * normalised text can be wrapped in the live DOM text node.
 */
/** Per-character fold cache: the regex chain in normalizeForSearch is far too
 *  slow to run once per character of a whole book on every keystroke. */
const FOLD_CACHE = new Map<string, string>()
function foldChar(ch: string): string {
  let folded = FOLD_CACHE.get(ch)
  if (folded === undefined) {
    folded = normalizeForSearch(ch)
    if (FOLD_CACHE.size < 4096) FOLD_CACHE.set(ch, folded)
  }
  return folded
}

export function normalizeWithMap(text: string): {
  norm: string
  map: number[]
} {
  const out: string[] = []
  const map: number[] = []
  let pendingSpace = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === " " || ch === "\n" || /\s/.test(ch)) {
      pendingSpace = out.length > 0
      continue
    }
    const folded = foldChar(ch)
    if (!folded) continue
    if (pendingSpace) {
      out.push(" ")
      map.push(i)
      pendingSpace = false
    }
    for (const c of folded) {
      out.push(c)
      map.push(i)
    }
  }
  return { norm: out.join(""), map }
}

export interface TocEntry {
  id: string
  name: string
  /** `p-<page>` anchor of the page whose heading/first line matched, else null. */
  anchor: string | null
  children: TocEntry[]
}

/**
 * Anchor chapter/lesson names to pages by looking for the name (normalised) at
 * the start of a heading or paragraph. Chapters are searched in book order and
 * each search starts after the previous hit, so repeated titles (every unit's
 * "Reading" lesson in a language book) land on their own unit.
 */
export function anchorToc(
  pages: TwinPage[],
  chapters: {
    id: string
    name: string
    lessons: { id: string; name: string }[]
  }[]
): TocEntry[] {
  const index: { anchor: string; text: string }[] = []
  for (const p of pages) {
    if (p.number === null) continue
    for (const b of p.blocks) {
      const texts =
        b.kind === "heading" || b.kind === "paragraph"
          ? [b.text]
          : b.kind === "list"
            ? b.items
            : []
      for (const t of texts)
        index.push({ anchor: `p-${p.number}`, text: normalizeForSearch(t) })
    }
  }
  let cursor = 0
  // Exact prefix/containment first; then a token-overlap fallback for OCR'd
  // headings that lost or mangled a word (3 of 4 title words on one line).
  const find = (name: string, from: number): number => {
    const n = normalizeForSearch(name)
    if (n.length < 3) return -1
    for (let i = from; i < index.length; i++) {
      const t = index[i].text
      if (t.startsWith(n) || (n.length >= 8 && t.includes(n))) return i
    }
    const tokens = n.split(" ").filter((w) => w.length >= 3)
    if (tokens.length < 2) return -1
    const need = Math.ceil(tokens.length * 0.75)
    for (let i = from; i < index.length; i++) {
      const t = index[i].text
      if (t.length > n.length * 3 + 40) continue
      let hitCount = 0
      for (const w of tokens) if (t.includes(w)) hitCount++
      if (hitCount >= need) return i
    }
    return -1
  }
  return chapters.map((ch) => {
    const hit = find(ch.name, cursor)
    if (hit >= 0) cursor = hit
    let lessonCursor = cursor
    const children = ch.lessons.map((l) => {
      const lh = find(l.name, lessonCursor)
      if (lh >= 0) lessonCursor = lh
      return {
        id: l.id,
        name: l.name,
        anchor: lh >= 0 ? index[lh].anchor : null,
        children: [],
      }
    })
    return {
      id: ch.id,
      name: ch.name,
      anchor: hit >= 0 ? index[hit].anchor : null,
      children,
    }
  })
}
