import { auth } from '@/auth'
import { TransactionHistoryContent } from '@/components/platform/banking/transaction-history/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

export default async function TransactionHistoryPage({
  searchParams,
  params: { lang },
}: {
  searchParams: { page?: string; accountId?: string }
  params: { lang: Locale }
}) {
  const session = await auth()
  const dictionary = await getDictionary(lang)

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <TransactionHistoryContent
      user={session.user}
      searchParams={searchParams}
      dictionary={dictionary.banking}
      lang={lang}
    />
  )
}