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

  // Grades page navigation (5 links)
  const gradesPages: PageNavItem[] = [
    { name: d?.navAll || 'All', href: `/${lang}/grades` },
    { name: 'Generate', href: `/${lang}/grades/generate` },
    { name: d?.navReports || 'Reports', href: `/${lang}/grades/reports` },
    { name: d?.navAnalytics || 'Analytics', href: `/${lang}/grades/analytics` },
    { name: 'Settings', href: `/${lang}/grades/settings` },
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
