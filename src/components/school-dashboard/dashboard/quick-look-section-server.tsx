// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { getQuickLookData } from "./actions"
import { QuickLookSection } from "./quick-look-section"

export interface QuickLookSectionServerProps {
  locale: string
  subdomain: string
}

/**
 * Server component wrapper for QuickLookSection
 * Fetches real data from database and passes to client component
 */
export async function QuickLookSectionServer({
  locale,
  subdomain,
}: QuickLookSectionServerProps) {
  let data

  try {
    data = await getQuickLookData(locale)
  } catch (error) {
    console.error("[QuickLookSectionServer] Error fetching data:", error)
    // Return client component with empty data on error
    data = undefined
  }

  return <QuickLookSection locale={locale} subdomain={subdomain} data={data} />
}
