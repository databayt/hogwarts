import { PageNav, type PageNavItem } from "@/components/atom/page-nav"
import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PageHeadingSetter } from "@/components/school-dashboard/context/page-heading-setter"

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ExamsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.exams

  // Exams page navigation (6 links)
  const examsPages: PageNavItem[] = [
    { name: d?.nav?.overview || "Overview", href: `/${lang}/exams` },
    { name: d?.nav?.qbank || "QBank", href: `/${lang}/exams/qbank` },
    { name: d?.nav?.generate || "Generate", href: `/${lang}/exams/generate` },
    { name: d?.nav?.mark || "Mark", href: `/${lang}/exams/mark` },
    { name: d?.nav?.record || "Results", href: `/${lang}/exams/result` },
    { name: "Upcoming", href: `/${lang}/exams/upcoming` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter title={d?.pageTitle || "Examinations"} />
      <PageNav pages={examsPages} />

      {children}
    </div>
  )
}
