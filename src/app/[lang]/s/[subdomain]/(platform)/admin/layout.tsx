import { type Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'
import { PageHeadingSetter } from '@/components/platform/context/page-heading-setter'
import { PageNav, type PageNavItem } from '@/components/atom/page-nav'
import { AdminAuthGuard } from '@/components/auth/admin-auth-guard'

interface Props {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function AdminLayout({ children, params }: Props) {
  const { lang } = await params

  // Authentication is handled by AdminAuthGuard client component
  // This prevents auth() from being called during build time

  const dictionary = await getDictionary(lang as Locale)
  const d = dictionary?.admin

  // Define admin page navigation
  const adminPages: PageNavItem[] = [
    { name: d?.navigation?.overview || 'Overview', href: `/${lang}/admin` },
    { name: d?.navigation?.configuration || 'Config', href: `/${lang}/admin/configuration` },
    { name: d?.navigation?.membership || 'Membership', href: `/${lang}/admin/membership` },
    { name: d?.navigation?.security || 'Security', href: `/${lang}/admin/security` },
    { name: d?.navigation?.reports || 'Reports', href: `/${lang}/admin/reports` },
    { name: d?.navigation?.system || 'System', href: `/${lang}/admin/system` },
    { name: d?.navigation?.integration || 'Integration', href: `/${lang}/admin/integration`, hidden: true },
    { name: d?.navigation?.communication || 'Communication', href: `/${lang}/admin/communication`, hidden: true },
    { name: d?.navigation?.subscription || 'Subscription', href: `/${lang}/admin/subscription`, hidden: true },
    { name: 'Billing', href: `/${lang}/admin/billing` },
  ]

  return (
    <AdminAuthGuard lang={lang as Locale}>
      <div className="space-y-6">
        <PageHeadingSetter
          title={d?.title || 'Admin'}
        />
        <PageNav pages={adminPages} />
        {children}
      </div>
    </AdminAuthGuard>
  )
}
