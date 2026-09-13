// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { getTabsForRole } from "@/components/school-dashboard/listings/announcements/permissions"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AnnouncementsLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.announcements
  const role = (session?.user?.role ?? null) as Role | null

  // Readers (students, guardians) get "All" only; authoring tabs follow role.
  const announcementsPages = getTabsForRole(
    role,
    lang,
    d as unknown as Record<string, string> | undefined
  )

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Announcements"} />
      {announcementsPages.length > 1 && <PageNav pages={announcementsPages} />}
      {children}
    </div>
  )
}
