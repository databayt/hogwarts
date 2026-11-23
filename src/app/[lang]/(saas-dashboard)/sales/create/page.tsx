// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { CreateLeadContent } from "@/components/saas-dashboard/sales/create/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.sales, b?.create].every(Boolean)
      ? [b?.sales, b?.create].join(" - ")
      : "Sales | New Lead",
    description: "Create a new platform-pipeline lead",
  }
}

interface Props {
  params: Promise<{ lang: Locale }>
}

export default async function CreateLeadPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return <CreateLeadContent dictionary={dictionary.sales} lang={lang} />
}
