"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, type ReactNode } from "react"
import {
  Bookmark,
  FileText,
  Image as ImageIcon,
  List,
  Minus,
  Plus,
  Search,
  Share,
  X,
} from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"

import { fill, formatNumber } from "./format"
import {
  FONTS,
  LEADINGS,
  SCALES,
  THEMES,
  type Font,
  type Leading,
  type Theme,
} from "./prefs"
import type { SearchResult } from "./search"
import type { TocChapter } from "./spine"
import { TocList } from "./toc"
import type { ReaderLabels } from "./types"

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
 * The reading menu — a stack of pills growing up from the menu button, over
 * a blurred foot of the page: Contents with progress, Search, Themes &
 * Settings, then the round actions (share, PDF, original pages, bookmark).
 */
export function ReadingMenu({
  labels,
  lang,
  percent,
  pdfUrl,
  canFacsimile,
  facsimile,
  bookmarked,
  canBookmark,
  onClose,
  onContents,
  onSearch,
  onSettings,
  onShare,
  onToggleFacsimile,
  onBookmark,
}: {
  labels: ReaderLabels
  lang: string
  percent: number
  pdfUrl: string | null
  canFacsimile: boolean
  facsimile: boolean
  bookmarked: boolean
  canBookmark: boolean
  onClose: () => void
  onContents: () => void
  onSearch: () => void
  onSettings: () => void
  onShare: () => void
  onToggleFacsimile: () => void
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
        <button
          type="button"
          role="menuitem"
          className="book-pill book-pill-dark"
          onClick={onContents}
        >
          <span>
            {fill(labels.contentsProgress, {
              percent: formatNumber(percent, lang),
            })}
          </span>
          <List className="size-5" />
        </button>
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
          {pdfUrl && (
            <a
              role="menuitem"
              className="book-round"
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={labels.openPdf}
            >
              <FileText />
            </a>
          )}
          {canFacsimile && (
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={facsimile}
              className="book-round"
              aria-label={facsimile ? labels.textPages : labels.originalPages}
              onClick={onToggleFacsimile}
            >
              <ImageIcon />
            </button>
          )}
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
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description: string
  tall?: boolean
  /** The search sheet closes from its field's ✕, as in the reference. */
  hideClose?: boolean
  children: ReactNode
}) {
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
          hideClose ? "book-sheet-bare" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <DrawerHeader className="relative text-center">
          <DrawerTitle className="book-sheet-title">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">
            {description}
          </DrawerDescription>
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
}) {
  const printed = (page: number) =>
    formatNumber(
      offset != null && page - offset > 0 ? page - offset : page,
      lang
    )
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={labels.contents}
      description={labels.resume}
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
  font,
  onFont,
  scaleIdx,
  onScaleIdx,
  leading,
  onLeading,
  canFacsimile,
  facsimile,
  onFacsimile,
}: {
  open: boolean
  onClose: () => void
  labels: ReaderLabels
  lang: string
  theme: Theme
  onTheme: (t: Theme) => void
  font: Font
  onFont: (f: Font) => void
  scaleIdx: number
  onScaleIdx: (i: number) => void
  leading: Leading
  onLeading: (l: Leading) => void
  canFacsimile: boolean
  facsimile: boolean
  onFacsimile: (on: boolean) => void
}) {
  const themeLabel: Record<Theme, string> = {
    original: labels.themeOriginal,
    paper: labels.themePaper,
    quiet: labels.themeQuiet,
    night: labels.themeNight,
  }
  const fontLabel: Record<Font, string> = {
    serif: labels.fontSerif,
    sans: labels.fontSans,
  }
  const leadingLabel: Record<Leading, string> = {
    tight: labels.spacingTight,
    normal: labels.spacingNormal,
    loose: labels.spacingLoose,
  }
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={labels.themesSettings}
      description={labels.close}
    >
      <div className="book-sheet-body">
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
              onClick={() => onTheme(t)}
            >
              <span className="book-theme-swatch" data-swatch={t}>
                {lang === "ar" ? "أ" : "A"}
              </span>
              <span>{themeLabel[t]}</span>
            </button>
          ))}
        </div>
        <div className="book-setting-row">
          <span>{labels.textSize}</span>
          <div
            className="book-stepper"
            role="group"
            aria-label={labels.textSize}
          >
            <button
              type="button"
              aria-label={labels.smaller}
              disabled={scaleIdx === 0}
              onClick={() => onScaleIdx(scaleIdx - 1)}
            >
              <Minus className="size-4" />
            </button>
            <button
              type="button"
              className="book-stepper-value"
              aria-label={labels.resetSize}
              onClick={() => onScaleIdx(1)}
            >
              {fill(labels.percentN, {
                n: formatNumber(Math.round(SCALES[scaleIdx] * 100), lang),
              })}
            </button>
            <button
              type="button"
              aria-label={labels.larger}
              disabled={scaleIdx === SCALES.length - 1}
              onClick={() => onScaleIdx(scaleIdx + 1)}
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
        <div className="book-setting-row">
          <span>{labels.font}</span>
          <div className="book-segmented" role="group" aria-label={labels.font}>
            {FONTS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={font === f}
                onClick={() => onFont(f)}
              >
                {fontLabel[f]}
              </button>
            ))}
          </div>
        </div>
        <div className="book-setting-row">
          <span>{labels.lineSpacing}</span>
          <div
            className="book-segmented"
            role="group"
            aria-label={labels.lineSpacing}
          >
            {LEADINGS.map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={leading === l}
                onClick={() => onLeading(l)}
              >
                {leadingLabel[l]}
              </button>
            ))}
          </div>
        </div>
        {canFacsimile && (
          <label className="book-setting-row">
            <span>{labels.originalPages}</span>
            <Switch checked={facsimile} onCheckedChange={onFacsimile} />
          </label>
        )}
      </div>
    </Sheet>
  )
}

export function AboutSheet({
  open,
  onClose,
  labels,
  text,
}: {
  open: boolean
  onClose: () => void
  labels: ReaderLabels
  text: string
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={labels.aboutBook}
      description={labels.close}
      tall
    >
      <div className="book-sheet-body">
        <div className="book-about-rule" aria-hidden="true" />
        <p className="book-about-text">{text}</p>
      </div>
    </Sheet>
  )
}
