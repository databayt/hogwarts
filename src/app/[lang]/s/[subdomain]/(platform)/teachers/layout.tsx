import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function TeachersLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.teachers

  // Define teachers page navigation
  const teachersPages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/teachers` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Teachers'}
        className="text-start max-w-none"
      />
      <PageNav pages={teachersPages} />
      {children}
    </div>
  )
}
