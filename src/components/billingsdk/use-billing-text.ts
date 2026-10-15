"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import enConsole from "@/components/internationalization/dictionaries/en/school-console.json"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

export type BillingSdkText = typeof enConsole.billing.sdk

/**
 * Strings for the billing SDK components.
 *
 * Reads `schoolConsole.billing.sdk` from the dictionary in context; outside a
 * dictionary provider (the component demos) it falls back to the English file
 * so the components never render empty labels.
 */
export function useBillingText(): BillingSdkText {
  const dictionary = useDictionaryFallback()
  return (dictionary?.schoolConsole?.billing?.sdk ??
    enConsole.billing.sdk) as BillingSdkText
}
