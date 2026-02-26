"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Client-side dictionary loader for the chatbot
export async function getClientDictionary(locale: "en" | "ar") {
  try {
    const dictionary = await import(
      `@/components/internationalization/${locale}.json`
    )
    return dictionary.default
  } catch (error) {
    console.error(`Failed to load dictionary for locale: ${locale}`, error)
    // Fallback to English
    const dictionary = await import("@/components/internationalization/en.json")
    return dictionary.default
  }
}
