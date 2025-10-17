import { ReactNode, Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Locale } from '@/components/local/config'
import { getDictionary } from '@/components/local/dictionaries'

// Runtime - Node.js required for auth
export const runtime = 'nodejs'

// Dynamically import heavy components
const BankingSidebar = dynamic(
  () => import('@/components/banking/shared/sidebar').then(mod => mod.BankingSidebar),
  {
    loading: () => <div className="w-64 h-screen bg-muted animate-pulse" />,
    ssr: true, // Server-side render for SEO
  }
)

const BankingHeader = dynamic(
  () => import('@/components/banking/shared/header').then(mod => mod.BankingHeader),
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
  params: { lang: Locale }
  // Parallel routes (if needed)
  modal?: ReactNode
  sheet?: ReactNode
}

export default async function BankingLayout({
  children,
  params: { lang },
  modal,
  sheet,
}: BankingLayoutProps) {
  // Auth check with redirect
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/banking`)
  }

  // Fetch dictionary for i18n
  const dictionary = await getDictionary(lang)

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user info */}
      <Suspense fallback={<div className="h-16 bg-background border-b" />}>
        <BankingHeader
          user={session.user}
          dictionary={dictionary.banking}
          lang={lang}
        />
      </Suspense>

      <div className="flex">
        {/* Sidebar navigation */}
        <Suspense fallback={<div className="w-64 h-[calc(100vh-4rem)]" />}>
          <BankingSidebar
            dictionary={dictionary.banking}
            lang={lang}
          />
        </Suspense>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto">
          <div className="layout-container py-6">
            {children}
          </div>
        </main>

        {/* Parallel routes for modals/sheets */}
        {modal}
        {sheet}
      </div>
    </div>
  )
}