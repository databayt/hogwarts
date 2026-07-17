// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import {
  getAnnouncementConfig,
  getAnnouncementTemplates,
} from "@/components/school-dashboard/listings/announcements/actions"
import { AnnouncementConfigForm } from "@/components/school-dashboard/listings/announcements/config-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)

  return {
    title: `${dictionary.school.announcements.navSettings} - ${dictionary.school.announcements.title}`,
    description: dictionary.school.announcements.description,
  }
}

export default async function AnnouncementsSettingsPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.announcements
  const c = d?.config

  // Fetch config and templates in parallel
  const [configResult, templatesResult] = await Promise.all([
    getAnnouncementConfig(),
    getAnnouncementTemplates(),
  ])

  if (!configResult.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-destructive">{c?.loadFailed}</p>
        <p className="text-muted-foreground mt-2 text-sm">
          {configResult.error}
        </p>
      </div>
    )
  }

  const config = configResult.data
  const templates = templatesResult.success ? templatesResult.data : []

  // The form resolves every label off this section itself, so there is no
  // per-page label mapping to keep in sync with the config route.
  return (
    <AnnouncementConfigForm
      initialConfig={config}
      templates={templates}
      dictionary={d}
    />
  )
}
