import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function SubjectsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
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
      <PageHeadingSetter
        title={d?.title || 'Subjects'}
      />
      <PageNav pages={subjectsPages} />
      {children}
    </div>
  )
}
