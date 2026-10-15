// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { PromotionContent } from "@/components/school-dashboard/grades/promotion"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return { title: dictionary.school.grades.navPromotion }
}

export default async function PromotionPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <PromotionContent dictionary={dictionary} />
}
