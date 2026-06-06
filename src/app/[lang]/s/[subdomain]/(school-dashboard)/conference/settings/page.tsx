// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { getConferenceSettings } from "@/components/school-dashboard/conference/actions/settings"
import { ConferenceSettingsForm } from "@/components/school-dashboard/conference/settings-form"

interface Props {
  params: Promise<{ lang: Locale; subdomain: string }>
}

const ALLOWED_ROLES = ["DEVELOPER", "ADMIN"]

export default async function Page({ params }: Props) {
  const [{ lang }, session] = await Promise.all([params, auth()])
  const role = session?.user?.role ?? ""
  if (!ALLOWED_ROLES.includes(role)) {
    redirect(`/${lang}/dashboard`)
  }

  const [dictionary, settings] = await Promise.all([
    getDictionary(lang),
    getConferenceSettings(),
  ])
  if (!("success" in settings) || !settings.success) {
    redirect(`/${lang}/conference`)
  }
  const t = dictionary?.liveClasses?.settings

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t?.title ?? "Conference settings"}</h2>
        <p className="text-muted-foreground text-sm">
          {t?.description ??
            "Per-school recording retention and capacity limits."}
        </p>
      </div>
      <ConferenceSettingsForm
        initial={settings.data}
        labels={{
          retention: t?.retention ?? "Recording retention (days)",
          maxConcurrent: t?.maxConcurrent ?? "Max concurrent rooms",
          maxDuration: t?.maxDuration ?? "Max duration (minutes)",
          recordingDefault: t?.recordingDefault ?? "Record by default",
          save: t?.save ?? "Save",
          saving: t?.saving ?? "Saving…",
          saved: t?.saved ?? "Saved",
          error: t?.error ?? "Could not save",
        }}
      />
    </div>
  )
}
