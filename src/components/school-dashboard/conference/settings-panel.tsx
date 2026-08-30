// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { redirect } from "next/navigation"

import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { listConferenceTerms } from "@/components/school-dashboard/conference/actions/recurring"
import {
  getConferenceLinkCoverage,
  getConferenceSettings,
  listSectionRecordingPolicy,
} from "@/components/school-dashboard/conference/actions/settings"
import { SectionOnlinePolicy } from "@/components/school-dashboard/conference/section-online-policy"
import { SectionRecordingPolicy } from "@/components/school-dashboard/conference/section-recording-policy"
import { ConferenceSettingsForm } from "@/components/school-dashboard/conference/settings-form"

/**
 * The live-class settings panel — one component behind two doors:
 * `/conference/settings` (the block's own tab) and
 * `/school/configuration/live-classes` (the school configuration hub).
 * Server component: loads the school row, terms, sections and link coverage.
 */
export async function ConferenceSettingsPanel({
  lang,
  dictionary,
}: {
  lang: Locale
  dictionary: Dictionary
}) {
  const [settings, termsResult, sectionsResult, coverageResult] =
    await Promise.all([
      getConferenceSettings(),
      listConferenceTerms(),
      listSectionRecordingPolicy(),
      getConferenceLinkCoverage(),
    ])
  if (!("success" in settings) || !settings.success) {
    redirect(`/${lang}/conference/dashboard`)
  }
  const terms =
    "success" in termsResult && termsResult.success ? termsResult.data : []
  const sections =
    "success" in sectionsResult && sectionsResult.success
      ? sectionsResult.data
      : []
  const coverage =
    "success" in coverageResult && coverageResult.success
      ? coverageResult.data
      : null
  const t = dictionary?.liveClasses?.settings
  const cf = t?.carryForward
  const cov = (t as { coverage?: Record<string, string> } | undefined)?.coverage
  const sp = (t as { sectionPolicy?: Record<string, string> } | undefined)
    ?.sectionPolicy
  const op = (t as { onlinePolicy?: Record<string, string> } | undefined)
    ?.onlinePolicy

  return (
    <div className="space-y-6">
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
        initial={{
          ...settings.data,
          // The form edits plain strings; the action turns them back into
          // school-timezone instants (or null, which clears the window).
          conferenceOnlineNote: settings.data.conferenceOnlineNote ?? "",
          conferenceFallbackUrl: settings.data.conferenceFallbackUrl ?? "",
        }}
        livekitReady={settings.data.livekitReady}
        recordingReady={settings.data.recordingReady}
        windowActive={settings.data.windowActive}
        coverage={coverage}
        terms={terms.map((term) => ({
          id: term.id,
          termNumber: term.termNumber,
          startDate: term.startDate.toISOString(),
          isActive: term.isActive,
        }))}
        labels={{
          deliveryMode: t?.deliveryMode ?? "How the school teaches",
          deliveryHint:
            t?.deliveryHint ??
            "Decides whether live classes exist at all. Everything below about online delivery follows from this.",
          deliveryPhysical: t?.deliveryPhysical ?? "In person",
          deliveryPhysicalHint:
            t?.deliveryPhysicalHint ??
            "Every class in the building. No live rooms, no join buttons.",
          deliveryOnline: t?.deliveryOnline ?? "Online",
          deliveryOnlineHint:
            t?.deliveryOnlineHint ??
            "Every timetable slot is a live class, for every section.",
          deliveryHybrid: t?.deliveryHybrid ?? "Hybrid",
          deliveryHybridHint:
            t?.deliveryHybridHint ??
            "Choose per section, or open a temporary online window.",
          sectionsDefault:
            t?.sectionsDefault ?? "Sections online unless they opt out",
          sectionsDefaultHint:
            t?.sectionsDefaultHint ??
            "The default for sections without their own setting below.",
          takesEffectTomorrow:
            t?.takesEffectTomorrow ??
            "Applies to new sessions. Today's already-scheduled live classes stay as they are and close on their own.",
          lateGrace: t?.lateGrace ?? "Late after (minutes)",
          minPresence: t?.minPresence ?? "Counts as present after (minutes)",
          earlyLeave:
            t?.earlyLeave ?? "Left early if gone before end by (minutes)",
          thresholdsHint:
            t?.thresholdsHint ??
            "How presence in the room becomes an attendance mark.",
          retention: t?.retention ?? "Recording retention (days)",
          maxConcurrent: t?.maxConcurrent ?? "Max concurrent rooms",
          maxDuration: t?.maxDuration ?? "Max duration (minutes)",
          recordingDefault: t?.recordingDefault ?? "Record by default",
          recordingUnavailable:
            t?.recordingUnavailable ??
            "Recording is not set up for this school yet — sessions will run without it.",
          attendanceSync: t?.attendanceSync ?? "Auto-mark attendance",
          attendanceSyncHint:
            t?.attendanceSyncHint ??
            "Mark attendance from live-class presence when a session ends (in-app rooms only).",
          online: t?.online ?? "Teach online",
          onlineHint:
            t?.onlineHint ??
            "Deliver every timetable slot as a live class. Sessions are created automatically for each school day.",
          provider: t?.provider ?? "Meeting back-end",
          providerLivekit: t?.providerLivekit ?? "In-app room",
          providerExternal: t?.providerExternal ?? "External link",
          providerPendingHint:
            t?.providerPendingHint ??
            "In-app rooms are not provisioned yet. Classes will use external links until they are, then switch over automatically.",
          mode: t?.mode ?? "How online classes run",
          modeTimetable: t?.modeTimetable ?? "Follow the timetable",
          modeOpen: t?.modeOpen ?? "Open room, any time",
          modeBoth: t?.modeBoth ?? "Timetable + open room",
          modeHint:
            t?.modeHint ??
            "Timetable classes run at their scheduled period. An open room stays available to the whole section for the school day, with no period boundaries.",
          window: t?.window ?? "Go online temporarily",
          windowHint:
            t?.windowHint ??
            "Open a live class alongside every physical class for these dates — weather, closures, or anything else that keeps students home. The school stays open; this only adds the online channel.",
          windowFrom: t?.windowFrom ?? "From",
          windowUntil: t?.windowUntil ?? "Until",
          windowUntilHint:
            t?.windowUntilHint ??
            "Leave the end date empty to stay online until further notice. Clearing the start date ends the period.",
          windowNote: t?.windowNote ?? "Reason",
          windowNotePlaceholder:
            t?.windowNotePlaceholder ?? "Shown to staff on this page",
          windowActive: t?.windowActive ?? "Active today",
          windowClear: t?.windowClear ?? "Clear",
          fallbackUrl: t?.fallbackUrl ?? "Standing meeting link",
          fallbackUrlHint:
            t?.fallbackUrlHint ??
            "Used for any class with no meeting link of its own — the difference between every class being joinable and nothing being created. It is one shared room; set per-subject links below for separate rooms.",
          coverage: {
            title: cov?.title ?? "Meeting-link coverage",
            summary:
              cov?.summary ??
              "{covered} of {total} classes have their own link",
            allCovered:
              cov?.allCovered ?? "Every class has its own meeting link.",
            withFallback:
              cov?.withFallback ??
              "These will use the standing link above — a room shared with every other uncovered class:",
            withoutFallback:
              cov?.withoutFallback ??
              "These have no link at all and will not be created. Set a standing link above, or add a link per class:",
            andMore: cov?.andMore ?? "and {count} more",
          },
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
      {settings.data.conferenceDeliveryMode === "hybrid" && (
        <SectionOnlinePolicy
          sections={sections}
          labels={{
            title: op?.title ?? "Online teaching by section",
            description:
              op?.description ??
              "Override the school-wide setting for individual sections.",
            inherit: op?.inherit ?? "School default",
            online: op?.online ?? "Online",
            offline: op?.offline ?? "In person",
            empty: op?.empty ?? "No sections yet.",
            error: op?.error ?? "Could not update the section.",
          }}
        />
      )}
      <SectionRecordingPolicy
        sections={sections}
        labels={{
          title: sp?.title ?? "Recording opt-out by section",
          description:
            sp?.description ??
            "Sections opted out are never recorded, regardless of the school default.",
          optOut: sp?.optOut ?? "Opt out of recording",
          empty: sp?.empty ?? "No sections yet.",
          error: sp?.error ?? "Could not update the section.",
        }}
      />
    </div>
  )
}
