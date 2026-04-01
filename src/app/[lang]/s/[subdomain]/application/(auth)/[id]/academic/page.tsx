// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import AcademicContent from "@/components/school-marketing/application/academic/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const steps = d?.school?.admission?.apply?.steps
  return {
    title: `${steps?.academic?.title ?? "Academic Information"} | ${lang === "ar" ? "التقديم" : "Apply"}`,
    description:
      steps?.academic?.description ??
      "Enter your academic history and preferences.",
  }
}

export default async function AcademicPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <AcademicContent dictionary={dictionary} />
}
