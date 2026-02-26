// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { DomainRequestContent } from "@/components/school-dashboard/settings/domain-request/content"

export const metadata: Metadata = {
  title: "Domain Settings | Hogwarts",
  description: "Manage your school custom domain",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function DomainSettings({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <DomainRequestContent dictionary={dictionary} lang={lang} />
}
