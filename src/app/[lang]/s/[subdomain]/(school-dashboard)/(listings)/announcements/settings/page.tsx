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
        <p className="text-destructive">
          {c?.saveFailed || "Failed to load settings"}
        </p>
        <p className="text-muted-foreground mt-2 text-sm">
          {configResult.error}
        </p>
      </div>
    )
  }

  const config = configResult.data
  const templates = templatesResult.success ? templatesResult.data : []

  // Build dictionary for config form from proper dictionary keys
  const configDictionary = {
    publishingDefaults: c?.publishingDefaults || "Publishing Defaults",
    notifications: c?.notifications || "Notifications",
    templates: c?.templates || "Templates",
    trackingRetention: c?.trackingRetention || "Tracking & Retention",
    defaultScope: c?.defaultScope || "Default Scope",
    defaultPriority: c?.defaultPriority || "Default Priority",
    autoPublish: c?.autoPublish || "Auto-publish",
    autoPublishDesc:
      c?.autoPublishDesc || "Automatically publish new announcements",
    defaultExpiryDays: c?.defaultExpiryDays || "Default Expiry (days)",
    emailOnPublish: c?.emailOnPublish || "Email on Publish",
    emailOnPublishDesc:
      c?.emailOnPublishDesc || "Send email notifications when published",
    pushNotifications: c?.pushNotifications || "Push Notifications",
    pushNotificationsDesc:
      c?.pushNotificationsDesc || "Send push notifications (coming soon)",
    quietHoursStart: c?.quietHoursStart || "Quiet Hours Start",
    quietHoursEnd: c?.quietHoursEnd || "Quiet Hours End",
    digestFrequency: c?.digestFrequency || "Digest Frequency",
    defaultTemplate: c?.defaultTemplate || "Default Template",
    allowCustomTemplates: c?.allowCustomTemplates || "Allow Custom Templates",
    allowCustomTemplatesDesc:
      c?.allowCustomTemplatesDesc ||
      "Let users create custom announcement templates",
    readTracking: c?.readTracking || "Read Tracking",
    readTrackingDesc:
      c?.readTrackingDesc || "Track when users read announcements",
    retentionDays: c?.retentionDays || "Retention Period (days)",
    autoArchive: c?.autoArchive || "Auto-archive",
    autoArchiveDesc:
      c?.autoArchiveDesc || "Automatically archive expired announcements",
    archiveAfterDays: c?.archiveAfterDays || "Archive After (days)",
    saveChanges: c?.saveChanges || "Save Changes",
    saving: c?.saving || "Saving...",
    saved: c?.saved || "Settings saved successfully",
    saveFailed: c?.saveFailed || "Failed to save settings",
    comingSoon: c?.comingSoon || "Coming Soon",
    school: d?.school || "School",
    class: d?.class || "Class",
    role: d?.role || "Role",
    low: d?.low || "Low",
    normal: d?.normal || "Normal",
    high: d?.high || "High",
    urgent: d?.priority?.urgent?.label || "Urgent",
    none: c?.none || "None",
    daily: c?.daily || "Daily",
    weekly: c?.weekly || "Weekly",
    noTemplate: c?.noTemplate || "No default template",
    templatesCount: c?.templatesCount || "templates available",
  }

  return (
    <AnnouncementConfigForm
      initialConfig={config}
      templates={templates}
      dictionary={configDictionary}
    />
  )
}
