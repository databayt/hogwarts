// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import ApplicationDetailContent from "@/components/school-dashboard/admission/application-detail-content"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string; id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title:
      dictionary.school.admission?.applications?.title || "Application Details",
  }
}

export default async function ApplicationDetailPage({ params }: Props) {
  const { lang, id } = await params
  const dictionary = await getDictionary(lang)

  return (
    <ApplicationDetailContent
      applicationId={id}
      dictionary={dictionary.school}
      lang={lang}
    />
  )
}
