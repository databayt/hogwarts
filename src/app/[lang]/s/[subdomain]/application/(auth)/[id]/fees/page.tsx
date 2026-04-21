// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import FeesContent from "@/components/school-marketing/application/fees/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const steps = d?.school?.admission?.apply?.steps as
    | Record<string, { title?: string; description?: string }>
    | undefined
  return {
    title: `${steps?.fees?.title ?? "School Fees"} | ${lang === "ar" ? "التقديم" : "Apply"}`,
    description:
      steps?.fees?.description ??
      "Review the estimated school fees and available payment methods for your selected grade.",
  }
}

export default async function FeesPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <FeesContent dictionary={dictionary} />
}
