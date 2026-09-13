// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ReactNode } from "react"

import type { ViewMode } from "@/hooks/use-platform-view"

interface ListingViewsProps {
  /** The view the URL (or the desktop default) asks for. */
  view: ViewMode
  /**
   * The view a phone shows while the URL names none — `usePlatformView`'s
   * `phoneView`. Null once the reader has picked a view themselves.
   */
  phoneView?: ViewMode | null
  table: ReactNode
  grid: ReactNode
}

/**
 * Renders a listing's table or grid — and, while the reader has not chosen,
 * BOTH, split by the `md` breakpoint.
 *
 * Why CSS and not a media-query hook: the server cannot know the width, so a
 * hook that picked "grid on phones" after hydration would paint the table
 * first and swap it a frame later — on every visit, on exactly the device the
 * grid is for. Branching with `md:hidden` / `hidden md:block` is how the phone
 * dashboard already splits its own layouts, and it costs one hidden subtree.
 */
export function ListingViews({
  view,
  phoneView,
  table,
  grid,
}: ListingViewsProps) {
  if (!phoneView || phoneView === view) {
    return <>{view === "table" ? table : grid}</>
  }

  return (
    <>
      <div className={view === "table" ? "hidden md:block" : "md:hidden"}>
        {table}
      </div>
      <div className={phoneView === "grid" ? "md:hidden" : "hidden md:block"}>
        {grid}
      </div>
    </>
  )
}
