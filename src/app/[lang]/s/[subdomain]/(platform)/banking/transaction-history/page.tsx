import { auth } from '@/auth'
import { TransactionHistoryContent } from '@/components/platform/banking/transaction-history/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

export default async function TransactionHistoryPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{ page?: string; accountId?: string }>
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const resolvedSearchParams = await searchParams
  const session = await auth()
  const dictionary = await getDictionary(lang)

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <TransactionHistoryContent
      user={session.user}
      searchParams={resolvedSearchParams}
      dictionary={dictionary.banking}
      lang={lang}
    />
  )
}