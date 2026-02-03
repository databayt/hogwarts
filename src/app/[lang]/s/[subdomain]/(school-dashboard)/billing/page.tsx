import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BillingContent from "@/components/school-dashboard/billing/content"

export const metadata: Metadata = {
  title: "Billing | Hogwarts",
  description: "Manage your subscription and billing information",
}

interface Props {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export default async function BillingPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BillingContent dictionary={dictionary} lang={lang} />
}
