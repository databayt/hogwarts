import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function ExamsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.exams

  // Define exams page navigation with proper i18n
  const examsPages: PageNavItem[] = [
    {
      name: d?.navigation?.manage || 'Manage',
      href: `/${lang}/exams`
    },
    {
      name: d?.navigation?.qbank || 'Question Bank',
      href: `/${lang}/exams/qbank`
    },
    {
      name: d?.navigation?.generate || 'Generate',
      href: `/${lang}/exams/generate`
    },
    {
      name: d?.navigation?.mark || 'Mark',
      href: `/${lang}/exams/mark`
    },
    {
      name: d?.navigation?.result || 'Results',
      href: `/${lang}/exams/result`
    },
    {
      name: d?.navigation?.upcoming || 'Upcoming',
      href: `/${lang}/exams/upcoming`
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.title || 'Exams'}
      />
      <PageNav pages={examsPages} />

      {children}
    </div>
  )
}