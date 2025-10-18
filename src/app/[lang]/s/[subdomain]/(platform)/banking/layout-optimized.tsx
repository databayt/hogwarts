import { ReactNode, Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Locale } from '@/components/internationalization/config'
import { getDictionary } from '@/components/internationalization/dictionaries'

// Runtime - Node.js required for auth
export const runtime = 'nodejs'

// Dynamically import heavy components
const BankingSidebar = dynamic(
  () => import('@/components/platform/banking/shared/sidebar').then(mod => mod.BankingSidebar),
  {
    loading: () => <div className="w-64 h-screen bg-muted animate-pulse" />,
    ssr: true, // Server-side render for SEO
  }
)

const BankingMobileNav = dynamic(
  () => import('@/components/platform/banking/shared/mobile-nav').then(mod => mod.BankingMobileNav),
  {
    loading: () => <div className="h-16 bg-background border-b animate-pulse" />,
    ssr: true,
  }
)

// Base metadata for all banking pages
export const metadata: Metadata = {
  title: {
    template: '%s | Banking',
    default: 'Banking Dashboard',
  },
  description: 'Secure banking and financial management platform',
  robots: 'noindex, nofollow', // Banking pages should never be indexed
  other: {
    'X-Robots-Tag': 'noindex, nofollow',
  },
}

interface BankingLayoutProps {
  children: ReactNode
  params: Promise<{ lang: string; subdomain: string }>
  // Parallel routes (if needed)
  modal?: ReactNode
  sheet?: ReactNode
}

export default async function BankingLayout({
  children,
  params,
  modal,
  sheet,
}: BankingLayoutProps) {
  const { lang } = await params

  // Auth check with redirect
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/banking`)
  }

  // Fetch dictionary for i18n
  const dictionary = await getDictionary(lang as Locale)

  return (
    <div className="flex h-screen w-full">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Suspense fallback={<div className="w-64 h-screen bg-muted animate-pulse" />}>
          <BankingSidebar
            user={session.user}
            dictionary={dictionary.banking}
            lang={lang as Locale}
          />
        </Suspense>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <Suspense fallback={<div className="h-16 bg-background border-b animate-pulse" />}>
          <BankingMobileNav
            user={session.user}
            dictionary={dictionary.banking}
            lang={lang as Locale}
          />
        </Suspense>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
        {/* Parallel routes for modals/sheets */}
        {modal}
        {sheet}
      </main>
    </div>
  )
}