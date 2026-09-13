// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type * as React from "react"
import Image from "next/image"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Artwork in `public/tiles/` — the iOS icon set the phone dashboard's home
 * block and quick actions already draw. A section that has a tile for its
 * destination uses it, so "Finance" on /attendance is the same wallet the
 * dashboard shows.
 */
export type TileArt =
  | "announcements"
  | "assignments"
  | "attendance"
  | "events"
  | "exams"
  | "grades"
  | "home"
  | "message"
  | "notifications"
  | "profile"
  | "schedule"
  | "setting"
  | "stream"
  | "students"
  | "subject"
  | "wallet"

/**
 * Grounds for destinations the tile set has no picture for.
 *
 * iOS system colours, each lifted ~12% at the top the way the tiles
 * themselves are lit, so a drawn tile sits in the same row as a pictured one
 * without reading as a placeholder. Literal hexes on purpose: this is icon
 * ARTWORK, like the PNGs beside it, not a themed surface — it must not invert
 * in dark mode any more than the Messages bubble does.
 */
export type TileTint =
  | "blue"
  | "green"
  | "indigo"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "teal"
  | "yellow"
  | "gray"
  | "mint"
  | "brown"

const TINTS: Record<TileTint, string> = {
  blue: "bg-[linear-gradient(180deg,#3E9BFF_0%,#0A6CF0_100%)]",
  green: "bg-[linear-gradient(180deg,#5DDB78_0%,#27B34A_100%)]",
  indigo: "bg-[linear-gradient(180deg,#7C7AF2_0%,#4B48D1_100%)]",
  orange: "bg-[linear-gradient(180deg,#FFB340_0%,#F58A00_100%)]",
  pink: "bg-[linear-gradient(180deg,#FF6482_0%,#F0284F_100%)]",
  purple: "bg-[linear-gradient(180deg,#C97AF0_0%,#9A45D1_100%)]",
  red: "bg-[linear-gradient(180deg,#FF6B61_0%,#EA3025_100%)]",
  teal: "bg-[linear-gradient(180deg,#5AC8E0_0%,#1E9BBA_100%)]",
  yellow: "bg-[linear-gradient(180deg,#FFD84D_0%,#F5B800_100%)]",
  gray: "bg-[linear-gradient(180deg,#A5A5AB_0%,#77777D_100%)]",
  mint: "bg-[linear-gradient(180deg,#5FE0C8_0%,#14B89A_100%)]",
  brown: "bg-[linear-gradient(180deg,#C29A72_0%,#94704E_100%)]",
}

export interface AppTileItem {
  key: string
  label: string
  href: string
  /** Picture from `public/tiles/`. Wins over `icon`. */
  art?: TileArt
  /** Glyph drawn on a tinted ground when there is no picture. */
  icon?: LucideIcon
  tint?: TileTint
  /** A count worth a red dot — pending items behind the door. */
  badge?: number
  /** A face of its own — e.g. a `DateTile` for a door that is about dates. */
  face?: React.ReactNode
}

/**
 * The icon face on its own — a tile without the label, for rows and cards
 * that want the same art at a smaller size.
 *
 * The clip is the home block's 29.2%: the PNGs bake their own corners into
 * the alpha and the roundest of them cut at 29.2% of their width, so any
 * smaller CSS radius leaves a notch of page showing inside the corner.
 */
export function TileFace({
  art,
  icon: Icon,
  tint = "blue",
  className,
}: Pick<AppTileItem, "art" | "icon" | "tint"> & { className?: string }) {
  if (art) {
    return (
      <Image
        src={`/tiles/${art}.png`}
        alt=""
        width={64}
        height={64}
        sizes="64px"
        className={cn(
          "aspect-square w-full rounded-[29.2%] object-cover shadow-md",
          className
        )}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex aspect-square w-full items-center justify-center rounded-[29.2%] shadow-md",
        TINTS[tint],
        className
      )}
    >
      {Icon ? <Icon className="size-1/2 text-white" strokeWidth={1.9} /> : null}
    </span>
  )
}

/**
 * One destination as a home-screen icon: the face, then a label under it.
 *
 * Labels are the reference's 13px semibold, but allowed a second line — the
 * dashboard's four labels are one word each, and a section's doors ("Early
 * warning", "Payment methods") are not. Truncating them to "Early…" would
 * trade the whole reason for a label for the sake of a straight baseline.
 */
export function AppTile({
  label,
  href,
  art,
  icon,
  tint,
  badge,
  face,
}: AppTileItem) {
  return (
    <Link
      href={href}
      className="group focus-visible:ring-ring flex w-full flex-col items-center gap-[6px] rounded-2xl outline-none focus-visible:ring-2"
    >
      <span className="relative block w-full max-w-[64px] transition-transform group-active:scale-95">
        {face ?? <TileFace art={art} icon={icon} tint={tint} />}
        {badge && badge > 0 ? (
          <span className="bg-destructive absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] leading-none font-semibold text-white tabular-nums">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="text-foreground line-clamp-2 max-w-full text-center text-[13px] leading-4 font-semibold text-balance">
        {label}
      </span>
    </Link>
  )
}

/**
 * A section's doors as rows of four icons — the dashboard's quick-actions
 * row, continued for as many rows as the section has destinations.
 *
 * Four across at every phone width, like the home screen. The column gap is
 * 16px rather than the dashboard's 32px so a two-line Arabic label gets the
 * width it needs; the icon itself stays capped at the dashboard's ~64px, so
 * the tiles here are the same size as the ones a reader just tapped to arrive.
 */
export function AppTileGrid({
  items,
  className,
}: {
  items: AppTileItem[]
  className?: string
}) {
  if (items.length === 0) return null

  return (
    <ul className={cn("grid grid-cols-4 gap-x-4 gap-y-5", className)}>
      {items.map((item) => (
        <li key={item.key} className="flex min-w-0 justify-center">
          <AppTile {...item} />
        </li>
      ))}
    </ul>
  )
}

/**
 * A date as the phone's Calendar icon: the weekday small and red across the
 * top, the day of the month large under it — the dashboard's "Today" widget at
 * row-art size. For lists of dated things (exams, trips, instalments), where a
 * generic glyph would say nothing and the date is the first thing read.
 *
 * Formatting is the caller's: pass the already-localized weekday and day so
 * this stays a server-safe leaf with no locale logic of its own.
 */
export function DateTile({
  weekday,
  day,
  className,
}: {
  weekday: string
  day: string | number
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "bg-background flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-[29.2%] shadow-md ring-1 ring-black/5 dark:ring-white/10",
        className
      )}
    >
      <span className="text-[10px] leading-3 font-semibold text-[#FF3B30]">
        {weekday}
      </span>
      <span className="text-foreground text-[22px] leading-7 font-light tabular-nums">
        {day}
      </span>
    </span>
  )
}
