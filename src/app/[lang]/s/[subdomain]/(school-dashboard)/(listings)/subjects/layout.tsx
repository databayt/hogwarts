import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function SubjectsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.subjects

  const isAr = lang === "ar"
  const subjectsPages: PageNavItem[] = [
    { name: d?.allSubjects || "All", href: `/${lang}/subjects` },
    {
      name: isAr ? "ابتدائي" : "Elementary",
      href: `/${lang}/subjects/elementary`,
    },
    { name: isAr ? "متوسط" : "Middle", href: `/${lang}/subjects/middle` },
    { name: isAr ? "ثانوي" : "High", href: `/${lang}/subjects/high` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.title || "Subjects"} />
      <PageNav pages={subjectsPages} />
      {children}
    </div>
  )
}
