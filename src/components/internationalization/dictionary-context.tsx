"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { createContext, useContext } from "react"

import type { Dictionary } from "./dictionaries"

const DictionaryContext = createContext<Dictionary | null>(null)

export { DictionaryContext }

export function DictionaryProvider({
  dictionary,
  children,
}: {
  dictionary: Dictionary
  children: React.ReactNode
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  )
}

/**
 * Non-throwing variant of `useDictionaryContext`.
 *
 * Shared primitives (DataTable, load-more controls) render both inside and
 * outside a DictionaryProvider — tests, Storybook, and standalone previews have
 * no provider. Those call sites need to degrade to a built-in locale fallback
 * rather than crash, so they read the dictionary through this hook.
 */
export function useOptionalDictionary(): Dictionary | null {
  return useContext(DictionaryContext)
}

export function useDictionaryContext() {
  const dict = useContext(DictionaryContext)
  if (!dict) {
    throw new Error(
      "useDictionaryContext must be used within a DictionaryProvider"
    )
  }
  return dict
}
