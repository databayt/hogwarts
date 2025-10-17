import { auth } from '@/auth'
import { MyBanksContent } from '@/components/platform/banking/my-banks/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

export default async function MyBanksPage({
  params: { lang },
}: {
  params: { lang: Locale }
}) {
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