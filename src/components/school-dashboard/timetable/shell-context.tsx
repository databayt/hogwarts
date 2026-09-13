"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, useContext } from "react"

import { TimetableSurfaceSkeleton } from "./views/grid-skeleton"

/**
 * Which SHAPE the timetable's loading placeholder takes — the one-column
 * student surface or the admin week grid with its two comboboxes.
 *
 * The layout knows the role (it read the session) and the `loading.tsx`
 * boundary does not (it must render instantly, so it cannot). Carrying the
 * answer down through context lets the route keep a real `loading.tsx` —
 * which is what makes the sidebar link prefetchable, so a tap draws the
 * skeleton at once instead of waiting a server round-trip for the first
 * pixel — without drawing the five-day week for a phone about to show one
 * column. The provider sits above the boundary in the tree, so the fallback
 * reads the right shape on the server render and in the prefetched payload.
 */
const TimetableShellContext = createContext(false)

export function TimetableShellProvider({
  studentShell,
  children,
}: {
  studentShell: boolean
  children: React.ReactNode
}) {
  return (
    <TimetableShellContext.Provider value={studentShell}>
      {children}
    </TimetableShellContext.Provider>
  )
}

/** The route's loading state: the surface skeleton in the shape the layout chose. */
export function TimetableShellSkeleton() {
  const studentShell = useContext(TimetableShellContext)
  return <TimetableSurfaceSkeleton studentShell={studentShell} />
}
