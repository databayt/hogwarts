"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  FileText,
  Image as ImageIcon,
  ImageOff,
  List,
  Minus,
  Plus,
  Search,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { normalizeForSearch, normalizeWithMap, type TocEntry } from "./parse"

/**
 * Client shell of the textbook reader: sticky toolbar (contents, text size,
 * page images, search, PDF) around the server-rendered article. It owns no
 * book text — search and page images work on the live DOM, and the two
 * preferences persist in localStorage (best effort, never required).
 */
export type ReaderLabels = Record<string, string>

const SCALES = [0.85, 1, 1.15, 1.3, 1.5, 1.75]
const STORAGE_SCALE = "hogwarts:textbook-reader:scale"
const STORAGE_PAGES = "hogwarts:textbook-reader:pages"

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* private mode / blocked storage — the setting just does not persist */
  }
}

const PREF_EVENT = "hogwarts:textbook-reader:pref"

function subscribePrefs(callback: () => void) {
  window.addEventListener("storage", callback)
  window.addEventListener(PREF_EVENT, callback)
  return () => {
    window.removeEventListener("storage", callback)
    window.removeEventListener(PREF_EVENT, callback)
  }
}

/** A localStorage-backed preference that hydrates without a mismatch: the
 *  server snapshot is the default, the client snapshot the stored value. */
function usePreference(
  key: string,
  fallback: string
): [string, (value: string) => void] {
  const value = useSyncExternalStore(
    subscribePrefs,
    () => readStorage(key) ?? fallback,
    () => fallback
  )
  const set = useCallback(
    (next: string) => {
      writeStorage(key, next)
      window.dispatchEvent(new Event(PREF_EVENT))
    },
    [key]
  )
  return [value, set]
}

function fill(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`
  )
}

function clearMarks(root: Element) {
  root.querySelectorAll("mark[data-reader-hit]").forEach((mark) => {
    mark.replaceWith(document.createTextNode(mark.textContent ?? ""))
  })
  root.normalize()
}

/** Wrap every occurrence of `query` (Arabic-folded) in the article's text nodes. */
function highlight(root: Element, query: string): HTMLElement[] {
  const needle = normalizeForSearch(query)
  if (needle.length < 2) return []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.parentElement?.closest("figure, .reader-page-number, script, style")
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

export function TextbookReader({
  labels,
  toc,
  pdfUrl,
  subjectHref,
  hasPageMarkers,
  sourcePages,
  notice,
  children,
}: {
  labels: ReaderLabels
  toc: TocEntry[]
  pdfUrl: string | null
  subjectHref: string
  hasPageMarkers: boolean
  sourcePages: number | null
  notice: string | null
  children: ReactNode
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [scalePref, setScalePref] = usePreference(STORAGE_SCALE, "1")
  const [pagesPref, setPagesPref] = usePreference(STORAGE_PAGES, "off")
  const parsedScale = Number(scalePref)
  const scaleIdx =
    Number.isInteger(parsedScale) &&
    parsedScale >= 0 &&
    parsedScale < SCALES.length
      ? parsedScale
      : 1
  const setScaleIdx = (next: number) => setScalePref(String(next))
  const showPages = pagesPref === "on"
  const setShowPages = (next: boolean) => setPagesPref(next ? "on" : "off")
  const [query, setQuery] = useState("")
  const [hits, setHits] = useState<HTMLElement[]>([])
  const [active, setActive] = useState(0)
  const [currentPage, setCurrentPage] = useState<number | null>(null)

  // Page images: copy data-src → src the first time they are switched on.
  useEffect(() => {
    if (!showPages) return
    rootRef.current
      ?.querySelectorAll<HTMLImageElement>("img[data-src]")
      .forEach((img) => {
        img.src = img.dataset.src ?? ""
        delete img.dataset.src
      })
  }, [showPages])

  // Which page is under the toolbar right now.
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const sections = root.querySelectorAll<HTMLElement>("section[data-page]")
    if (sections.length === 0) return
    const visible = new Map<number, number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const n = Number(e.target.getAttribute("data-page"))
          if (e.isIntersecting) visible.set(n, e.boundingClientRect.top)
          else visible.delete(n)
        }
        if (visible.size > 0) {
          const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0]
          setCurrentPage(top)
        }
      },
      { rootMargin: "-96px 0px -55% 0px" }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // Search: debounced, DOM-based, Arabic-folded.
  useEffect(() => {
    const timer = setTimeout(() => {
      const article = rootRef.current?.querySelector("article")
      if (!article) return
      clearMarks(article)
      const found = query.trim().length >= 2 ? highlight(article, query) : []
      setHits(found)
      setActive(0)
      if (found[0]) {
        found[0].setAttribute("data-active", "")
        found[0].scrollIntoView({ block: "center" })
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  const go = (delta: number) => {
    if (hits.length === 0) return
    const next = (active + delta + hits.length) % hits.length
    hits[active]?.removeAttribute("data-active")
    hits[next].setAttribute("data-active", "")
    hits[next].scrollIntoView({ block: "center" })
    setActive(next)
  }

  const scale = SCALES[scaleIdx]

  return (
    <div
      ref={rootRef}
      className="reader-root"
      data-pages={showPages ? "on" : "off"}
      style={{ "--reader-scale": scale } as React.CSSProperties}
    >
      <header className="reader-toolbar bg-background/90 sticky top-0 z-20 -mx-4 mb-4 border-b px-4 py-2 backdrop-blur md:-mx-6 md:px-6">
        <nav
          className="flex flex-wrap items-center gap-2"
          aria-label={labels.title}
        >
          <Button asChild variant="ghost" size="sm">
            <Link href={subjectHref}>
              <ArrowLeft className="size-4 rtl:rotate-180" />
              <span className="hidden sm:inline">{labels.backToSubject}</span>
            </Link>
          </Button>

          <details className="group relative">
            <summary className="hover:bg-muted flex cursor-pointer list-none items-center gap-1 rounded-md px-2 py-1.5 text-sm select-none">
              <List className="size-4" />
              <span>{labels.contents}</span>
            </summary>
            <div className="bg-popover text-popover-foreground absolute start-0 z-30 mt-1 max-h-[70vh] w-80 max-w-[90vw] overflow-y-auto rounded-md border p-2 shadow-md">
              {toc.length === 0 ? (
                <p className="text-muted-foreground p-2 text-sm">
                  {labels.notAnchored}
                </p>
              ) : (
                <ol className="space-y-1 text-sm">
                  {toc.map((chapter) => (
                    <li key={chapter.id}>
                      <TocLink entry={chapter} labels={labels} strong />
                      {chapter.children.length > 0 && (
                        <ol className="ms-3 mt-1 space-y-0.5 border-s ps-2">
                          {chapter.children.map((lesson) => (
                            <li key={lesson.id}>
                              <TocLink entry={lesson} labels={labels} />
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </details>

          <div
            className="flex items-center gap-0.5"
            role="group"
            aria-label={labels.textSize}
          >
            <Button
              variant="ghost"
              size="icon"
              aria-label={labels.smaller}
              disabled={scaleIdx === 0}
              onClick={() => setScaleIdx(Math.max(0, scaleIdx - 1))}
            >
              <Minus className="size-4" />
            </Button>
            <button
              type="button"
              className="text-muted-foreground min-w-10 text-center text-xs tabular-nums"
              aria-label={labels.resetSize}
              onClick={() => setScaleIdx(1)}
            >
              {Math.round(scale * 100)}%
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={labels.larger}
              disabled={scaleIdx === SCALES.length - 1}
              onClick={() =>
                setScaleIdx(Math.min(SCALES.length - 1, scaleIdx + 1))
              }
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {hasPageMarkers && (
            <Button
              variant={showPages ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={showPages}
              onClick={() => setShowPages(!showPages)}
            >
              {showPages ? (
                <ImageOff className="size-4" />
              ) : (
                <ImageIcon className="size-4" />
              )}
              <span className="hidden md:inline">
                {showPages ? labels.hidePages : labels.showPages}
              </span>
            </Button>
          )}

          <div className="relative ms-auto flex min-w-48 flex-1 items-center gap-1 sm:max-w-md">
            <Search className="text-muted-foreground pointer-events-none absolute start-2 size-4" />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  go(e.shiftKey ? -1 : 1)
                }
              }}
              placeholder={labels.searchPlaceholder}
              aria-label={labels.search}
              className="h-8 ps-8"
            />
            {query && (
              <>
                <span
                  className="text-muted-foreground text-xs whitespace-nowrap tabular-nums"
                  aria-live="polite"
                >
                  {hits.length === 0
                    ? labels.noMatches
                    : fill(labels.matchOf, {
                        current: active + 1,
                        total: hits.length,
                      })}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={labels.previous}
                  disabled={hits.length === 0}
                  onClick={() => go(-1)}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={labels.next}
                  disabled={hits.length === 0}
                  onClick={() => go(1)}
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={labels.clear}
                  onClick={() => setQuery("")}
                >
                  <X className="size-4" />
                </Button>
              </>
            )}
          </div>

          {currentPage != null && (
            <span className="text-muted-foreground hidden text-xs tabular-nums lg:inline">
              {sourcePages
                ? fill(labels.pageOf, { page: currentPage, total: sourcePages })
                : `${labels.page} ${currentPage}`}
            </span>
          )}

          {pdfUrl && (
            <Button asChild variant="ghost" size="sm">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="size-4" />
                <span className="hidden sm:inline">{labels.openPdf}</span>
              </a>
            </Button>
          )}
        </nav>
        {notice && (
          <p className="text-muted-foreground mt-1 text-xs">{notice}</p>
        )}
      </header>

      {children}
    </div>
  )
}

function TocLink({
  entry,
  labels,
  strong,
}: {
  entry: TocEntry
  labels: ReaderLabels
  strong?: boolean
}) {
  const cls = strong ? "font-semibold" : ""
  if (!entry.anchor)
    return (
      <span
        className={`text-muted-foreground block px-1 py-0.5 ${cls}`}
        title={labels.notAnchored}
      >
        {entry.name}
      </span>
    )
  return (
    <a
      href={`#${entry.anchor}`}
      className={`hover:bg-muted block rounded px-1 py-0.5 ${cls}`}
    >
      {entry.name}
    </a>
  )
}
