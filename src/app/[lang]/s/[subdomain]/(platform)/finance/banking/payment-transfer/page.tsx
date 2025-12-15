import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PaymentTransferContent from "@/components/platform/finance/banking/payment-transfer/content"

export default async function PaymentTransferPage({
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
    <PaymentTransferContent
      user={session.user}
      dictionary={dictionary.banking}
      lang={lang}
    />
  )
}
