import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function SubjectsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.subjects

  // Define subjects page navigation
  const subjectsPages: PageNavItem[] = [
    { name: 'All', href: `/${lang}/subjects` },
    // Future navigation items can be added here:
    // { name: d?.navigation?.departments || 'Departments', href: `/${lang}/subjects/departments`, hidden: true },
    // { name: d?.navigation?.teachers || 'Teachers', href: `/${lang}/subjects/teachers`, hidden: true },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Subjects'}
        className="text-start max-w-none"
      />
      <PageNav pages={subjectsPages} />
      {children}
    </div>
  )
}
