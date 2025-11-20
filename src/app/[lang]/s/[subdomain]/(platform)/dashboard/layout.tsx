import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import PageHeader from '@/components/atom/page-header'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function DashboardLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.school?.dashboard

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Overview'}
        className="text-start max-w-none"
      />
      {children}
    </div>
  )
}
