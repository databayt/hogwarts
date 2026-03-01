// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigDiscountContent } from "@/components/school-dashboard/school/configuration/config-discount-content"

export const metadata = { title: "Configuration: Discounts" }

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function DiscountPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ConfigDiscountContent dictionary={dictionary} />
}
