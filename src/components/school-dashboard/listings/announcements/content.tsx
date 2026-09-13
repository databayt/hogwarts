// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"
import { SearchParams } from "nuqs/server"

import type { Role } from "@/lib/rbac/types"
import { getTenantContext } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { type AnnouncementRow } from "@/components/school-dashboard/listings/announcements/columns"
import { announcementsSearchParams } from "@/components/school-dashboard/listings/announcements/list-params"
import { getUIConfigForRole } from "@/components/school-dashboard/listings/announcements/permissions"
import {
  buildViewerAudienceWhere,
  getAnnouncementsList,
  isAudienceOnlyRole,
} from "@/components/school-dashboard/listings/announcements/queries"
import { AnnouncementsTable } from "@/components/school-dashboard/listings/announcements/table"
import { localize } from "@/components/translation/localize"

interface Props {
  searchParams: Promise<SearchParams>
  dictionary: Dictionary["school"]
  lang: Locale
}

export default async function AnnouncementsContent({
  searchParams,
  dictionary,
  lang,
}: Props) {
  const sp = await announcementsSearchParams.parse(await searchParams)
  const [{ schoolId, role }, session] = await Promise.all([
    getTenantContext(),
    auth(),
  ])
  const permissions = getUIConfigForRole(role as Role | null | undefined)
  const t = dictionary.announcements

  let data: AnnouncementRow[] = []
  let total = 0

  if (schoolId) {
    try {
      // Staff see the whole school list; a student or guardian sees only the
      // published notices addressed to them (school, their role, their classes).
      const userId = session?.user?.id
      const audience = isAudienceOnlyRole(role as UserRole | null)
        ? userId
          ? await buildViewerAudienceWhere(schoolId, userId, role as UserRole)
          : { id: { in: [] } }
        : undefined

      const { rows, count } = await getAnnouncementsList(
        schoolId,
        {
          title: sp.title,
          scope: sp.scope,
          published: sp.published,
          page: sp.page,
          perPage: sp.perPage,
          sort: sp.sort,
        },
        audience
      )

      // ONE batched translation pass for the whole page (replaces N×getText).
      const localized = await localize("Announcement", rows, { schoolId, lang })

      // Map results to table format
      // CRITICAL FIX: Handle null/undefined dates to prevent server-side exceptions
      data = localized.map((a) => ({
        id: a.id,
        title: a.title ?? "",
        lang: a.lang,
        scope: a.scope,
        published: a.published,
        // Safe date serialization - fallback to current time if null/undefined
        createdAt: a.createdAt
          ? new Date(a.createdAt).toISOString()
          : new Date().toISOString(),
        createdBy: a.createdBy,
        priority: a.priority,
        pinned: a.pinned,
        featured: a.featured,
      }))

      total = count
    } catch (error) {
      // Log error for debugging but don't crash the page
      console.error(
        "[AnnouncementsContent] Error fetching announcements:",
        error
      )
      // Return empty data - page will show "No announcements" instead of crashing
      data = []
      total = 0
    }
  }

  return (
    <div className="space-y-6">
      <AnnouncementsTable
        initialData={data}
        total={total}
        dictionary={t}
        lang={lang}
        perPage={sp.perPage}
        permissions={permissions}
      />
    </div>
  )
}
