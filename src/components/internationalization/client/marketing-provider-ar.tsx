"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { DictionaryContext } from "../dictionary-context"
import { dictionary } from "./marketing-ar"

/**
 * The Arabic marketing dictionary (general file only) — see
 * ../marketing-dictionary-provider.tsx.
 */
export function MarketingDictionaryProviderAr({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DictionaryContext.Provider value={dictionary}>
      {children}
    </DictionaryContext.Provider>
  )
}
