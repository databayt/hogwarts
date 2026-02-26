// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import FinishSetupContent from "@/components/onboarding/finish-setup/content"

export const metadata = {
  title: "Finish Setup | Onboarding",
  description: "Complete your school setup.",
}

interface PageProps {
  params: Promise<{ lang: Locale }>
}

export default async function FinishSetup({ params }: PageProps) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <FinishSetupContent dictionary={dictionary.school} />
}
