// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Pagination engine — the book as one screen per page.
 *
 * Every text section is a CSS multi-column flow whose column width and
 * height equal the viewport, so the browser breaks the text into columns
 * and each column is a page; the flow is translated sideways to show column
 * `col`. The engine measures those columns, maps page markers and elements
 * to columns, keeps the position across relayouts, and exposes an external
 * store the React shell subscribes to. It never touches React state.
 *
 * Direction: a right-to-left book grows its columns leftwards, so column `i`
 * comes into view with a positive translate; left-to-right with a negative.
 */
export type SectionKind = "cover" | "toc" | "flow"

export interface Marker {
  page: number
  /** Column the page's first fragment starts in. */
  col: number
  /** Column its last fragment ends in. */
  endCol: number
}

export interface Anchor {
  sec: number
  page: number | null
  /** Index of the first block of that page visible on the screen. */
  block: number
}

export interface EngineSnapshot {
  sec: number
  col: number
  /** Screens per section; empty until the first layout. */
  counts: number[]
  ready: boolean
  /** PDF page under the top of the current screen, when known. */
  page: number | null
  /** Skip the slide transition for this move (jumps, relayouts). */
  instant: boolean
  version: number
}

export interface LayoutOptions {
  W: number
  H: number
  G: number
  rtl: boolean
  facsimile: boolean
  /** PDF pages per section (flows only) — the screens of facsimile mode. */
  sectionPages: (number[] | null)[]
}

const INITIAL: EngineSnapshot = {
  sec: 0,
  col: 0,
  counts: [],
  ready: false,
  page: null,
  instant: true,
  version: 0,
}

const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

/** Column an element starts in, from its offset against the flow's box —
 *  translation-invariant because both rects carry the same transform. */
export function columnOf(
  flow: HTMLElement,
  el: Element,
  W: number,
  G: number,
  rtl: boolean
): number {
  const fr = flow.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const d = rtl ? fr.right - r.right : r.left - fr.left
  return Math.max(0, Math.floor((d + 1) / (W + G)))
}

export class BookEngine {
  private listeners = new Set<() => void>()
  private snap: EngineSnapshot = INITIAL
  private sections: HTMLElement[] = []
  private flows: (HTMLElement | null)[] = []
  private kinds: SectionKind[] = []
  private markers: Marker[][] = []
  private opts: LayoutOptions | null = null
  private anchor: Anchor | null = null

  subscribe = (callback: () => void) => {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }
  getSnapshot = () => this.snap
  getServerSnapshot = () => INITIAL

  private emit(partial: Partial<EngineSnapshot>) {
    this.snap = { ...this.snap, ...partial, version: this.snap.version + 1 }
    for (const cb of this.listeners) cb()
  }

  /** Read the section elements (in order) from the shell's root. */
  attach(root: HTMLElement) {
    this.sections = Array.from(
      root.querySelectorAll<HTMLElement>("[data-section]")
    )
    this.kinds = this.sections.map(
      (s) => (s.dataset.kind as SectionKind) ?? "flow"
    )
    this.flows = this.sections.map((s) =>
      s.querySelector<HTMLElement>(".book-flow")
    )
  }

  get options() {
    return this.opts
  }
  kindOf(sec: number): SectionKind | undefined {
    return this.kinds[sec]
  }
  flowOf(sec: number): HTMLElement | null {
    return this.flows[sec] ?? null
  }
  get sectionElements() {
    return this.sections
  }
  get total() {
    return this.snap.counts.reduce((a, b) => a + b, 0)
  }
  offsetOf(sec: number) {
    let n = 0
    for (let i = 0; i < sec && i < this.snap.counts.length; i++)
      n += this.snap.counts[i]
    return n
  }

  /** Measure every section for the given geometry and restore the position. */
  layout(opts: LayoutOptions) {
    this.opts = opts
    const counts: number[] = []
    this.markers = []
    for (let i = 0; i < this.sections.length; i++) {
      const kind = this.kinds[i]
      if (kind === "cover") counts.push(1)
      else if (kind === "flow" && opts.facsimile)
        counts.push(Math.max(1, opts.sectionPages[i]?.length ?? 1))
      else counts.push(this.measureFlow(i))
      this.markers.push(
        kind === "flow" && !opts.facsimile ? this.collectMarkers(i) : []
      )
    }
    this.emit({ counts, ready: true })
    this.restore(this.anchor)
  }

  private measureFlow(i: number): number {
    const flow = this.flows[i]
    if (!flow || !this.opts) return 1
    const { W, G } = this.opts
    return Math.max(1, Math.round((flow.scrollWidth + G) / (W + G)))
  }

  private collectMarkers(i: number): Marker[] {
    const flow = this.flows[i]
    if (!flow || !this.opts) return []
    const { W, G, rtl } = this.opts
    const fr = flow.getBoundingClientRect()
    const out: Marker[] = []
    flow.querySelectorAll<HTMLElement>("section[data-page]").forEach((s) => {
      const page = Number(s.dataset.page)
      if (!Number.isFinite(page)) return
      // A page split across columns has one client rect per fragment.
      let col = columnOf(flow, s, W, G, rtl)
      let endCol = col
      for (const r of Array.from(s.getClientRects())) {
        const d = rtl ? fr.right - r.right : r.left - fr.left
        const c = Math.max(0, Math.floor((d + 1) / (W + G)))
        if (c < col) col = c
        if (c > endCol) endCol = c
      }
      out.push({ page, col, endCol })
    })
    return out
  }

  /** The PDF page at the top of this screen: the earliest page that has a
   *  fragment in the column (a page's tail comes before the next page's start). */
  pageAt(sec: number, col: number): number | null {
    if (this.kinds[sec] !== "flow") return null
    if (this.opts?.facsimile) return this.opts.sectionPages[sec]?.[col] ?? null
    const markers = this.markers[sec] ?? []
    for (const m of markers) if (m.col <= col && col <= m.endCol) return m.page
    let page: number | null = null
    for (const m of markers) {
      if (m.col <= col) page = m.page
      else break
    }
    return page
  }

  columnOfPage(sec: number, page: number): number | null {
    if (this.opts?.facsimile) {
      const idx = this.opts.sectionPages[sec]?.indexOf(page) ?? -1
      return idx >= 0 ? idx : null
    }
    const m = (this.markers[sec] ?? []).find((x) => x.page === page)
    return m ? m.col : null
  }

  sectionOfPage(page: number): number | null {
    const pages = this.opts?.sectionPages ?? []
    for (let i = 0; i < pages.length; i++)
      if (pages[i]?.includes(page)) return i
    // Not a text page (empty in the twin): the section whose range holds it.
    for (let i = 0; i < pages.length; i++) {
      const ps = pages[i]
      if (ps && ps.length && page >= ps[0] && page <= ps[ps.length - 1])
        return i
    }
    return null
  }

  go(sec: number, col: number, instant = false) {
    const counts = this.snap.counts
    if (counts.length) {
      sec = clamp(sec, 0, counts.length - 1)
      col = clamp(col, 0, Math.max(0, (counts[sec] ?? 1) - 1))
    } else {
      sec = Math.max(0, sec)
      col = Math.max(0, col)
    }
    const page = this.pageAt(sec, col)
    this.emit({ sec, col, page, instant })
    this.anchor = this.computeAnchor(sec, col, page)
  }

  next() {
    const { sec, col, counts } = this.snap
    if (col + 1 < (counts[sec] ?? 1)) this.go(sec, col + 1)
    else if (sec + 1 < counts.length) this.go(sec + 1, 0, true)
  }

  prev() {
    const { sec, col, counts } = this.snap
    if (col > 0) this.go(sec, col - 1)
    else if (sec > 0) this.go(sec - 1, (counts[sec - 1] ?? 1) - 1, true)
  }

  /** Jump to a PDF page; false when the book has no such page. */
  goToPage(page: number, instant = true): boolean {
    const sec = this.sectionOfPage(page)
    if (sec === null) return false
    let col = this.columnOfPage(sec, page)
    if (col === null) {
      // The page itself has no text: land on the nearest earlier marker.
      const before = (this.markers[sec] ?? []).filter((m) => m.page <= page)
      col = before.length ? before[before.length - 1].col : 0
    }
    this.go(sec, col, instant)
    return true
  }

  /**
   * Jump to a screen by its place in the whole book (1-based). The reading
   * menu's progress scrubber speaks in these numbers, not in printed pages.
   */
  goToGlobal(n: number, instant = true) {
    const counts = this.snap.counts
    const total = counts.reduce((a, b) => a + b, 0)
    if (!total) return
    let rest = clamp(Math.round(n), 1, total) - 1
    for (let sec = 0; sec < counts.length; sec++) {
      const c = counts[sec] ?? 1
      if (rest < c) {
        this.go(sec, rest, instant)
        return
      }
      rest -= c
    }
  }

  /** Jump to the screen that holds an element of a flow section. */
  goToElement(sec: number, el: Element, instant = true) {
    const flow = this.flows[sec]
    if (!flow || !this.opts) return
    const { W, G, rtl } = this.opts
    this.go(sec, columnOf(flow, el, W, G, rtl), instant)
  }

  columnOfElement(sec: number, el: Element): number | null {
    const flow = this.flows[sec]
    if (!flow || !this.opts) return null
    const { W, G, rtl } = this.opts
    return columnOf(flow, el, W, G, rtl)
  }

  private computeAnchor(sec: number, col: number, page: number | null): Anchor {
    const flow = this.flows[sec]
    if (
      this.kinds[sec] === "flow" &&
      !this.opts?.facsimile &&
      page != null &&
      flow &&
      this.opts
    ) {
      const { W, G, rtl } = this.opts
      const pageEl = flow.querySelector(`section[data-page="${page}"]`)
      if (pageEl) {
        const children = Array.from(pageEl.children)
        for (let i = 0; i < children.length; i++)
          if (columnOf(flow, children[i], W, G, rtl) >= col)
            return { sec, page, block: i }
      }
    }
    return { sec, page, block: 0 }
  }

  get currentAnchor(): Anchor | null {
    return this.anchor
  }

  /** Return to a remembered place after a relayout or on open. */
  restore(anchor: Anchor | null) {
    if (!anchor) {
      this.go(this.snap.sec, this.snap.col, true)
      return
    }
    let { sec } = anchor
    const { page, block } = anchor
    if (page != null) {
      const bySection = this.sectionOfPage(page)
      if (bySection !== null) sec = bySection
    }
    if (this.kinds[sec] === "flow" && page != null && this.opts) {
      if (this.opts.facsimile) {
        this.go(sec, this.columnOfPage(sec, page) ?? 0, true)
        return
      }
      const flow = this.flows[sec]
      const pageEl = flow?.querySelector(`section[data-page="${page}"]`)
      if (flow && pageEl) {
        const { W, G, rtl } = this.opts
        const el = pageEl.children[block] ?? pageEl
        this.go(sec, columnOf(flow, el, W, G, rtl), true)
        return
      }
    }
    this.go(sec, 0, true)
  }
}
