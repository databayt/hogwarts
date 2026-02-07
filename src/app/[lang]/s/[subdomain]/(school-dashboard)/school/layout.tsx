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
  const isArabic = lang === "ar"

  // Flat navigation structure with inline translations
  const schoolPages: PageNavItem[] = [
    { name: isArabic ? "نظرة عامة" : "Overview", href: `/${lang}/school` },
    {
      name: isArabic ? "الإعدادات" : "Configuration",
      href: `/${lang}/school/configuration`,
    },
    {
      name: isArabic ? "الأعضاء" : "Membership",
      href: `/${lang}/school/membership`,
    },
    {
      name: isArabic ? "التواصل" : "Communication",
      href: `/${lang}/school/communication`,
    },
    {
      name: isArabic ? "الفوترة" : "Billing",
      href: `/${lang}/school/billing`,
    },
    {
      name: isArabic ? "الأمان" : "Security",
      href: `/${lang}/school/security`,
    },
    {
      name: isArabic ? "التقارير" : "Reports",
      href: `/${lang}/school/reports`,
    },
    { name: isArabic ? "إدخال جماعي" : "Bulk", href: `/${lang}/school/bulk` },
    {
      name: isArabic ? "التحليل" : "Analysis",
      href: `/${lang}/school/analysis`,
    },
  ]

  return (
    <AdminAuthGuard lang={lang as Locale}>
      <div className="space-y-6">
        <PageHeadingSetter title={isArabic ? "المدرسة" : "School"} />
        <PageNav pages={schoolPages} />
        {children}
      </div>
    </AdminAuthGuard>
  )
}
