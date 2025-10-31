import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ExamsLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.exams?.dashboard

  // Define exams page navigation
  const examsPages: PageNavItem[] = [
    {
      name: 'Exams',
      href: `/${lang}/exams`
    },
    {
      name: 'QBank',
      href: `/${lang}/exams/qbank`
    },
    {
      name: 'Generate',
      href: `/${lang}/exams/generate`
    },
    {
      name: 'Mark',
      href: `/${lang}/exams/mark`
    },
    {
      name: 'Result',
      href: `/${lang}/exams/result`
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Exams"
        className="text-start max-w-none"
      />
      <PageNav pages={examsPages} />

      {children}
    </div>
  )
}