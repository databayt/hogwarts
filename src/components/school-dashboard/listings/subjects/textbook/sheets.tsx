"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react"
import {
  AlignJustify,
  Bookmark,
  FileText,
  List,
  Moon,
  Search,
  Settings,
  Share,
  Sun,
  X,
} from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"

import { fill, formatNumber } from "./format"
import {
  BRIGHTNESS_MAX,
  BRIGHTNESS_MIN,
  FONTS,
  LEADINGS,
  SCALES,
  THEMES,
  type Font,
  type Leading,
  type Mode,
  type Theme,
} from "./prefs"
import type { SearchResult } from "./search"
import type { TocChapter } from "./spine"
import { TocList } from "./toc"
import type { CoverInfo, ReaderLabels } from "./types"

/** The reading-menu glyph: two rules over three dots. */
export function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16" />
      <circle cx="6" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="17.5" r="1.3" fill="currentColor" stroke="none" />
    </svg>
  )
}

/**
 * Rotation lock — the reference's glyph: a turning arrow around a padlock,
 * its shackle open until the screen is held.
 */
export function RotationLockIcon({ locked }: { locked: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.68 4.79A8.6 8.6 0 1 0 18.08 18.08"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path d="M16.5 7.2h5.3L19.15 12.8z" fill="currentColor" />
      <rect
        x="8.65"
        y="10.9"
        width="6.7"
        height="3.8"
        rx="1.1"
        fill="currentColor"
      />
      <path
        d={
          locked
            ? "M10.5 10.9V9.7a1.75 1.75 0 0 1 3.5 0v1.2"
            : "M10.5 10.9V9.7a1.75 1.75 0 0 1 3.5 0"
        }
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Line guide — stacked rules with the read one caught in its capsule. */
export function LineGuideIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="6.1"
        width="14"
        height="1.9"
        rx="0.95"
        fill="currentColor"
      />
      <rect
        x="3.5"
        y="9.4"
        width="17"
        height="4.7"
        rx="2.35"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <rect
        x="5.6"
        y="10.9"
        width="12.8"
        height="1.7"
        rx="0.85"
        fill="currentColor"
      />
      <rect
        x="5"
        y="15.6"
        width="14"
        height="1.9"
        rx="0.95"
        fill="currentColor"
      />
      <rect
        x="5"
        y="18.6"
        width="14"
        height="1.9"
        rx="0.95"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * The Contents pill doubles as the book's scrubber, the way the Books app's
 * does: the read part of the book is a light fill growing from the reading
 * edge, the rest stays dark, and the label inverts wherever the fill has
 * reached it. A tap opens the contents; a drag turns the pages.
 */
function ProgressPill({
  label,
  percent,
  rtl,
  onContents,
  onScrub,
}: {
  label: string
  percent: number
  rtl: boolean
  onContents: () => void
  onScrub: (ratio: number) => void
}) {
  const el = useRef<HTMLButtonElement>(null)
  // A press only counts as a tap while it has not travelled; once it has, the
  // pointer is scrubbing and must not also open the contents on release.
  const drag = useRef<{ x: number; moved: boolean } | null>(null)
  // A finger reports far more moves than the book can repaginate, so a drag
  // turns at most one page per frame, always to the latest position.
  const frame = useRef<{ id: number; ratio: number } | null>(null)

  const ratioAt = (clientX: number) => {
    const r = el.current?.getBoundingClientRect()
    if (!r || r.width === 0) return 0
    const x = rtl ? r.right - clientX : clientX - r.left
    return Math.min(1, Math.max(0, x / r.width))
  }

  const scrubTo = (ratio: number) => {
    if (frame.current) {
      frame.current.ratio = ratio
      return
    }
    const pending = {
      ratio,
      id: requestAnimationFrame(() => {
        frame.current = null
        onScrub(pending.ratio)
      }),
    }
    frame.current = pending
  }

  useEffect(
    () => () => {
      if (frame.current) cancelAnimationFrame(frame.current.id)
    },
    []
  )

  return (
    <button
      ref={el}
      type="button"
      role="menuitem"
      className="book-pill book-pill-scrub"
      style={{ "--book-scrub": `${percent}%` } as CSSProperties}
      onPointerDown={(e) => {
        if (e.button !== 0 && e.pointerType === "mouse") return
        drag.current = { x: e.clientX, moved: false }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const d = drag.current
        if (!d) return
        if (!d.moved && Math.abs(e.clientX - d.x) < 4) return
        d.moved = true
        scrubTo(ratioAt(e.clientX))
      }}
      onPointerUp={(e) => {
        const d = drag.current
        drag.current = null
        if (!d) return
        if (d.moved) onScrub(ratioAt(e.clientX))
        else onContents()
      }}
      onPointerCancel={() => {
        drag.current = null
      }}
      onKeyDown={(e) => {
        const step = e.key === "ArrowUp" || e.key === "ArrowDown" ? 5 : 1
        if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault()
          onScrub(Math.min(1, (percent + (rtl ? -step : step)) / 100))
        } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault()
          onScrub(Math.max(0, (percent + (rtl ? step : -step)) / 100))
        }
      }}
    >
      <span className="book-scrub-fill" aria-hidden="true" />
      <span className="book-scrub-face">
        <span>{label}</span>
        <List className="size-5" />
      </span>
      <span
        className="book-scrub-face book-scrub-face-read"
        aria-hidden="true"
        style={
          {
            "--book-scrub-clip-start": rtl ? `${100 - percent}%` : "0%",
            "--book-scrub-clip-end": rtl ? "0%" : `${100 - percent}%`,
          } as CSSProperties
        }
      >
        <span>{label}</span>
        <List className="size-5" />
      </span>
    </button>
  )
}

/**
 * The reading menu — a stack of pills growing up from the menu button, over
 * a blurred foot of the page: Contents with progress, Search, Themes &
 * Settings, then the round actions the reference carries: share, rotation
 * lock, line guide and bookmark.
 */
export function ReadingMenu({
  labels,
  lang,
  rtl,
  percent,
  rotationLocked,
  guide,
  bookmarked,
  canBookmark,
  onClose,
  onContents,
  onScrub,
  onSearch,
  onSettings,
  onShare,
  onToggleRotation,
  onToggleGuide,
  onBookmark,
}: {
  labels: ReaderLabels
  lang: string
  rtl: boolean
  percent: number
  rotationLocked: boolean
  guide: boolean
  bookmarked: boolean
  canBookmark: boolean
  onClose: () => void
  onContents: () => void
  onScrub: (ratio: number) => void
  onSearch: () => void
  onSettings: () => void
  onShare: () => void
  onToggleRotation: () => void
  onToggleGuide: () => void
  onBookmark: () => void
}) {
  return (
    <div className="book-menu-backdrop" onClick={onClose} role="presentation">
      <div
        className="book-menu"
        role="menu"
        aria-label={labels.readingMenu}
        onClick={(e) => e.stopPropagation()}
      >
        <ProgressPill
          label={fill(labels.contentsProgress, {
            percent: formatNumber(percent, lang),
          })}
          percent={percent}
          rtl={rtl}
          onContents={onContents}
          onScrub={onScrub}
        />
        <button
          type="button"
          role="menuitem"
          className="book-pill"
          onClick={onSearch}
        >
          <span>{labels.searchBook}</span>
          <Search className="size-5" />
        </button>
        <button
          type="button"
          role="menuitem"
          className="book-pill"
          onClick={onSettings}
        >
          <span>{labels.themesSettings}</span>
          <span className="book-aa" aria-hidden="true">
            <span className="book-aa-small">A</span>A
          </span>
        </button>
        <div className="book-menu-round-row">
          <button
            type="button"
            role="menuitem"
            className="book-round"
            aria-label={labels.share}
            onClick={onShare}
          >
            <Share />
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={rotationLocked}
            className="book-round"
            aria-label={
              rotationLocked ? labels.rotationUnlock : labels.rotationLock
            }
            onClick={onToggleRotation}
          >
            <RotationLockIcon locked={rotationLocked} />
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={guide}
            className="book-round"
            aria-label={guide ? labels.lineGuideOff : labels.lineGuide}
            onClick={onToggleGuide}
          >
            <LineGuideIcon />
          </button>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={bookmarked}
            className="book-round"
            aria-label={labels.bookmark}
            disabled={!canBookmark}
            onClick={onBookmark}
          >
            <Bookmark className={bookmarked ? "fill-current" : undefined} />
          </button>
        </div>
      </div>
    </div>
  )
}

function Sheet({
  open,
  onClose,
  title,
  description,
  tall,
  hideClose,
  band,
  head,
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  tall?: boolean
  /** The search sheet closes from its field's ✕, as in the reference. */
  hideClose?: boolean
  /**
   * Controls that belong to the sheet's frosted head rather than its body.
   * The settings sheet is built this way in the reference: a translucent band
   * carrying the title and the quick controls, then a solid body beneath it.
   */
  band?: ReactNode
  /**
   * A head that replaces the default centred one outright — the contents
   * sheet leads with the book itself (jacket, title, folio) rather than a
   * label. It must render its own DrawerTitle/DrawerDescription.
   */
  head?: ReactNode
  className?: string
  children: ReactNode
}) {
  const header = (
    <DrawerHeader
      className={band ? "book-sheet-band-head" : "relative text-center"}
    >
      <DrawerTitle className="book-sheet-title">{title}</DrawerTitle>
      <DrawerDescription className="sr-only">{description}</DrawerDescription>
      {!hideClose && (
        <button
          type="button"
          className="book-round book-sheet-close"
          aria-label={description}
          onClick={onClose}
        >
          <X />
        </button>
      )}
    </DrawerHeader>
  )
  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose()
      }}
    >
      <DrawerContent
        className={[
          "book-sheet",
          tall ? "book-sheet-tall" : "",
          hideClose && !band ? "book-sheet-bare" : "",
          band ? "book-sheet-panel" : "",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {head ??
          (band ? (
            <div className="book-sheet-band">
              {header}
              {band}
            </div>
          ) : (
            header
          ))}
        {children}
      </DrawerContent>
    </Drawer>
  )
}

export function ContentsSheet({
  open,
  onClose,
  labels,
  lang,
  toc,
  offset,
  currentPage,
  bookmarks,
  onNavigate,
  cover,
  bookTitle,
  globalPage,
  totalPages,
}: {
  open: boolean
  onClose: () => void
  labels: ReaderLabels
  lang: string
  toc: TocChapter[]
  offset: number | null
  currentPage: number | null
  bookmarks: number[]
  onNavigate: (page: number) => void
  cover: CoverInfo
  bookTitle: string
  /** Where the reader is standing, in screens, and how many there are. */
  globalPage: number | null
  totalPages: number
}) {
  const printed = (page: number) =>
    formatNumber(
      offset != null && page - offset > 0 ? page - offset : page,
      lang
    )
  /* The reference leads with the book itself: its jacket, its title and the
     folio the reader is standing on, with only the word "Page" set back. */
  const head = (
    <div className="book-contents-head">
      {cover.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="book-contents-jacket"
          src={cover.url}
          alt=""
          decoding="async"
        />
      ) : (
        <div className="book-contents-jacket book-contents-jacket-blank" />
      )}
      <div className="book-contents-plate">
        <DrawerTitle className="book-contents-title">{bookTitle}</DrawerTitle>
        <DrawerDescription className="sr-only">
          {labels.contents}
        </DrawerDescription>
        {globalPage != null && totalPages > 0 && (
          <p className="book-contents-folio">
            <span className="book-contents-folio-word">{labels.page}</span>{" "}
            <span className="book-contents-folio-count">
              {fill(labels.pageOfTotal, {
                page: formatNumber(globalPage, lang),
                total: formatNumber(totalPages, lang),
              })}
            </span>
          </p>
        )}
      </div>
      <button
        type="button"
        className="book-contents-close"
        aria-label={labels.close}
        onClick={onClose}
      >
        <X />
      </button>
    </div>
  )
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={labels.contents}
      description={labels.resume}
      className="book-sheet-contents"
      head={head}
      tall
    >
      <div className="book-sheet-body">
        <TocList
          toc={toc}
          labels={labels}
          lang={lang}
          offset={offset}
          currentPage={currentPage}
          onNavigate={onNavigate}
        />
        <h3 className="book-sheet-heading">{labels.bookmarks}</h3>
        {bookmarks.length === 0 ? (
          <p className="text-muted-foreground text-sm">{labels.noBookmarks}</p>
        ) : (
          <ol className="book-toc-list">
            {bookmarks.map((page) => (
              <li key={page}>
                <a
                  href={`#p-${page}`}
                  className="book-toc-row"
                  onClick={(e) => {
                    e.preventDefault()
                    onNavigate(page)
                  }}
                >
                  <Bookmark className="size-4 fill-current" />
                  <span className="book-toc-title">
                    {fill(labels.pageN, { page: printed(page) })}
                  </span>
                </a>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Sheet>
  )
}

export function SearchSheet({
  open,
  onClose,
  labels,
  lang,
  offset,
  query,
  onQuery,
  results,
  onPick,
}: {
  open: boolean
  onClose: () => void
  labels: ReaderLabels
  lang: string
  offset: number | null
  query: string
  onQuery: (q: string) => void
  results: SearchResult[]
  onPick: (r: SearchResult) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => inputRef.current?.focus(), 250)
    return () => clearTimeout(t)
  }, [open])
  const printed = (page: number | null) =>
    page == null
      ? null
      : formatNumber(
          offset != null && page - offset > 0 ? page - offset : page,
          lang
        )
  const trimmed = query.trim()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={labels.searchBook}
      description={labels.close}
      tall
      hideClose
    >
      <div className="book-sheet-body book-search-results">
        {trimmed.length < 2 ? null : results.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            {labels.noResults}
          </p>
        ) : (
          <>
            <p className="text-muted-foreground py-2 text-center text-xs">
              {fill(labels.resultsCount, {
                n: formatNumber(results.length, lang),
              })}
            </p>
            <ol>
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="book-result"
                    onClick={() => onPick(r)}
                  >
                    <span>
                      {r.before}
                      <mark>{r.hit}</mark>
                      {r.after}
                    </span>
                    {printed(r.page) && (
                      <span className="book-result-page">
                        {fill(labels.pageN, { page: printed(r.page) ?? "" })}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
      <form
        className="book-search-bar"
        onSubmit={(e) => {
          e.preventDefault()
          if (results[0]) onPick(results[0])
        }}
      >
        <div className="book-search-field">
          <Search className="book-search-icon size-5" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            className="book-search-input"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={labels.searchInThisBook}
            aria-label={labels.searchBook}
            autoComplete="off"
          />
        </div>
        <button
          type="button"
          className="book-round"
          aria-label={labels.clear}
          onClick={() => (query ? onQuery("") : onClose())}
        >
          <X />
        </button>
      </form>
    </Sheet>
  )
}

export function SettingsSheet({
  open,
  onClose,
  labels,
  lang,
  theme,
  onTheme,
  mode,
  onMode,
  scaleIdx,
  onScaleIdx,
  brightness,
  onBrightness,
  onCustomize,
}: {
  open: boolean
  onClose: () => void
  labels: ReaderLabels
  lang: string
  theme: Theme
  onTheme: (t: Theme) => void
  mode: Mode
  onMode: (m: Mode) => void
  scaleIdx: number
  onScaleIdx: (i: number) => void
  brightness: number
  onBrightness: (value: number) => void
  onCustomize: () => void
}) {
  const themeLabel: Record<Theme, string> = {
    original: labels.themeOriginal,
    quiet: labels.themeQuiet,
    paper: labels.themePaper,
    bold: labels.themeBold,
    calm: labels.themeCalm,
    focus: labels.themeFocus,
  }
  // Arabic reads a palette by its name, not by a two-letter specimen: "أب"
  // says nothing about a face, so the card sets its name larger instead.
  // Latin keeps the reference's "Aa".
  const ar = lang === "ar"
  const brightnessFill =
    ((brightness - BRIGHTNESS_MIN) / (BRIGHTNESS_MAX - BRIGHTNESS_MIN)) * 100
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={labels.themesSettings}
      description={labels.close}
      band={
        <div className="book-panel-controls">
          <div className="book-capsule-row">
            <div
              className="book-capsule book-capsule-size"
              role="group"
              aria-label={labels.textSize}
            >
              <button
                type="button"
                aria-label={labels.smaller}
                disabled={scaleIdx === 0}
                onClick={() => onScaleIdx(scaleIdx - 1)}
              >
                <span className="book-capsule-a book-capsule-a-small">
                  {ar ? labels.sizeSmaller : "A"}
                </span>
              </button>
              <span className="book-capsule-rule" aria-hidden="true" />
              <button
                type="button"
                aria-label={labels.larger}
                disabled={scaleIdx === SCALES.length - 1}
                onClick={() => onScaleIdx(scaleIdx + 1)}
              >
                <span className="book-capsule-a">
                  {ar ? labels.sizeLarger : "A"}
                </span>
              </button>
            </div>
            <div
              className="book-capsule book-capsule-view"
              role="group"
              aria-label={labels.appearance}
            >
              <button
                type="button"
                aria-pressed={mode === "light"}
                aria-label={labels.lightMode}
                onClick={() => onMode("light")}
              >
                <Sun />
              </button>
              <button
                type="button"
                aria-pressed={mode === "dark"}
                aria-label={labels.darkMode}
                onClick={() => onMode("dark")}
              >
                <Moon />
              </button>
            </div>
          </div>
          <div className="book-slider-row">
            <Sun className="book-slider-mark size-3.5" aria-hidden="true" />
            <span
              className="book-slider"
              style={
                { "--book-slider-fill": `${brightnessFill}%` } as CSSProperties
              }
            >
              <span className="book-slider-rail" aria-hidden="true" />
              <span className="book-slider-done" aria-hidden="true" />
              <input
                type="range"
                className="book-slider-input"
                min={BRIGHTNESS_MIN}
                max={BRIGHTNESS_MAX}
                step={1}
                value={brightness}
                aria-label={labels.brightness}
                onChange={(e) => onBrightness(Number(e.target.value))}
              />
            </span>
            <Sun className="book-slider-mark size-5" aria-hidden="true" />
          </div>
        </div>
      }
    >
      <div className="book-sheet-body book-panel-body">
        <div
          className="book-themes"
          role="radiogroup"
          aria-label={labels.theme}
        >
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={theme === t}
              className="book-theme"
              data-swatch={t}
              data-specimen={ar ? "off" : "on"}
              onClick={() => onTheme(t)}
            >
              {!ar && <span className="book-theme-sample">Aa</span>}
              <span className="book-theme-name">{themeLabel[t]}</span>
            </button>
          ))}
        </div>
        <button type="button" className="book-customize" onClick={onCustomize}>
          <Settings className="size-5" aria-hidden="true" />
          <span>{labels.customize}</span>
        </button>
      </div>
    </Sheet>
  )
}

/**
 * Customize — the face and the line spacing, the two settings the reference
 * keeps behind its own gear rather than on the themes panel.
 */
export function CustomizeSheet({
  open,
  onClose,
  labels,
  font,
  onFont,
  leading,
  onLeading,
  pdfUrl,
  canFacsimile,
  facsimile,
  onFacsimile,
}: {
  open: boolean
  onClose: () => void
  labels: ReaderLabels
  font: Font
  onFont: (f: Font) => void
  leading: Leading
  onLeading: (l: Leading) => void
  /** The round row carries the reference's four actions, so the page view
      and the PDF live here instead. */
  pdfUrl: string | null
  canFacsimile: boolean
  facsimile: boolean
  onFacsimile: (on: boolean) => void
}) {
  const fontLabel: Record<Font, string> = {
    serif: labels.fontSerif,
    sans: labels.fontSans,
  }
  const leadingLabel: Record<Leading, string> = {
    tight: labels.spacingTight,
    normal: labels.spacingNormal,
    loose: labels.spacingLoose,
  }
  const leadingIdx = Math.max(0, LEADINGS.indexOf(leading))
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={labels.customize}
      description={labels.close}
      tall
    >
      <div className="book-sheet-body book-panel-body">
        <h3 className="book-sheet-heading">{labels.font}</h3>
        <div className="book-font-pill" role="group" aria-label={labels.font}>
          {FONTS.map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={font === f}
              data-face={f}
              onClick={() => onFont(f)}
            >
              {fontLabel[f]}
            </button>
          ))}
        </div>
        <h3 className="book-sheet-heading">{labels.lineSpacing}</h3>
        <div className="book-slider-row">
          <AlignJustify
            className="book-slider-mark size-3.5"
            aria-hidden="true"
          />
          <span
            className="book-slider"
            style={
              {
                "--book-slider-fill": `${(leadingIdx / (LEADINGS.length - 1)) * 100}%`,
              } as CSSProperties
            }
          >
            <span className="book-slider-rail" aria-hidden="true" />
            <span className="book-slider-done" aria-hidden="true" />
            <input
              type="range"
              className="book-slider-input"
              min={0}
              max={LEADINGS.length - 1}
              step={1}
              value={leadingIdx}
              aria-label={labels.lineSpacing}
              aria-valuetext={leadingLabel[leading]}
              onChange={(e) => onLeading(LEADINGS[Number(e.target.value)])}
            />
          </span>
          <AlignJustify
            className="book-slider-mark size-5"
            aria-hidden="true"
          />
        </div>
      </div>
    </Sheet>
  )
}
