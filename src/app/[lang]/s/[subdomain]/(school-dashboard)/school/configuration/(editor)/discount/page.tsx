// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ConfigDiscountContent } from "@/components/school-dashboard/school/configuration/config-discount-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title:
      dictionary?.school?.schoolAdmin?.configSections?.discount?.title ||
      "Configuration: Discounts",
  }
}

export default async function DiscountPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <ConfigDiscountContent dictionary={dictionary} />
}
