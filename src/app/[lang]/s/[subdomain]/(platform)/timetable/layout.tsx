import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TimetableLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.timetable

  // Define timetable page navigation
  const timetablePages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/timetable` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Timetable'}
        className="text-start max-w-none"
      />
      <PageNav pages={timetablePages} />
      {children}
    </div>
  )
}
