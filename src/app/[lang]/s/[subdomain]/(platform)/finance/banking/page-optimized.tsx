import { Suspense } from 'react'
import { Metadata } from 'next'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'
import { BankingDashboardContent } from '@/components/platform/finance/banking/dashboard/content'

// Runtime configuration - Node.js required for Prisma
export const runtime = 'nodejs'

// Route segment config
export const dynamic = 'force-dynamic' // Banking data should always be fresh
export const revalidate = 0 // Disable caching for sensitive financial data
export const fetchCache = 'force-no-store'

// Metadata generation
export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; subdomain: string }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang as Locale)

  return {
    title: dictionary.banking?.title || 'Banking Dashboard',
    description: dictionary.banking?.description || 'Manage your bank accounts and transactions',
    robots: 'noindex, nofollow', // Banking pages should not be indexed
  }
}

// Loading component for better streaming
function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded" />
        ))}
      </div>
    </div>
  )
}

export default async function BankingDashboardPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ id?: string; page?: string }>
  params: Promise<{ lang: string; subdomain: string }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams

  // Auth check - redirect if not authenticated
  const session = await auth()
  if (!session?.user?.id) {
    redirect(`/${lang}/login?callbackUrl=/${lang}/banking`)
  }

  const dictionary = await getDictionary(lang as Locale)

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <BankingDashboardContent
        user={session.user}
        searchParams={resolvedSearchParams}
        dictionary={dictionary.banking}
        lang={lang as Locale}
      />
    </Suspense>
  )
}