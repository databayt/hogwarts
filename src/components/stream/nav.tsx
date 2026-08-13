// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { isRoleIn } from "@/lib/rbac/ui-permissions"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import {
  getTabsForRole,
  LUMOS_ADMIN_ROLES,
  type StreamNavDictionary,
} from "@/components/stream/permissions"
import { getPendingVideos } from "@/components/stream/settings/video-review-actions"

/**
 * Section heading + tab strip for the lumos app surfaces.
 *
 * Rendered from the dashboard and settings layouts rather than from
 * lumos/layout.tsx, so /lumos itself keeps its own hero without dashboard
 * chrome stacked on top of it.
 */
export async function StreamSectionNav({ lang }: { lang: string }) {
  const [dictionary, session] = await Promise.all([
    getDictionary(lang as Locale),
    auth(),
  ])
  const d = dictionary?.stream
  const role = (session?.user?.role ?? null) as Role | null

  // The Review badge is the queue's only ambient signal now that the surface
  // is a route rather than a tab — worth the count for admins, skipped for
  // everyone else. getPendingVideos self-guards role + school.
  const pending = isRoleIn(role, LUMOS_ADMIN_ROLES)
    ? await getPendingVideos()
    : []

  const pages = getTabsForRole(
    role,
    lang,
    d as StreamNavDictionary | undefined,
    pending.length
  )

  return (
    <>
      <PageHeadingSetter title={d?.home?.title || "Lumos"} />
      {pages.length > 0 && <PageNav pages={pages} className="print:hidden" />}
    </>
  )
}
