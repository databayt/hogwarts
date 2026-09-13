// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Children, type ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface ListRowProps {
  title: ReactNode
  /** Square art at the start — a `TileFace`, an avatar, a picture. */
  art?: ReactNode
  /** Something small before the copy that is NOT art — a status dot, a rank. */
  leading?: ReactNode
  /** Sits on the title's baseline: a grade, a status. One, usually. */
  badge?: ReactNode
  description?: ReactNode
  /** The small line under everything — a date, a name · a time. */
  meta?: ReactNode
  /** The row's figure or control at the far end: an amount, a switch. */
  trailing?: ReactNode
  href?: string
  onClick?: () => void
  /** Chevron defaults on for links; a row with a trailing control drops it. */
  chevron?: boolean
  className?: string
}

/**
 * One record as the /live article row: art square, then the copy in the order
 * it is read — what it is (with its badge on the same baseline), what it says,
 * and the small print — then its figure or a chevron at the far end.
 *
 * It exists because the lists it replaces were flex rows with a cluster of
 * amount + badge + buttons pinned to one end, and on a 390px screen that
 * cluster took the width and left the title a column one word wide
 * ("EXP-2025-0099 / — / Printing / Press"). Here the copy column is the one
 * that flexes, and the trailing slot takes only what its content needs.
 *
 * The whole row is the link with a tinted hover, as the reference's is.
 */
export function ListRow({
  title,
  art,
  leading,
  badge,
  description,
  meta,
  trailing,
  href,
  onClick,
  chevron,
  className,
}: ListRowProps) {
  const interactive = Boolean(href || onClick)
  const showChevron = chevron ?? (Boolean(href) && !trailing)

  const body = (
    <>
      {art ? <div className="w-14 shrink-0">{art}</div> : null}
      {leading ? <div className="shrink-0">{leading}</div> : null}

      <div className="min-w-0 flex-1 text-start">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <h3 className="line-clamp-2 text-base leading-6 font-semibold">
            {title}
          </h3>
          {badge}
        </div>
        {description ? (
          <p className="text-muted-foreground mt-0.5 line-clamp-2 text-sm">
            {description}
          </p>
        ) : null}
        {meta ? (
          <div className="text-muted-foreground mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 text-xs">
            {meta}
          </div>
        ) : null}
      </div>

      {trailing ? (
        <div className="shrink-0 text-end tabular-nums">{trailing}</div>
      ) : null}
      {showChevron ? (
        <ChevronRight
          className="text-muted-foreground/60 size-4 shrink-0 rtl:rotate-180"
          aria-hidden="true"
        />
      ) : null}
    </>
  )

  const rowClass = cn(
    "-mx-2 flex items-center gap-3 rounded-[10px] px-2 py-2.5 transition-colors",
    interactive && "hover:bg-muted/60 active:bg-muted",
    className
  )

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {body}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(rowClass, "w-full")}
      >
        {body}
      </button>
    )
  }

  return <div className={rowClass}>{body}</div>
}

/**
 * Rows under one another. Rows with art need nothing between them — the art
 * squares already mark where one record ends, as on /live. Rows without art
 * take the book page's hairline instead, or a column of text runs together.
 */
export function ListRows({
  children,
  divided = false,
  className,
}: {
  children: ReactNode
  divided?: boolean
  className?: string
}) {
  if (!divided) {
    return <div className={cn("flex flex-col", className)}>{children}</div>
  }

  // The hairline goes on a plain wrapper, not on the row: the row bleeds 8px
  // past the text for its hover ground and rounds its corners, and a border on
  // it curled up at both ends like the floor of a card.
  return (
    <div className={cn("divide-border flex flex-col divide-y", className)}>
      {Children.toArray(children).map((child, index) => (
        <div key={index} className="py-0.5">
          {child}
        </div>
      ))}
    </div>
  )
}
