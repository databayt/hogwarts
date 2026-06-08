// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { type Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"
import { listConferenceTerms } from "@/components/school-dashboard/conference/actions/recurring"
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

  const [dictionary, settings, termsResult] = await Promise.all([
    getDictionary(lang),
    getConferenceSettings(),
    listConferenceTerms(),
  ])
  if (!("success" in settings) || !settings.success) {
    redirect(`/${lang}/conference`)
  }
  const terms =
    "success" in termsResult && termsResult.success ? termsResult.data : []
  const t = dictionary?.liveClasses?.settings
  const cf = t?.carryForward

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {t?.title ?? "Conference settings"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {t?.description ??
            "Per-school recording retention and capacity limits."}
        </p>
      </div>
      <ConferenceSettingsForm
        initial={settings.data}
        terms={terms.map((term) => ({
          id: term.id,
          termNumber: term.termNumber,
          startDate: term.startDate.toISOString(),
          isActive: term.isActive,
        }))}
        labels={{
          retention: t?.retention ?? "Recording retention (days)",
          maxConcurrent: t?.maxConcurrent ?? "Max concurrent rooms",
          maxDuration: t?.maxDuration ?? "Max duration (minutes)",
          recordingDefault: t?.recordingDefault ?? "Record by default",
          save: t?.save ?? "Save",
          saving: t?.saving ?? "Saving…",
          saved: t?.saved ?? "Saved",
          error: t?.error ?? "Could not save",
          carryForward: {
            title: cf?.title ?? "Carry forward recurring links",
            from: cf?.from ?? "From term",
            to: cf?.to ?? "To term",
            button: cf?.button ?? "Carry forward",
            running: cf?.running ?? "Carrying forward…",
            success: cf?.success ?? "Carried forward {count} links",
            error: cf?.error ?? "Could not carry forward links",
            termPrefix: cf?.termPrefix ?? "Term",
          },
        }}
      />
    </div>
  )
}
