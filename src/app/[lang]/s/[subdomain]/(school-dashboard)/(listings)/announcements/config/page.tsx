// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Metadata } from "next"

import { AnthropicIcons } from "@/components/icons"
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
    title: `${dictionary.school.announcements.navConfig} - ${dictionary.school.announcements.title}`,
    description: dictionary.school.announcements.description,
  }
}

export default async function AnnouncementsConfigPage({ params }: Props) {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const d = dictionary?.school?.announcements

  // Fetch config and templates in parallel
  const [configResult, templatesResult] = await Promise.all([
    getAnnouncementConfig(),
    getAnnouncementTemplates(),
  ])

  // Handle errors
  if (!configResult.success) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">{d?.config?.loadFailed}</p>
        <p className="text-muted-foreground mt-2 text-sm">
          {configResult.error}
        </p>
      </div>
    )
  }

  const config = configResult.data
  const templates = templatesResult.success ? templatesResult.data : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-muted rounded-lg p-3">
          <AnthropicIcons.Gear className="text-muted-foreground h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            {d?.config?.title}
          </h2>
          <p className="text-muted-foreground text-sm">
            {d?.config?.description}
          </p>
        </div>
      </div>

      {/* Config Form — the form resolves every label off this section itself,
          so there is no per-page label mapping to keep in sync. */}
      <AnnouncementConfigForm
        initialConfig={config}
        templates={templates}
        dictionary={d}
      />
    </div>
  )
}
