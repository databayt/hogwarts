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

export default async function ReceiptLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.finance?.receipt

  // Define receipt page navigation
  const n = d?.navigation
  const receiptPages: PageNavItem[] = [
    { name: n?.overview || "Overview", href: `/${lang}/finance/receipt` },
    {
      name: n?.generate || "Generate Receipt",
      href: `/${lang}/finance/receipt/generate`,
    },
    {
      name: n?.history || "Receipt History",
      href: `/${lang}/finance/receipt/history`,
    },
    {
      name: n?.templates || "Templates",
      href: `/${lang}/finance/receipt/templates`,
    },
    {
      name: n?.managePlans || "Manage Plans",
      href: `/${lang}/finance/receipt/manage-plan`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Receipt"} />
      <PageNav pages={receiptPages} />
      {children}
    </div>
  )
}
