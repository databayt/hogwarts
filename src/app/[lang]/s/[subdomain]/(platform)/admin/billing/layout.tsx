import { type Locale } from '@/components/internationalization/config'
import PageHeader from '@/components/atom/page-header'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function BillingLayout({ children, params }: Props) {
  const { lang } = await params

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage billing and your subscription plan."
        className="text-start max-w-none"
      />
      {children}
    </div>
  )
}
