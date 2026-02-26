// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import GuardianContent from "@/components/school-marketing/apply/guardian/content"

export const metadata = {
  title: "Guardian Information | Apply",
  description: "Enter guardian and parent information for your application.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function GuardianPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <GuardianContent dictionary={dictionary} />
}
