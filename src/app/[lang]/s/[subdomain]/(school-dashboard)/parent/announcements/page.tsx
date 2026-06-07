// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { ParentAnnouncementsContent } from "@/components/school-dashboard/parent-portal/announcements/content"

export const metadata: Metadata = {
  title: "Announcements | Parent Portal",
  description: "View school and class announcements for your children",
}

export default async function ParentAnnouncementsPage({
  params,
}: {
  params: Promise<{ lang: Locale; subdomain: string }>
}) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return <ParentAnnouncementsContent lang={lang} dictionary={dictionary} />
}
