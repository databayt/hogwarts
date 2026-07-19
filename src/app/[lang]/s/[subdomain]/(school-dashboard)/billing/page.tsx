// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import BillingContent from "@/components/school-dashboard/billing/content"

interface Props {
  params: Promise<{
    lang: Locale
    subdomain: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary?.school?.billing?.title || "Billing | Hogwarts",
    description: "Manage your subscription and billing information",
  }
}

export default async function BillingPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <BillingContent dictionary={dictionary} lang={lang} />
}
