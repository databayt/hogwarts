// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function SalaryLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.salary

  // Define salary page navigation
  const n = d?.navigation
  const salaryPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/finance/salary` },
    {
      name: n?.structure || "Salary Structure",
      href: `/${lang}/finance/salary/structure`,
    },
    { name: n?.slips || "Salary Slips", href: `/${lang}/finance/salary/slips` },
    {
      name: n?.increments || "Increments",
      href: `/${lang}/finance/salary/increments`,
    },
    {
      name: n?.advances || "Advances",
      href: `/${lang}/finance/salary/advances`,
    },
    { name: n?.reports || "Reports", href: `/${lang}/finance/salary/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Salary"} />
      <PageNav pages={salaryPages} />
      {children}
    </div>
  )
}
