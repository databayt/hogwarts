// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Phone class recipes for the attendance sub-pages.
 *
 * The vocabulary of the phone dashboard (/dashboard, /library, /lumos, /live)
 * applied to pages built from bordered cards: a row of stat cards reads as ONE
 * grey panel two across, split by 1px hairlines (the gap lets the border
 * colour through), and section cards sit on the same grey without a border.
 *
 * Every class here is `max-md:` — md and up render exactly as before — so a
 * recipe is always ADDED next to a component's own classes, never swapped in.
 * `core/attendance-stats.tsx` and `finance/lib/dashboard-components.tsx` carry
 * the same recipe inline.
 */
export const phone = {
  /** On the grid that holds a row of stat cards. A lone last cell spans the row. */
  panel:
    "max-md:bg-border max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl max-md:[&>*:last-child:nth-child(odd)]:col-span-2",
  /** On each stat Card inside `panel`. */
  cell: "max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0 max-md:shadow-none",
  /** On the stat Card's header (label row). */
  cellHead: "max-md:px-4 max-md:pt-4 max-md:pb-1",
  /** On the stat label. Add `max-md:text-muted-foreground` unless it carries a tone. */
  cellLabel: "max-md:line-clamp-1 max-md:text-xs max-md:font-normal",
  /** On the stat Card's content. */
  cellBody: "max-md:px-4 max-md:pb-4",
  /** On the figure. */
  cellValue:
    "max-md:text-lg max-md:leading-7 max-md:font-bold max-md:tabular-nums",
  /** On a section / content Card. */
  card: "max-md:bg-muted max-md:border-0 max-md:shadow-none",
  /** On an input, select trigger or textarea that now sits on a grey card. */
  field: "max-md:bg-background",
  /** On a button that should read as the reference's pill. */
  pill: "max-md:h-10 max-md:rounded-full max-md:px-5",
} as const
