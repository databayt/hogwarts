import { Suspense } from 'react'
import { auth } from '@/auth'
import { BankingDashboardContent } from '@/components/platform/banking/dashboard/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

export default async function BankingDashboardPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ id?: string; page?: string }>
  params: Promise<{ lang: string; subdomain: string }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()
  const dictionary = await getDictionary(lang as Locale)

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BankingDashboardContent
        user={session.user}
        searchParams={resolvedSearchParams}
        dictionary={dictionary.banking}
        lang={lang as Locale}
      />
    </Suspense>
  )
}