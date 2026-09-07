// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { ReactNode } from "react"

import { formatNumber } from "./format"
import { Ornament } from "./ornament"
import type { TocChapter } from "./spine"
import type { ReaderLabels } from "./types"

/**
 * The contents table — rendered once as the book's second screen (inside a
 * paginated flow) and again inside the Contents sheet. Rows carry `data-go`
 * with their PDF page so the reader's click delegation can jump; the sheet
 * passes `onNavigate` instead and handles the click itself.
 */
export function TocList({
  toc,
  labels,
  lang,
  offset,
  currentPage,
  onNavigate,
}: {
  toc: TocChapter[]
  labels: ReaderLabels
  lang: string
  offset: number | null
  currentPage: number | null
  onNavigate?: (page: number) => void
}) {
  const printed = (page: number | null): string | null => {
    if (page == null) return null
    const n = offset != null && page - offset > 0 ? page - offset : page
    return formatNumber(n, lang)
  }
  const isCurrent = (i: number): boolean => {
    const start = toc[i].page
    if (currentPage == null || start == null) return false
    const next = toc.slice(i + 1).find((c) => c.page != null)?.page
    return currentPage >= start && (next == null || currentPage < next)
  }
  const row = (page: number | null, children: ReactNode, className: string) => (
    <a
      href={page != null ? `#p-${page}` : undefined}
      data-go={page ?? undefined}
      className={className}
      aria-disabled={page == null || undefined}
      title={page == null ? labels.notAnchored : undefined}
      onClick={
        onNavigate && page != null
          ? (e) => {
              e.preventDefault()
              onNavigate(page)
            }
          : undefined
      }
    >
      {children}
    </a>
  )

  return (
    <ol className="book-toc-list">
      {toc.map((ch, i) => (
        <li
          key={ch.id}
          className="book-toc-chapter"
          data-current={isCurrent(i) || undefined}
        >
          {row(
            ch.page,
            <>
              <span className="book-toc-num">{formatNumber(i + 1, lang)}</span>
              <span className="book-toc-title">{ch.name}</span>
              <span className="book-toc-leader" aria-hidden="true" />
              {printed(ch.page) && (
                <span className="book-toc-page">{printed(ch.page)}</span>
              )}
            </>,
            "book-toc-row"
          )}
          {ch.lessons.length > 0 && (
            <ol className="book-toc-lessons">
              {ch.lessons.map((l) => (
                <li key={l.id}>
                  {row(
                    l.page,
                    <>
                      <span className="book-toc-title">{l.name}</span>
                      <span className="book-toc-leader" aria-hidden="true" />
                      {printed(l.page) && (
                        <span className="book-toc-page">{printed(l.page)}</span>
                      )}
                    </>,
                    "book-toc-row book-toc-lesson"
                  )}
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  )
}

/** Screen two of the book: a designed contents page inside a flow. */
export function TocPage(props: {
  toc: TocChapter[]
  labels: ReaderLabels
  lang: string
  offset: number | null
}) {
  return (
    <div className="book-toc">
      <header className="book-opener" data-level="chapter">
        <h2>{props.labels.contents}</h2>
        <Ornament />
      </header>
      <TocList {...props} currentPage={null} />
    </div>
  )
}
