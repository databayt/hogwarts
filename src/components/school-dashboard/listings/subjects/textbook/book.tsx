"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  Children,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type TouchEvent as ReactTouchEvent,
} from "react"
import Link from "next/link"
import { X } from "lucide-react"

import { CoverScreen } from "./cover"
import { BookEngine, type Anchor } from "./engine"
import { fill, formatNumber } from "./format"
import {
  FONTS,
  LEADINGS,
  oneOf,
  PREF,
  readStorage,
  SCALES,
  THEMES,
  usePreference,
  writeStorage,
} from "./prefs"
import {
  buildIndex,
  clearMarks,
  highlight,
  runSearch,
  type SearchEntry,
  type SearchResult,
} from "./search"
import {
  AboutSheet,
  ContentsSheet,
  MenuIcon,
  ReadingMenu,
  SearchSheet,
  SettingsSheet,
} from "./sheets"
import type { TocChapter } from "./spine"
import { TocPage } from "./toc"
import type { BookMeta, CoverInfo, ReaderLabels, SectionMeta } from "./types"

/**
 * The book, one screen per page. Screen one is the cover, screen two the
 * contents, then the text flows the server rendered (`children`, one per
 * chapter). The engine lays every flow out in viewport-sized columns and
 * slides them; this shell owns the chrome the reference reader shows — a
 * running head, a round close button, the page counter and the round menu
 * button — plus the sheets behind the menu. Tap the middle of a page to hide
 * or show the chrome, tap or swipe the edges to turn.
 */
const GAP = 64
type SheetName = null | "contents" | "search" | "settings" | "about"

const posKey = (slug: string) => `hogwarts:textbook:${slug}:pos`
const bookmarksKey = (slug: string) => `hogwarts:textbook:${slug}:bookmarks`

function readAnchor(slug: string): Anchor | null {
  try {
    const raw = readStorage(posKey(slug))
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Anchor>
    if (typeof v.sec !== "number") return null
    return {
      sec: v.sec,
      page: typeof v.page === "number" ? v.page : null,
      block: typeof v.block === "number" ? v.block : 0,
    }
  } catch {
    return null
  }
}

function readBookmarks(slug: string): number[] {
  try {
    const v = JSON.parse(readStorage(bookmarksKey(slug)) ?? "[]")
    return Array.isArray(v)
      ? v.filter((n): n is number => Number.isInteger(n))
      : []
  } catch {
    return []
  }
}

export interface BookReaderProps {
  slug: string
  meta: BookMeta
  toc: TocChapter[]
  sections: SectionMeta[]
  cover: CoverInfo
  pdfUrl: string | null
  pagesBaseUrl: string
  subjectHref: string
  labels: ReaderLabels
  uiLang: string
  uiDir: "rtl" | "ltr"
  children: ReactNode
}

export function BookReader({
  slug,
  meta,
  toc,
  sections,
  cover,
  pdfUrl,
  pagesBaseUrl,
  subjectHref,
  labels,
  uiLang,
  uiDir,
  children,
}: BookReaderProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [engine] = useState(() => new BookEngine())
  const snap = useSyncExternalStore(
    engine.subscribe,
    engine.getSnapshot,
    engine.getServerSnapshot
  )

  const [themePref, setThemePref] = usePreference(PREF.theme, "original")
  const [fontPref, setFontPref] = usePreference(PREF.font, "serif")
  const [scalePref, setScalePref] = usePreference(PREF.scale, "1")
  const [leadingPref, setLeadingPref] = usePreference(PREF.leading, "normal")
  const [facsimilePref, setFacsimilePref] = usePreference(PREF.facsimile, "off")
  const theme = oneOf(themePref, THEMES, "original")
  const font = oneOf(fontPref, FONTS, "serif")
  const leading = oneOf(leadingPref, LEADINGS, "normal")
  const parsedScale = Number(scalePref)
  const scaleIdx =
    Number.isInteger(parsedScale) &&
    parsedScale >= 0 &&
    parsedScale < SCALES.length
      ? parsedScale
      : 1
  const scale = SCALES[scaleIdx]
  const facsimile = facsimilePref === "on" && meta.hasPageImages

  const [size, setSize] = useState({ W: 360, H: 640, measured: false })
  const [chrome, setChrome] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [sheet, setSheet] = useState<SheetName>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [bookmarks, setBookmarks] = useState<number[]>(() =>
    readBookmarks(slug)
  )
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const indexRef = useRef<SearchEntry[] | null>(null)
  const initializedRef = useRef(false)
  const touchRef = useRef<{ x: number; y: number } | null>(null)

  const rtl = meta.dir === "rtl"
  const lang = uiLang
  // DOM sections: cover, contents, then one per flow.
  const sectionPages = useMemo<(number[] | null)[]>(
    () => [null, null, ...sections.map((s) => s.pages)],
    [sections]
  )
  const firstChapterSec = useMemo(() => {
    const i = sections.findIndex((s) => s.kind === "chapter")
    return i >= 0 ? i + 2 : 2
  }, [sections])

  // ── Geometry ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect
      if (!r || r.width < 1 || r.height < 1) return
      setSize({
        W: Math.floor(r.width),
        H: Math.floor(r.height),
        measured: true,
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Lay out on every geometry or typography change; the CSS variables the
  // flows read are set in this same commit, so measuring here sees them.
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !size.measured) return
    engine.attach(root)
    engine.layout({
      W: size.W,
      H: size.H,
      G: GAP,
      rtl,
      facsimile,
      sectionPages,
    })
    if (!initializedRef.current) {
      initializedRef.current = true
      const hash = window.location.hash.match(/^#p-(\d+)$/)
      if (hash) engine.goToPage(Number(hash[1]))
      else {
        const saved = readAnchor(slug)
        if (saved) engine.restore(saved)
      }
    }
    // scale/font/leading change the layout through CSS variables.
  }, [engine, size, rtl, facsimile, sectionPages, scale, font, leading, slug])

  // ── Position memory, body lock, keys, toast ───────────────────────────
  useEffect(() => {
    if (!snap.ready) return
    const t = setTimeout(() => {
      const a = engine.currentAnchor
      if (a) writeStorage(posKey(slug), JSON.stringify(a))
    }, 300)
    return () => clearTimeout(t)
  }, [engine, slug, snap.ready, snap.sec, snap.col])

  // A handle for browser tests and debugging, development only.
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    ;(window as Window & { __book?: BookEngine }).__book = engine
  }, [engine])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sheet || menuOpen) {
        if (e.key === "Escape") {
          setSheet(null)
          setMenuOpen(false)
        }
        return
      }
      // Typing, and Space/Enter on a focused control, belong to that control.
      const t = e.target as HTMLElement | null
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable ||
          t.closest("button, a, [role='menuitem']"))
      )
        return
      switch (e.key) {
        case "ArrowLeft":
          if (rtl) engine.next()
          else engine.prev()
          break
        case "ArrowRight":
          if (rtl) engine.prev()
          else engine.next()
          break
        case "ArrowDown":
        case "PageDown":
        case " ":
          e.preventDefault()
          engine.next()
          break
        case "ArrowUp":
        case "PageUp":
          e.preventDefault()
          engine.prev()
          break
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [engine, rtl, sheet, menuOpen])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  // ── Search ────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length < 2) {
        setResults([])
        return
      }
      if (!indexRef.current) {
        const els = engine.sectionElements
        indexRef.current = buildIndex(
          els,
          els.map((_, i) => engine.kindOf(i))
        )
      }
      setResults(runSearch(indexRef.current, query))
    }, 200)
    return () => clearTimeout(t)
  }, [query, engine])

  const openResult = (r: SearchResult) => {
    setSheet(null)
    const root = rootRef.current
    if (root) clearMarks(root)
    if (facsimile) {
      if (r.page != null) engine.goToPage(r.page)
      return
    }
    const hits = highlight(r.el, query)
    if (hits[0]) {
      hits[0].setAttribute("data-active", "")
      engine.goToElement(r.sec, hits[0])
    } else engine.goToElement(r.sec, r.el)
  }

  const changeQuery = (q: string) => {
    const root = rootRef.current
    if (root) clearMarks(root)
    setQuery(q)
  }

  // ── Navigation ────────────────────────────────────────────────────────
  const start = useCallback(() => {
    const saved = readAnchor(slug)
    if (saved?.page != null && engine.goToPage(saved.page)) return
    engine.go(firstChapterSec, 0, true)
  }, [engine, firstChapterSec, slug])

  const onStageClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const go = target.closest<HTMLElement>("[data-go]")
    if (go) {
      e.preventDefault()
      const p = Number(go.dataset.go)
      if (Number.isFinite(p)) engine.goToPage(p)
      return
    }
    if (target.closest("a, button, input, [data-chrome]")) return
    if (menuOpen) {
      setMenuOpen(false)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    if (x < 0.22) {
      if (rtl) engine.next()
      else engine.prev()
      return
    }
    if (x > 0.78) {
      if (rtl) engine.prev()
      else engine.next()
      return
    }
    setChrome((c) => !c)
  }

  const onTouchStart = (e: ReactTouchEvent) => {
    const t = e.touches[0]
    touchRef.current = t ? { x: t.clientX, y: t.clientY } : null
  }
  const onTouchEnd = (e: ReactTouchEvent) => {
    const s = touchRef.current
    touchRef.current = null
    const t = e.changedTouches[0]
    if (!s || !t) return
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < 48 || Math.abs(dy) > 80) return
    // Dragging the page towards the book's start reveals the next page.
    if (dx < 0) {
      if (rtl) engine.prev()
      else engine.next()
    } else if (rtl) engine.next()
    else engine.prev()
  }

  const share = async () => {
    setMenuOpen(false)
    const url = window.location.href.replace(/#.*$/, "")
    const shareUrl = snap.page != null ? `${url}#p-${snap.page}` : url
    try {
      if (navigator.share)
        await navigator.share({ title: meta.title, url: shareUrl })
      else {
        await navigator.clipboard.writeText(shareUrl)
        setToast(labels.linkCopied)
      }
    } catch {
      /* dismissed */
    }
  }

  const toggleBookmark = () => {
    const page = snap.page
    if (page == null) return
    const has = bookmarks.includes(page)
    const next = has
      ? bookmarks.filter((p) => p !== page)
      : [...bookmarks, page].sort((a, b) => a - b)
    setBookmarks(next)
    writeStorage(bookmarksKey(slug), JSON.stringify(next))
    setToast(has ? labels.bookmarkRemoved : labels.bookmarkAdded)
  }

  // ── Derived chrome ────────────────────────────────────────────────────
  const total = snap.counts.reduce((a, b) => a + b, 0)
  const globalPage = snap.ready
    ? engine.offsetOf(snap.sec) + snap.col + 1
    : null
  const percent =
    total > 1 && globalPage != null
      ? Math.round(((globalPage - 1) / (total - 1)) * 100)
      : 0
  const kind = snap.sec === 0 ? "cover" : snap.sec === 1 ? "toc" : "flow"
  const current = kind === "flow" ? sections[snap.sec - 2] : undefined
  const runningHead =
    kind === "cover"
      ? ""
      : kind === "toc"
        ? labels.contents
        : (current?.title ?? meta.title)
  const translate = (col: number) =>
    `translateX(${(rtl ? 1 : -1) * col * (size.W + GAP)}px)`
  const canResume = snap.ready && readAnchor(slug)?.page != null

  return (
    <div
      ref={rootRef}
      className="book"
      dir={uiDir}
      data-theme={theme}
      data-font={font}
      data-leading={leading}
      data-facsimile={facsimile ? "on" : undefined}
      data-chrome-visible={chrome ? "on" : "off"}
      style={
        {
          "--book-scale": scale,
          "--book-w": `${size.W}px`,
          "--book-h": `${size.H}px`,
          "--book-gap": `${GAP}px`,
        } as CSSProperties
      }
    >
      <div
        className="book-stage"
        onClick={onStageClick}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div ref={viewportRef} className="book-viewport" dir={meta.dir}>
          <div
            data-section
            data-kind="cover"
            className="book-section"
            data-current={snap.sec === 0 || undefined}
          >
            <CoverScreen
              cover={cover}
              title={meta.title}
              edition={meta.edition}
              labels={labels}
              canResume={canResume}
              onStart={start}
              onContents={() => engine.go(1, 0, true)}
              onAbout={() => setSheet("about")}
            />
          </div>
          <div
            data-section
            data-kind="toc"
            className="book-section"
            data-current={snap.sec === 1 || undefined}
          >
            <div
              className="book-track"
              data-instant={snap.instant || undefined}
              style={
                snap.sec === 1 ? { transform: translate(snap.col) } : undefined
              }
            >
              <div className="book-flow" dir={meta.dir} lang={meta.lang}>
                <TocPage
                  toc={toc}
                  labels={labels}
                  lang={lang}
                  offset={meta.offset}
                />
              </div>
            </div>
          </div>
          {Children.map(children, (child, i) => (
            <div
              data-section
              data-kind="flow"
              className="book-section"
              data-current={snap.sec === i + 2 || undefined}
            >
              <div
                className="book-track"
                data-instant={snap.instant || undefined}
                style={
                  snap.sec === i + 2
                    ? { transform: translate(snap.col) }
                    : undefined
                }
              >
                {child}
              </div>
            </div>
          ))}
          {facsimile && kind === "flow" && snap.page != null && (
            <div className="book-facsimile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`${pagesBaseUrl}/${snap.page}.webp`}
                alt={fill(labels.pageImageAlt, {
                  page: formatNumber(snap.page, lang),
                })}
                decoding="async"
              />
            </div>
          )}
        </div>
      </div>

      {runningHead && <div className="book-running-head">{runningHead}</div>}
      {chrome && !menuOpen && (
        <Link
          href={subjectHref}
          className="book-round book-close"
          aria-label={labels.close}
          data-chrome
        >
          <X />
        </Link>
      )}
      {kind !== "cover" && globalPage != null && (
        <div className="book-counter" aria-live="polite">
          {chrome
            ? fill(labels.pageOfTotal, {
                page: formatNumber(globalPage, lang),
                total: formatNumber(total, lang),
              })
            : formatNumber(globalPage, lang)}
        </div>
      )}
      {chrome && !menuOpen && (
        <button
          type="button"
          className="book-round book-menu-button"
          aria-label={labels.readingMenu}
          aria-haspopup="menu"
          data-chrome
          onClick={() => setMenuOpen(true)}
        >
          <MenuIcon />
        </button>
      )}
      {menuOpen && (
        <ReadingMenu
          labels={labels}
          lang={lang}
          percent={percent}
          pdfUrl={pdfUrl}
          canFacsimile={meta.hasPageImages}
          facsimile={facsimile}
          bookmarked={snap.page != null && bookmarks.includes(snap.page)}
          canBookmark={snap.page != null}
          onClose={() => setMenuOpen(false)}
          onContents={() => {
            setMenuOpen(false)
            setSheet("contents")
          }}
          onSearch={() => {
            setMenuOpen(false)
            setSheet("search")
          }}
          onSettings={() => {
            setMenuOpen(false)
            setSheet("settings")
          }}
          onShare={share}
          onToggleFacsimile={() => {
            setMenuOpen(false)
            setFacsimilePref(facsimile ? "off" : "on")
          }}
          onBookmark={toggleBookmark}
        />
      )}
      {toast && <div className="book-toast">{toast}</div>}

      <ContentsSheet
        open={sheet === "contents"}
        onClose={() => setSheet(null)}
        labels={labels}
        lang={lang}
        toc={toc}
        offset={meta.offset}
        currentPage={snap.page}
        bookmarks={bookmarks}
        onNavigate={(page) => {
          setSheet(null)
          engine.goToPage(page)
        }}
      />
      <SearchSheet
        open={sheet === "search"}
        onClose={() => setSheet(null)}
        labels={labels}
        lang={lang}
        offset={meta.offset}
        query={query}
        onQuery={changeQuery}
        results={results}
        onPick={openResult}
      />
      <SettingsSheet
        open={sheet === "settings"}
        onClose={() => setSheet(null)}
        labels={labels}
        lang={lang}
        theme={theme}
        onTheme={setThemePref}
        font={font}
        onFont={setFontPref}
        scaleIdx={scaleIdx}
        onScaleIdx={(i) =>
          setScalePref(String(Math.min(SCALES.length - 1, Math.max(0, i))))
        }
        leading={leading}
        onLeading={setLeadingPref}
        canFacsimile={meta.hasPageImages}
        facsimile={facsimile}
        onFacsimile={(on) => setFacsimilePref(on ? "on" : "off")}
      />
      <AboutSheet
        open={sheet === "about"}
        onClose={() => setSheet(null)}
        labels={labels}
        text={cover.description ?? ""}
      />
    </div>
  )
}
