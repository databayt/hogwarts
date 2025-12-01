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

  // Define exams page navigation using dictionary paths
  const examsPages: PageNavItem[] = [
    {
      name: d?.allExams || 'Manage',
      href: `/${lang}/exams`
    },
    {
      name: d?.dashboard?.blocks?.qbank?.title || 'Question Bank',
      href: `/${lang}/exams/qbank`
    },
    {
      name: d?.dashboard?.blocks?.generate?.title || 'Generate',
      href: `/${lang}/exams/generate`
    },
    {
      name: d?.dashboard?.blocks?.mark?.title || 'Mark',
      href: `/${lang}/exams/mark`
    },
    {
      name: d?.results || 'Results',
      href: `/${lang}/exams/result`
    },
    {
      name: d?.upcomingExams || 'Upcoming',
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