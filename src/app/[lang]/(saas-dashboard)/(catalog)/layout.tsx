import { db } from "@/lib/db"
import { PageNav, type PageNavItem } from "@/components/atom/page-nav"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}

export default async function CatalogLayout({ children, params }: Props) {
  const { lang } = await params
  // Get pending approval count for badge
  const pendingCount = await db.catalogQuestion.count({
    where: { approvalStatus: "PENDING" },
  })

  const catalogPages: PageNavItem[] = [
    { name: "Catalog", href: `/${lang}/catalog` },
    { name: "Questions", href: `/${lang}/catalog/questions` },
    { name: "Materials", href: `/${lang}/catalog/materials` },
    { name: "Assignments", href: `/${lang}/catalog/assignments` },
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
