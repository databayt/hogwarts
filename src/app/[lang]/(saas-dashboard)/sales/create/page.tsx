// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CreateLeadContent } from "@/components/saas-dashboard/sales/create/content"

export const metadata: Metadata = {
  title: "Sales | New Lead",
  description: "Create a new platform-pipeline lead",
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CreateLeadPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CreateLeadContent dictionary={dictionary.sales} lang={lang} />
}
