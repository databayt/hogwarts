"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { DictionaryContext } from "../dictionary-context"
import { dictionary } from "./en"

/**
 * The English dictionary, provided from a static module — see
 * ../locale-dictionary-provider.tsx for why it is not a prop.
 */
export function DictionaryProviderEn({
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
