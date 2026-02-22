"use client"

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react"

interface LoadingContextType {
  isContentReady: boolean
  setContentReady: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isContentReady, setIsContentReady] = useState(false)
  const setContentReady = useCallback(() => setIsContentReady(true), [])

  return (
    <LoadingContext.Provider value={{ isContentReady, setContentReady }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider")
  }
  return context
}
