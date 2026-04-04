// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

const ADMIN_ROLES = new Set([
  "ADMIN",
  "ACCOUNTANT",
  "DEVELOPER",
  "STAFF",
  "TEACHER",
])

export default async function FeesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const session = await auth()
  const role = session?.user?.role || "USER"
  const d = (dictionary as any)?.finance?.fees as
    | Record<string, any>
    | undefined

  const n = d?.navigation
  const isAdmin = ADMIN_ROLES.has(role)

  const feesPages: PageNavItem[] = isAdmin
    ? [
        { name: n?.overview || "Overview", href: `/${lang}/finance/fees` },
        {
          name: n?.feeStructure || "Fee Structures",
          href: `/${lang}/finance/fees/structures`,
        },
        {
          name: n?.assignments || "Assignments",
          href: `/${lang}/finance/fees/assignments`,
        },
        {
          name: n?.payments || "Payments",
          href: `/${lang}/finance/fees/payments`,
        },
        {
          name: n?.scholarships || "Scholarships",
          href: `/${lang}/finance/fees/scholarships`,
        },
        {
          name: n?.fines || "Fines",
          href: `/${lang}/finance/fees/fines`,
        },
        {
          name: n?.reports || "Reports",
          href: `/${lang}/finance/fees/reports`,
        },
      ]
    : [
        {
          name: n?.myFees || "My Fees",
          href: `/${lang}/finance/fees/my`,
        },
      ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Fees"} />
      <PageNav pages={feesPages} />
      {children}
    </div>
  )
}
