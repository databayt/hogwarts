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

export default async function InvoiceLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.invoice

  // Define invoice page navigation
  const n = d?.navigation
  const invoicePages: PageNavItem[] = [
    { name: n?.dashboard || "Dashboard", href: `/${lang}/finance/invoice` },
    { name: n?.list || "List", href: `/${lang}/finance/invoice/list` },
    {
      name: n?.createNew || "Create Invoice",
      href: `/${lang}/finance/invoice/invoice/create`,
    },
    {
      name: n?.settings || "Settings",
      href: `/${lang}/finance/invoice/settings`,
    },
    {
      name: n?.onboarding || "Onboarding",
      href: `/${lang}/finance/invoice/onboarding`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Invoice"} />
      <PageNav pages={invoicePages} />
      {children}
    </div>
  )
}
