import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function LessonsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.lessons

  // Define lessons page navigation
  const lessonsPages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/lessons` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Lessons'}
        className="text-start max-w-none"
      />
      <PageNav pages={lessonsPages} />
      {children}
    </div>
  )
}
