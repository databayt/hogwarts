"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useContext, useEffect, useState } from "react"

import type { Dictionary } from "./dictionaries"
import { DictionaryContext } from "./dictionary-context"
import { getDictionaryClient } from "./get-dictionary-client"
import { useLocale } from "./use-locale"

export function useDictionary() {
  // Try server-provided dictionary from context first (instant, no flash)
  const contextDict = useContext(DictionaryContext)

  const { locale } = useLocale()
  const [dictionary, setDictionary] = useState<Dictionary | null>(contextDict)
  const [isLoading, setIsLoading] = useState(!contextDict)

  useEffect(() => {
    // Skip client-side loading if dictionary was provided via context
    if (contextDict) return

    const loadDictionary = async () => {
      try {
        const dict = await getDictionaryClient(locale)
        setDictionary(dict)
      } catch (error) {
        console.error("Failed to load dictionary:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDictionary()
  }, [locale, contextDict])

  // Context dictionary takes priority
  if (contextDict) {
    return { dictionary: contextDict, isLoading: false }
  }

  return { dictionary, isLoading }
}
