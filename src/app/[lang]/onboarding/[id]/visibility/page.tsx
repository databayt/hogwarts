// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import VisibilityContent from "@/components/onboarding/visibility/content"

export const metadata = {
  title: "Visibility | Onboarding",
  description: "Set your school's visibility settings.",
}

interface Props {
  params: Promise<{ lang: Locale; id: string }>
}

export default async function Visibility({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return <VisibilityContent dictionary={dictionary} lang={lang} id={id} />
}
