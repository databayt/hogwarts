// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// NOTE: render-time read, not a "use server" action — imported only by server
// components. Takes primitives so React's cache() can actually dedupe it.
import { cache } from "react"

import { localize } from "@/components/translation/localize"
import type { Lang } from "@/components/translation/types"

/**
 * A subject's own name in the viewer's language — what a breadcrumb or heading
 * should show where the URL only carries a slug like `sd-g10-literature`.
 *
 * Takes the id and name the caller already loaded, so the lesson page pays no
 * extra query; the translation goes through the same `localize("Subject", …)`
 * cache key the course page uses, so the two share one cached string.
 */
export const getSubjectDisplayName = cache(async function getSubjectDisplayName(
  subjectId: string,
  subjectName: string,
  schoolId: string | null,
  lang: string
): Promise<string> {
  const [localized] = await localize(
    "Subject",
    [{ id: subjectId, name: subjectName }],
    {
      // No tenant means no per-school cache; the subject id keeps the key stable.
      schoolId: schoolId || subjectId,
      lang: (lang === "en" ? "en" : "ar") as Lang,
    }
  )
  return localized?.name || subjectName
})
