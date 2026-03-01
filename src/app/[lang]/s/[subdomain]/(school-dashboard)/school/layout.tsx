// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { AdminAuthGuard } from "@/components/auth/admin-auth-guard"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function SchoolLayout({ children, params }: Props) {
  const { lang } = await params

  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.schoolAdmin
  const n = d?.navigation

  const schoolPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/school` },
    {
      name: n?.configuration || "Configuration",
      href: `/${lang}/school/configuration/title`,
    },
    { name: n?.membership || "Membership", href: `/${lang}/school/membership` },
    {
      name: n?.communication || "Communication",
      href: `/${lang}/school/communication`,
    },
    { name: n?.billing || "Billing", href: `/${lang}/school/billing` },
    { name: n?.security || "Security", href: `/${lang}/school/security` },
    { name: n?.reports || "Reports", href: `/${lang}/school/reports` },
    { name: n?.bulk || "Bulk", href: `/${lang}/school/bulk` },
    { name: n?.analysis || "Analysis", href: `/${lang}/school/analysis` },
  ]

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
