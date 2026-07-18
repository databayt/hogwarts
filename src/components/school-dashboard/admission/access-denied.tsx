// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Dictionary } from "@/components/internationalization/dictionaries"

/**
 * Localized "Access Denied" panel for role-gated admission tabs.
 *
 * The admission layout already gates the whole /admission/* tree to
 * ADMISSION_VIEW_ROLES; this narrows individual tabs (campaigns, merit,
 * settings, leads) to the same roles getTabsForRole shows them to — closing
 * the direct-URL gap where a role could open a tab its nav hides. Rendered
 * inline (never redirect()) since Next streams pages in parallel with
 * layouts.
 */
export function AdmissionAccessDenied({
  dictionary,
}: {
  dictionary: Dictionary["school"]
}) {
  const t = dictionary.admission?.accessDenied
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center">
      <h2>{t?.title || "Access Denied"}</h2>
      <p className="text-muted-foreground">
        {t?.description || "You do not have permission to access this page."}
      </p>
    </div>
  )
}
