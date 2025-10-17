import { auth } from '@/auth'
import { MyBanksContent } from '@/components/banking/my-banks/content'
import { getDictionary } from '@/components/local/dictionaries'
import type { Locale } from '@/components/local/config'

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