// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PaymentTransferContent from "@/components/school-dashboard/finance/banking/payment-transfer/content"

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
