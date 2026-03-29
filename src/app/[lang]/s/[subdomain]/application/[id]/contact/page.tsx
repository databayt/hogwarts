// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ContactContent from "@/components/school-marketing/application/contact/content"

interface Props {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const d = await getDictionary(lang)
  const steps = d?.school?.admission?.apply?.steps
  return {
    title: `${steps?.contact?.title ?? "Contact Information"} | ${lang === "ar" ? "التقديم" : "Apply"}`,
    description:
      steps?.contact?.description ??
      "Enter your contact information for your application.",
  }
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ContactContent dictionary={dictionary} />
}
