import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function ReceiptLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.receipt

  // Define receipt page navigation
  const receiptPages: PageNavItem[] = [
    { name: 'Overview', href: `/${lang}/finance/receipt` },
    { name: 'Generate Receipt', href: `/${lang}/finance/receipt/generate` },
    { name: 'Receipt History', href: `/${lang}/finance/receipt/history` },
    { name: 'Templates', href: `/${lang}/finance/receipt/templates` },
    { name: 'Manage Plans', href: `/${lang}/finance/receipt/manage-plan` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Receipt'}
        className="text-start max-w-none"
      />
      <PageNav pages={receiptPages} />
      {children}
    </div>
  )
}