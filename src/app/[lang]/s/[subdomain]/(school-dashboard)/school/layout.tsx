// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Role } from "@/lib/rbac/types"
import { PageNav } from "@/components/atom/page-nav"
import { AdminAuthGuard } from "@/components/auth/admin-auth-guard"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"
import { getTabsForRole } from "@/components/school-dashboard/school/permissions"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function SchoolLayout({ children, params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.schoolAdmin
  const role = (session?.user?.role ?? null) as Role | null

  const schoolPages = getTabsForRole(role, lang, d)

  return (
    <AdminAuthGuard lang={lang as Locale}>
      <div className="space-y-6">
        <PageHeadingSetter title={d?.title || "School"} />
        <PageNav pages={schoolPages} />
        {children}
      </div>
    </AdminAuthGuard>
  )
}
