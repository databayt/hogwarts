import { auth } from '@/auth'
import { PaymentTransferContent } from '@/components/platform/banking/payment-transfer/content'
import { getDictionary } from '@/components/internationalization/dictionaries'
import type { Locale } from '@/components/internationalization/config'

export default async function PaymentTransferPage({
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
    <PaymentTransferContent
      user={session.user}
      dictionary={dictionary.banking}
      lang={lang}
    />
  )
}