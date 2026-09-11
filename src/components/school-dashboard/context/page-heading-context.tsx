"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react"

interface PageHeadingData {
  title: string
  description?: string
  /**
   * Drop the heading on phones while keeping it from `md` up. The dashboard
   * uses it: below `md` the page opens with the home block ported from the
   * Android app, which has no page title above it.
   */
  hideOnMobile?: boolean
}

interface PageHeadingContextValue {
  heading: PageHeadingData | null
  setHeading: (heading: PageHeadingData) => void
  clearHeading: () => void
}

const PageHeadingContext = createContext<PageHeadingContextValue | undefined>(
  undefined
)

export function PageHeadingProvider({ children }: { children: ReactNode }) {
  const [heading, setHeadingState] = useState<PageHeadingData | null>(null)

  const setHeading = useCallback((newHeading: PageHeadingData) => {
    setHeadingState(newHeading)
  }, [])

  const clearHeading = useCallback(() => {
    setHeadingState(null)
  }, [])

  return (
    <PageHeadingContext.Provider value={{ heading, setHeading, clearHeading }}>
      {children}
    </PageHeadingContext.Provider>
  )
}

export function usePageHeading() {
  const context = useContext(PageHeadingContext)
  if (!context) {
    throw new Error("usePageHeading must be used within PageHeadingProvider")
  }
  return context
}
