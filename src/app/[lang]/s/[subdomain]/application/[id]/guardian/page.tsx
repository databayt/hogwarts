// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import GuardianContent from "@/components/school-marketing/application/guardian/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const steps = d?.school?.admission?.apply?.steps
  return {
    title: `${steps?.guardian?.title ?? "Guardian Information"} | ${lang === "ar" ? "التقديم" : "Apply"}`,
    description:
      steps?.guardian?.description ??
      "Enter guardian and parent information for your application.",
  }
}

export default async function GuardianPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <GuardianContent dictionary={dictionary} />
}
