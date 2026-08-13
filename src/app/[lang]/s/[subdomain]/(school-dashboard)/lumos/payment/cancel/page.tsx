// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import PaymentCancelContent from "@/components/stream/payment/cancel-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.stream?.payment?.cancel?.title || "Payment Cancelled",
    description:
      dictionary.stream?.payment?.cancel?.description ||
      "Your payment was cancelled",
  }
}

export default async function StreamPaymentCancelPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <PaymentCancelContent dictionary={dictionary.stream} lang={lang} />
}
