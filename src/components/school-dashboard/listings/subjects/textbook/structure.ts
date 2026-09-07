// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { normalizeStructure, type StructurePages } from "./spine"

/**
 * The authoring `structure.json` published beside a textbook's twin on the
 * CDN (`catalog/textbooks/<slug>/structure.json`). Optional: when it is
 * missing the reader anchors the contents by name matching instead.
 */
export async function fetchStructure(
  url: string
): Promise<StructurePages | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    return normalizeStructure(await res.json())
  } catch {
    return null
  }
}
