// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ParentEventsContent } from "@/components/school-dashboard/parent-portal/events/content"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const b = dictionary?.platform?.breadcrumb
  return {
    title: [b?.events, b?.parent].every(Boolean)
      ? [b?.events, b?.parent].join(" - ")
      : "Events | Parent Portal",
    description: "View upcoming school events and manage registrations",
  }
}

export default async function ParentEventsPage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ParentEventsContent lang={lang} />
}
