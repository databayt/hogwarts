// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getTabsForRole,
  type LumosNavDictionary,
} from "@/components/lumos/permissions"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

/**
 * Section heading + tab strip for the lumos app surfaces.
 *
 * Rendered from the dashboard and settings layouts rather than from
 * lumos/layout.tsx, so /lumos itself keeps its own hero without dashboard
 * chrome stacked on top of it.
 */
export async function LumosSectionNav({ lang }: { lang: string }) {
  const [dictionary, session] = await Promise.all([
    getDictionary(lang as Locale),
    auth(),
  ])
  const d = dictionary?.lumos
  const role = (session?.user?.role ?? null) as Role | null

  const pages = getTabsForRole(role, lang, d as LumosNavDictionary | undefined)

  return (
    <>
      <PageHeadingSetter title={d?.home?.title || "Lumos"} />
      {pages.length > 0 && <PageNav pages={pages} className="print:hidden" />}
    </>
  )
}
