// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export type StatTone = "default" | "positive" | "negative" | "warning" | "info"

export interface StatItem {
  key: string
  label: string
  value: ReactNode
  /** One short line under the figure — a unit, a share, "of 417 days". */
  hint?: ReactNode
  tone?: StatTone
  href?: string
  /** Take the whole row — the headline figure the others break down. */
  wide?: boolean
  /** A block under the hint, e.g. a progress bar for the figure above it. */
  extra?: ReactNode
}

/**
 * Tone is carried by the FIGURE, never by the cell. A red ground behind
 * "absent" was the old card's signal; on a grey panel a coloured number reads
 * the same and keeps four cells one surface instead of four tinted boxes.
 */
const TONE: Record<StatTone, string> = {
  default: "text-foreground",
  positive: "text-emerald-600 dark:text-emerald-400",
  negative: "text-destructive",
  warning: "text-amber-600 dark:text-amber-400",
  info: "text-sky-600 dark:text-sky-400",
}

interface StatPanelProps {
  items: StatItem[]
  title?: string
  description?: string
  /** Cells per row. Phones read two; three only for short figures. */
  columns?: 2 | 3
  /** Anything drawn under the figures inside the same panel — a chart, a bar. */
  children?: ReactNode
  className?: string
}

interface PlacedItem {
  item: StatItem
  row: number
  col: number
  span: number
}

/**
 * Lay the items out on the grid up front, so each cell knows whether it has a
 * neighbour above (hairline on top) or before it (hairline at the start). A
 * `wide` item starts a fresh row; the last item stretches over whatever is left
 * of its row, so the panel never ends on a blank half-cell.
 */
function place(items: StatItem[], columns: number): PlacedItem[] {
  const placed: PlacedItem[] = []
  let cursor = 0

  items.forEach((item, index) => {
    if (item.wide && cursor % columns !== 0) {
      // Stretch the previous cell over the gap rather than leave a hole.
      const prev = placed[placed.length - 1]
      if (prev) prev.span += columns - (cursor % columns)
      cursor += columns - (cursor % columns)
    }
    const col = cursor % columns
    let span = item.wide ? columns : 1
    if (index === items.length - 1 && col + span < columns) {
      span = columns - col
    }
    placed.push({ item, row: Math.floor(cursor / columns), col, span })
    cursor += span
  })

  return placed
}

/**
 * Several figures as ONE grey panel, split by hairlines — the header of the
 * phone dashboard's analytics card ("active users · sessions"), reused for
 * every stat strip.
 *
 * It replaces a stack of bordered cards, one figure each, that on a phone
 * cost ~100px of height per number: /attendance for a student was five cards
 * and 1,250px before the reader reached a single record. Two cells a row, a
 * hairline between them, the label small and muted above a bold figure.
 */
export function StatPanel({
  items,
  title,
  description,
  columns = 2,
  children,
  className,
}: StatPanelProps) {
  if (items.length === 0 && !children) return null

  return (
    <section className={cn("bg-muted overflow-hidden rounded-xl", className)}>
      {title ? (
        <header className="border-b px-5 py-4">
          <h2 className="leading-6 font-semibold">{title}</h2>
          {description ? (
            <p className="text-muted-foreground mt-0.5 text-sm">
              {description}
            </p>
          ) : null}
        </header>
      ) : null}

      {items.length > 0 ? (
        <div
          className={cn("grid", columns === 3 ? "grid-cols-3" : "grid-cols-2")}
        >
          {place(items, columns).map((cell) => (
            <StatCell key={cell.item.key} {...cell} />
          ))}
        </div>
      ) : null}

      {children}
    </section>
  )
}

function StatCell({ item, row, col, span }: PlacedItem) {
  const body = (
    <>
      <span className="text-muted-foreground line-clamp-1 text-xs">
        {item.label}
      </span>
      <span
        className={cn(
          "font-bold break-words tabular-nums",
          item.wide ? "text-2xl leading-8" : "text-lg leading-6",
          TONE[item.tone ?? "default"]
        )}
      >
        {item.value}
      </span>
      {item.hint ? (
        <span className="text-muted-foreground line-clamp-1 text-xs">
          {item.hint}
        </span>
      ) : null}
      {item.extra ? <div className="mt-2">{item.extra}</div> : null}
    </>
  )

  const cellClass = cn(
    "flex min-w-0 flex-col gap-1 px-5 py-4 text-start",
    row > 0 && "border-t",
    col > 0 && "border-s",
    span === 2 && "col-span-2",
    span === 3 && "col-span-3"
  )

  return item.href ? (
    <Link
      href={item.href}
      className={cn(cellClass, "hover:bg-foreground/[0.03] transition-colors")}
    >
      {body}
    </Link>
  ) : (
    <div className={cellClass}>{body}</div>
  )
}
