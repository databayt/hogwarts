import { getDictionary } from '@/components/internationalization/dictionaries'
import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function InvoiceLayout({ children, params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.finance?.invoice

  // Define invoice page navigation
  const invoicePages: PageNavItem[] = [
    { name: 'Dashboard', href: `/${lang}/finance/invoice` },
    { name: 'List', href: `/${lang}/finance/invoice/list` },
    { name: 'Create Invoice', href: `/${lang}/finance/invoice/invoice/create` },
    { name: 'Settings', href: `/${lang}/finance/invoice/settings` },
    { name: 'Onboarding', href: `/${lang}/finance/invoice/onboarding` },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={d?.title || 'Invoice'}
        className="text-start max-w-none"
      />
      <PageNav pages={invoicePages} />
      {children}
    </div>
  )
}