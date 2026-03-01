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

export default async function PayrollLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.payroll

  // Define payroll page navigation
  const n = d?.navigation
  const payrollPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/finance/payroll` },
    {
      name: n?.processing || "Payroll Processing",
      href: `/${lang}/finance/payroll/processing`,
    },
    {
      name: n?.history || "Payroll History",
      href: `/${lang}/finance/payroll/history`,
    },
    {
      name: n?.deductions || "Deductions",
      href: `/${lang}/finance/payroll/deductions`,
    },
    {
      name: n?.benefits || "Benefits",
      href: `/${lang}/finance/payroll/benefits`,
    },
    { name: n?.reports || "Reports", href: `/${lang}/finance/payroll/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Payroll"} />
      <PageNav pages={payrollPages} />
      {children}
    </div>
  )
}
