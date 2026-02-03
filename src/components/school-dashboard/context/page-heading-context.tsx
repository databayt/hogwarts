"use client"

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
