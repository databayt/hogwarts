import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { BankingSidebar } from '@/components/banking/shared/sidebar'
import { BankingMobileNav } from '@/components/banking/shared/mobile-nav'
import { getDictionary } from '@/components/local/dictionaries'
import type { Locale } from '@/components/local/config'

export default async function BankingLayout({
  children,
  params: { lang },
}: {
  children: React.ReactNode
  params: { lang: Locale }
}) {
  const session = await auth()

  if (!session?.user) {
    redirect(`/${lang}/login`)
  }

  const dictionary = await getDictionary(lang)

  return (
    <div className="flex h-screen w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <BankingSidebar
          user={session.user}
          dictionary={dictionary.banking}
          lang={lang}
        />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <BankingMobileNav
          user={session.user}
          dictionary={dictionary.banking}
          lang={lang}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}