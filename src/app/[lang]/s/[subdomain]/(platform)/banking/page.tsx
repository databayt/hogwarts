import { Suspense } from 'react'
import { auth } from '@/auth'
import { BankingDashboardContent } from '@/components/banking/dashboard/content'
import { getDictionary } from '@/components/local/dictionaries'
import type { Locale } from '@/components/local/config'

export default async function BankingDashboardPage({
  searchParams,
  params: { lang },
}: {
  searchParams: { id?: string; page?: string }
  params: { lang: Locale }
}) {
  const session = await auth()
  const dictionary = await getDictionary(lang)

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BankingDashboardContent
        user={session.user}
        searchParams={searchParams}
        dictionary={dictionary.banking}
        lang={lang}
      />
    </Suspense>
  )
}