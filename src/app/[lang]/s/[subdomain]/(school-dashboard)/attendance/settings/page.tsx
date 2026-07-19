// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type Metadata } from "next"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getAttendanceSettings } from "@/components/school-dashboard/attendance/actions/policy"
import { AttendanceAccessDenied } from "@/components/school-dashboard/attendance/atom/access-denied"
import { AttendanceSettingsForm } from "@/components/school-dashboard/attendance/settings/form"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: Locale }>
}): Promise<Metadata> {
  const { lang } = await params
  const dictionary = await getDictionary(lang)
  const t = (dictionary?.school?.attendance as any)?.settingsPage
  return {
    title: t?.title ?? "Attendance Settings",
    description: t?.description ?? "School-wide attendance configuration",
  }
}

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])

  // Admin/Developer only
  const role = session?.user?.role ?? ""
  if (role !== "ADMIN" && role !== "DEVELOPER") {
    return <AttendanceAccessDenied lang={lang} />
  }

  const [dictionary, settings] = await Promise.all([
    getDictionary(lang),
    getAttendanceSettings(),
  ])
  const att = dictionary?.school?.attendance as any
  const t = att?.settingsPage as Record<string, string> | undefined

  if (!settings.success || !settings.data) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        {t?.loadFailed ?? "Failed to load settings"}
      </p>
    )
  }

  const { configured: _configured, ...initial } = settings.data

  return (
    <AttendanceSettingsForm
      initial={initial}
      dictionary={t}
      methodLabels={att?.overviewExtras?.methodLabels}
    />
  )
}
