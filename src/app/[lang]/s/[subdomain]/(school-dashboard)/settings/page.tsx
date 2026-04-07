// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { EnhancedSettingsContent } from "@/components/school-dashboard/settings/content-enhanced"
import { SettingsErrorBoundary } from "@/components/school-dashboard/settings/error-boundary"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  return {
    title: dictionary.school.settings?.title || "Settings",
    description:
      dictionary.school.settings?.description ||
      "Manage school settings, users, roles, and permissions",
  }
}

export default async function Page({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return (
    <SettingsErrorBoundary dictionary={dictionary.school}>
      <EnhancedSettingsContent dictionary={dictionary} lang={lang} />
    </SettingsErrorBoundary>
  )
}
