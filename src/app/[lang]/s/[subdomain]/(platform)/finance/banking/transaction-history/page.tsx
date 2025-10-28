import { auth } from '@/auth'
import { TransactionHistoryContent } from '@/components/platform/finance/banking/transaction-history/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

export default async function TransactionHistoryPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string; accountId?: string }>
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
    <TransactionHistoryContent
      user={session.user}
      searchParams={resolvedSearchParams}
      dictionary={dictionary.banking}
      lang={lang as Locale}
    />
  )
}