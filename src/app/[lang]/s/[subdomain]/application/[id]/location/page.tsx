// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LocationContent from "@/components/school-marketing/application/location/content"

export const metadata = {
  title: "Location | Apply",
  description: "Enter your residential address for your application.",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function LocationPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <LocationContent dictionary={dictionary} />
}
