// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"

interface ItemCardProps {
  title: ReactNode
  /** Small muted line above the title: who, or which number. */
  eyebrow?: ReactNode
  /** The record's figure — an amount, a score. Bold, under the title. */
  value?: ReactNode
  /** Status chips, on the card's floor. */
  badges?: ReactNode
  /** The last line: a date, a count. */
  meta?: ReactNode
  /** Square art above everything, e.g. a `TileFace` or an avatar. */
  art?: ReactNode
  /** A row-actions menu. Sits top-end, OUTSIDE the link, so it stays tappable. */
  actions?: ReactNode
  href?: string
  onClick?: () => void
  className?: string
}

/**
 * One record in a listing's grid view: a grey card, two to a row on a phone.
 *
 * The ground is the phone dashboard's analytics card — `bg-muted`, 14px corners,
 * no border, no shadow. The grids this replaces drew each record as a bordered
 * white box the full width of the screen and 180px tall, one per scroll, which
 * made "grid" the slowest way to read a list. At two across, a screen shows
 * eight records.
 *
 * The copy runs top to bottom in reading order and the floor (badges, meta) is
 * pushed to the bottom, so a row of cards with titles of different lengths
 * still lines up at the chips.
 */
export function ItemCard({
  title,
  eyebrow,
  value,
  badges,
  meta,
  art,
  actions,
  href,
  onClick,
  className,
}: ItemCardProps) {
  const body = (
    <>
      {art ? <div className="mb-1 w-11">{art}</div> : null}
      {eyebrow ? (
        <p
          className={cn(
            "text-muted-foreground line-clamp-1 text-xs",
            actions && "pe-7"
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h3
        className={cn(
          "line-clamp-3 text-sm leading-5 font-semibold text-pretty",
          actions && !eyebrow && "pe-7"
        )}
      >
        {title}
      </h3>
      {value ? (
        <p className="text-base leading-6 font-bold break-words tabular-nums">
          {value}
        </p>
      ) : null}
      {badges || meta ? (
        <div className="mt-auto flex flex-col gap-1.5 pt-1.5">
          {badges ? (
            <div className="flex flex-wrap items-center gap-1">{badges}</div>
          ) : null}
          {meta ? (
            <p className="text-muted-foreground line-clamp-1 text-xs tabular-nums">
              {meta}
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  )

  const cardClass = cn(
    "bg-muted flex h-full min-h-[128px] w-full flex-col gap-1.5 rounded-xl p-4 text-start transition-colors",
    (href || onClick) &&
      "hover:bg-muted/70 focus-visible:ring-ring outline-none focus-visible:ring-2 active:scale-[0.99]",
    className
  )

  return (
    <li className="relative min-w-0 list-none">
      {href ? (
        <Link href={href} className={cardClass}>
          {body}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cardClass}>
          {body}
        </button>
      ) : (
        <div className={cardClass}>{body}</div>
      )}
      {actions ? <div className="absolute end-2 top-2">{actions}</div> : null}
    </li>
  )
}

/**
 * The grid the cards sit in: two across on a phone, stepping to four on a wide
 * desktop. `ItemCard` renders its own `<li>`, so this is the `<ul>`.
 */
export function ItemGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
        className
      )}
    >
      {children}
    </ul>
  )
}

/** The grid's load-more, in the pill the rest of the pattern uses. */
export function ItemGridMore({
  onClick,
  loading,
  label,
  loadingLabel,
}: {
  onClick: () => void
  loading?: boolean
  label: string
  loadingLabel?: string
}) {
  return (
    <div className="mt-4 flex justify-center">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="bg-muted hover:bg-muted/70 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? (loadingLabel ?? label) : label}
      </button>
    </div>
  )
}
