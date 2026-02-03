import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AdmissionLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.admission

  const admissionPages: PageNavItem[] = [
    { name: d?.nav?.campaigns || "Campaigns", href: `/${lang}/admission` },
    {
      name: d?.nav?.applications || "Applications",
      href: `/${lang}/admission/applications`,
    },
    {
      name: d?.nav?.meritList || "Merit List",
      href: `/${lang}/admission/merit`,
    },
    {
      name: d?.nav?.enrollment || "Enrollment",
      href: `/${lang}/admission/enrollment`,
    },
    {
      name: d?.nav?.settings || "Settings",
      href: `/${lang}/admission/settings`,
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Admission"} />
      <PageNav pages={admissionPages} />
      {children}
    </div>
  )
}
