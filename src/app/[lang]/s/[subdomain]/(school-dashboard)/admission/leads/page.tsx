// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import LeadsContent from "@/components/school-dashboard/admission/leads/content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: dictionary.school.admission?.leads?.title || "Leads",
    description:
      dictionary.school.admission?.leads?.description ||
      "View and manage admission inquiries and tour bookings",
  }
}

export default async function LeadsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <LeadsContent dictionary={dictionary.school} lang={lang} />
}
