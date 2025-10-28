import { auth } from '@/auth'
import MyBanksContent from '@/components/platform/finance/banking/my-banks/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

export default async function MyBanksPage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const session = await auth()
  const dictionary = await getDictionary(lang)

  if (!session?.user) {
    return null // Layout handles redirect
  }

  return (
    <MyBanksContent
      user={session.user}
      dictionary={dictionary.banking}
      lang={lang}
    />
  )
}