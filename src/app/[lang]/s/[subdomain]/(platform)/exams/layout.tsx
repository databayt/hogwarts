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

  // Define exams page navigation: Overview, Qbank, Generate, Mark, Record
  const examsPages: PageNavItem[] = [
    {
      name: d?.nav?.overview || 'Overview',
      href: `/${lang}/exams`
    },
    {
      name: d?.nav?.qbank || 'Qbank',
      href: `/${lang}/exams/qbank`
    },
    {
      name: d?.nav?.generate || 'Generate',
      href: `/${lang}/exams/generate`
    },
    {
      name: d?.nav?.mark || 'Mark',
      href: `/${lang}/exams/mark`
    },
    {
      name: d?.nav?.record || 'Record',
      href: `/${lang}/exams/result`
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeadingSetter
        title={d?.pageTitle || 'Examinations'}
      />
      <PageNav pages={examsPages} />

      {children}
    </div>
  )
}