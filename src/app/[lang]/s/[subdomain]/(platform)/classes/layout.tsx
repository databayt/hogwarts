import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ClassesLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.classes

  // Define classes page navigation
  const classesPages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/classes` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Classes'}
        className="text-start max-w-none"
      />
      <PageNav pages={classesPages} />
      {children}
    </div>
  )
}
