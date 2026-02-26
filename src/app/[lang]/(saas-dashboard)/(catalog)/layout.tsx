// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function CatalogLayout({ children, params }: Props) {
  const { lang } = await params
  // Get pending approval count for badge (across all content types)
  const [questionPending, bookPending] = await Promise.all([
    db.catalogQuestion.count({ where: { approvalStatus: "PENDING" } }),
    db.catalogBook.count({ where: { approvalStatus: "PENDING" } }),
  ])
  const pendingCount = questionPending + bookPending

  const catalogPages: PageNavItem[] = [
    { name: "Catalog", href: `/${lang}/catalog` },
    { name: "Questions", href: `/${lang}/catalog/questions` },
    { name: "Materials", href: `/${lang}/catalog/materials` },
    { name: "Assignments", href: `/${lang}/catalog/assignments` },
    { name: "Books", href: `/${lang}/catalog/books` },
    {
      name: pendingCount > 0 ? `Approvals (${pendingCount})` : "Approvals",
      href: `/${lang}/catalog/approvals`,
    },
    { name: "Analytics", href: `/${lang}/catalog/analytics` },
  ]

  return (
    <>
      <PageNav pages={catalogPages} />
      {children}
    </>
  )
}
