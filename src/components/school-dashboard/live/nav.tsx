// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

import { getTabsForRole } from "./list-permissions"

/**
 * Section heading + tab strip for the live surfaces.
 *
 * Rendered by the `(app)` route-group layout for the managed pages and by
 * the `/live` landing page itself, above its hero — the same arrangement as
 * `/school`, whose strip sits over its overview. The landing used to go
 * without it, which read as a page whose navigation had been removed.
 */
export async function LiveSectionNav({ lang }: { lang: string }) {
  const [dictionary, session] = await Promise.all([
    getDictionary(lang as Locale),
    auth(),
  ])
  const d = dictionary?.school?.liveClasses
  const role = (session?.user?.role ?? null) as Role | null

  const pages = getTabsForRole(role, lang, d)

  return (
    <>
      <PageHeadingSetter title={d?.title} />
      {pages.length > 0 && <PageNav pages={pages} className="print:hidden" />}
    </>
  )
}
