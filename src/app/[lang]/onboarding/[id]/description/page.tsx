// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import DescriptionContent from "@/components/onboarding/description/content"

export const metadata = {
  title: "School Description | Onboarding",
  description: "Describe your school and what makes it unique.",
}

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function Description({ params }: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <DescriptionContent dictionary={dictionary.school} />
}
