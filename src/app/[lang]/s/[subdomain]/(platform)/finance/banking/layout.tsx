import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BankingSidebar } from '@/components/platform/finance/banking/shared/sidebar'
import { BankingMobileNav } from '@/components/platform/finance/banking/shared/mobile-nav'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

interface BankingLayoutProps {
  children: React.ReactNode
  params: Promise<{ lang: string; subdomain: string }>
}

export default async function BankingLayout({
  children,
  params,
}: Readonly<BankingLayoutProps>) {
  const { lang } = await params
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const dictionary = await getDictionary(lang as Locale)

  return (
    <div className="flex h-screen w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <BankingSidebar
          user={session.user}
          dictionary={dictionary.banking}
          lang={lang as Locale}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <BankingMobileNav
          user={session.user}
          dictionary={dictionary.banking}
          lang={lang as Locale}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}