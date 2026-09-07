// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { normalizeForSearch, normalizeWithMap } from "./parse"

/**
 * Book search over the live DOM: every page section's text is folded once
 * (Arabic diacritics, hamza seats, ة/ه, ى/ي) into an index, hits carry a
 * snippet and the page they sit on, and the chosen hit is wrapped in
 * `<mark>` elements inside that page so the engine can jump to its screen.
 */
export interface SearchEntry {
  sec: number
  el: HTMLElement
  page: number | null
  text: string
  norm: string
  map: number[]
}

export interface SearchResult {
  sec: number
  el: HTMLElement
  page: number | null
  before: string
  hit: string
  after: string
}

/** Text of a page with block boundaries kept as line breaks (folios skipped). */
function blockText(el: HTMLElement): string {
  const parts: string[] = []
  for (const child of Array.from(el.children)) {
    if (child.classList.contains("book-folio")) continue
    const t = child.textContent?.trim()
    if (t) parts.push(t)
  }
  return parts.join("\n")
}

export function buildIndex(
  sections: HTMLElement[],
  kinds: (string | undefined)[]
): SearchEntry[] {
  const index: SearchEntry[] = []
  sections.forEach((section, sec) => {
    if (kinds[sec] !== "flow") return
    section
      .querySelectorAll<HTMLElement>("section[data-page]")
      .forEach((el) => {
        const text = blockText(el)
        if (!text) return
        const { norm, map } = normalizeWithMap(text)
        const page = Number(el.dataset.page)
        index.push({
          sec,
          el,
          page: Number.isFinite(page) ? page : null,
          text,
          norm,
          map,
        })
      })
  })
  return index
}

export function runSearch(
  index: SearchEntry[],
  query: string,
  max = 80
): SearchResult[] {
  const needle = normalizeForSearch(query)
  if (needle.length < 2) return []
  const results: SearchResult[] = []
  for (const entry of index) {
    let from = 0
    for (;;) {
      const at = entry.norm.indexOf(needle, from)
      if (at < 0) break
      const s = entry.map[at]
      const e = entry.map[at + needle.length - 1] + 1
      results.push({
        sec: entry.sec,
        el: entry.el,
        page: entry.page,
        before: entry.text.slice(Math.max(0, s - 70), s).replace(/\n/g, " "),
        hit: entry.text.slice(s, e),
        after: entry.text.slice(e, e + 70).replace(/\n/g, " "),
      })
      if (results.length >= max) return results
      from = at + needle.length
    }
  }
  return results
}

export function clearMarks(root: Element) {
  root.querySelectorAll("mark[data-reader-hit]").forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""))
  })
  root.normalize()
}

/** Wrap every occurrence of `query` (Arabic-folded) inside `root`'s text nodes. */
export function highlight(root: Element, query: string): HTMLElement[] {
  const needle = normalizeForSearch(query)
  if (needle.length < 2) return []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest(".book-folio, .book-opener, script, style")
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  })
  const nodes: Text[] = []
  while (walker.nextNode()) nodes.push(walker.currentNode as Text)
  const hits: HTMLElement[] = []
  for (const node of nodes) {
    const { norm, map } = normalizeWithMap(node.data)
    const ranges: [number, number][] = []
    let from = 0
    for (;;) {
      const at = norm.indexOf(needle, from)
      if (at < 0) break
      ranges.push([map[at], map[at + needle.length - 1] + 1])
      from = at + needle.length
    }
    if (ranges.length === 0) continue
    const nodeHits: HTMLElement[] = []
    const current = node
    for (const [start, end] of ranges.reverse()) {
      current.splitText(end)
      const middle = current.splitText(start)
      const mark = document.createElement("mark")
      mark.dataset.readerHit = "1"
      middle.replaceWith(mark)
      mark.appendChild(middle)
      nodeHits.unshift(mark)
    }
    hits.push(...nodeHits)
  }
  return hits
}
