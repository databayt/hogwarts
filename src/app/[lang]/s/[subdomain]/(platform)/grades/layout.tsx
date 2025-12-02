import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function GradesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.grades

  // Define grades page navigation with i18n
  // Using useful production pages (not filter duplicates - filters are in table columns)
  const gradesPages: PageNavItem[] = [
    { name: d?.navAll || 'All', href: `/${lang}/grades` },
    { name: d?.navAnalytics || 'Analytics', href: `/${lang}/grades/analytics` },
    { name: d?.navReports || 'Reports', href: `/${lang}/grades/reports` },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.title || 'Grades'}
      />
      <PageNav pages={gradesPages} />
      {children}
    </div>
  )
}
