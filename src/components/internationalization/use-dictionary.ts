"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"

import type { Dictionary } from "./dictionaries"
import { getDictionaryClient } from "./get-dictionary-client"
import { useLocale } from "./use-locale"

export function useDictionary() {
  const { locale } = useLocale()
  const [dictionary, setDictionary] = useState<Dictionary | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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
  }, [locale])

  return { dictionary, isLoading }
}
