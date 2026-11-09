"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Fragment, useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { carryForwardLiveLinks } from "@/components/school-dashboard/live/actions/recurring"
import { updateLiveSettings } from "@/components/school-dashboard/live/actions/settings"
import { SaveStatus } from "@/components/school-dashboard/school/configuration/ui/save-status"
import {
  SettingsGroup,
  SettingsRow,
} from "@/components/school-dashboard/school/configuration/ui/settings-group"

export interface LiveSettingsValues {
  conferenceDeliveryMode: "physical" | "online" | "hybrid"
  conferenceLateGraceMinutes: number
  conferenceMinPresenceMinutes: number
  conferenceEarlyLeaveMinutes: number
  conferenceRecordingConsentNote: string
  conferenceAutoPublishRecordings: boolean
  conferenceGuardiansObserve: boolean
  conferenceStudentsJoinMuted: boolean
  conferenceToolChat: boolean
  conferenceToolHands: boolean
  conferenceToolPolls: boolean
  conferenceToolWhiteboard: boolean
  conferenceToolStudentShare: boolean
  conferenceReminderLeadMinutes: number
  conferenceRetentionDays: number
  conferenceMaxConcurrent: number
  conferenceMaxDuration: number
  conferenceRecordingDefault: boolean
  conferenceAttendanceSync: boolean
  conferenceOnlineDefault: boolean
  conferenceProviderDefault: "livekit" | "external"
  conferenceOnlineMode: "timetable" | "open" | "both"
  /** `"YYYY-MM-DD"` or `""` — the native date input's own format. */
  conferenceOnlineFrom: string
  conferenceOnlineUntil: string
  conferenceOnlineNote: string
  conferenceFallbackUrl: string
}

/** Link coverage for the active term — see `getLiveLinkCoverage`. */
export interface LiveLinkCoverage {
  total: number
  covered: number
  gapCount: number
  gaps: Array<{ section: string; subject: string }>
  hasFallback: boolean
  truncated: boolean
}

export interface LiveTerm {
  id: string
  termNumber: number
  startDate: string | Date
  isActive: boolean
}

interface Props {
  initial: LiveSettingsValues
  terms: LiveTerm[]
  /**
   * Whether the SFU is actually provisioned. The school's provider preference
   * is stored either way; this only drives the hint, mirroring how the create
   * wizard disables its in-app option until the infra lands.
   */
  livekitReady: boolean
  /** Whether Egress has somewhere to write. The switch below is honest about it. */
  recordingReady: boolean
  /**
   * Whether the stored window is in force TODAY, resolved server-side in the
   * SCHOOL's timezone. Never recompute this in the browser — the reader's zone
   * is not the school's, and a window is day-granular.
   */
  windowActive: boolean
  coverage: LiveLinkCoverage | null
  /** Locale prefix for the "Change" link to the teaching-mode page. */
  lang: string
  /** Rendered inside the Hybrid group (grade + section policies). */
  hybridExtras?: React.ReactNode
  /** Rendered inside the Recording group (per-section opt-out). */
  recordingExtras?: React.ReactNode
  /** Rendered at the end of the Advanced group (usage, protection). */
  advancedExtras?: React.ReactNode
  labels: {
    groups: {
      joining: string
      attendance: string
      room: string
      recording: string
      hybrid: string
      advanced: string
    }
    /** "Classes run: {mode}" */
    deliverySummary: string
    deliveryChange: string
    minutes: string
    /** "Late after {late} min · present after {present} · …" */
    attendancePreview: string
    deliveryMode: string
    deliveryHint: string
    deliveryPhysical: string
    deliveryPhysicalHint: string
    deliveryOnline: string
    deliveryOnlineHint: string
    deliveryHybrid: string
    deliveryHybridHint: string
    sectionsDefault: string
    sectionsDefaultHint: string
    takesEffectTomorrow: string
    lateGrace: string
    minPresence: string
    earlyLeave: string
    thresholdsHint: string
    consentNote: string
    consentNoteHint: string
    consentNotePlaceholder: string
    autoPublish: string
    autoPublishHint: string
    guardiansObserve: string
    guardiansObserveHint: string
    joinMuted: string
    joinMutedHint: string
    tools: string
    toolsHint: string
    toolChat: string
    toolHands: string
    toolPolls: string
    toolWhiteboard: string
    toolStudentShare: string
    reminderLead: string
    reminderLeadHint: string
    retention: string
    maxConcurrent: string
    maxDuration: string
    recordingDefault: string
    recordingUnavailable: string
    attendanceSync: string
    attendanceSyncHint: string
    online: string
    onlineHint: string
    provider: string
    providerLivekit: string
    providerExternal: string
    providerPendingHint: string
    mode: string
    modeTimetable: string
    modeOpen: string
    modeBoth: string
    modeHint: string
    window: string
    windowHint: string
    windowFrom: string
    windowUntil: string
    windowUntilHint: string
    windowNote: string
    windowNotePlaceholder: string
    windowActive: string
    windowClear: string
    fallbackUrl: string
    fallbackUrlHint: string
    coverage: {
      title: string
      /** "{covered} of {total} …" */
      summary: string
      allCovered: string
      withFallback: string
      withoutFallback: string
      andMore: string
    }
    save: string
    saving: string
    saved: string
    error: string
    carryForward: {
      title: string
      from: string
      to: string
      button: string
      running: string
      success: string
      error: string
      termPrefix: string
    }
  }
}

export function LiveSettingsForm({
  initial,
  terms,
  livekitReady,
  recordingReady,
  windowActive,
  coverage,
  lang,
  hybridExtras,
  recordingExtras,
  advancedExtras,
  labels,
}: Props) {
  const [values, setValues] = useState<LiveSettingsValues>(initial)
  const [pending, startTransition] = useTransition()
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [failed, setFailed] = useState(false)

  // Auto-save, like every other configuration page: each change bumps the
  // version, and the newest values are saved once the edits pause.
  // `updateLiveSettings` is a whole-form save, so it always gets the full set.
  const [version, setVersion] = useState(0)
  // The newest values, written from the change handler (never during render).
  const latest = useRef(values)
  useEffect(() => {
    if (version === 0) return
    const timer = setTimeout(() => {
      startTransition(async () => {
        // `values` also carries the read-only fields the page spread in
        // (`timezone`, `livekitReady`, `windowActive`). That is safe only
        // because `liveClassSettingsSchema` is a plain z.object, which STRIPS
        // unknown keys — adding `.strict()` to it would reject every save.
        const res = await updateLiveSettings(latest.current)
        const ok = "success" in res && res.success
        setFailed(!ok)
        if (ok) setSavedAt(Date.now())
      })
    }, 700)
    return () => clearTimeout(timer)
  }, [version])

  function patch(next: Partial<LiveSettingsValues>) {
    latest.current = { ...latest.current, ...next }
    setValues(latest.current)
    setVersion((n) => n + 1)
  }

  // Carry-forward recurring links across terms.
  const [cfFrom, setCfFrom] = useState("")
  const [cfTo, setCfTo] = useState("")
  const [cfPending, startCarryForward] = useTransition()
  const [cfMessage, setCfMessage] = useState<string | null>(null)
  const [cfError, setCfError] = useState(false)

  const termOption = (t: LiveTerm) =>
    `${labels.carryForward.termPrefix} ${t.termNumber} · ${new Date(
      t.startDate
    ).getUTCFullYear()}`

  function carryForward() {
    if (!cfFrom || !cfTo || cfFrom === cfTo) return
    setCfMessage(null)
    setCfError(false)
    startCarryForward(async () => {
      const res = await carryForwardLiveLinks(cfFrom, cfTo)
      if ("success" in res && res.success) {
        setCfMessage(
          labels.carryForward.success.replace(
            "{count}",
            String(res.data.created)
          )
        )
      } else {
        setCfError(true)
        setCfMessage(labels.carryForward.error)
      }
    })
  }

  // Online delivery is ADDITIVE — it never closes the building — so the
  // online-only controls matter once *something* has put the school online:
  // the mode, the hybrid default, or a window.
  const mode = values.conferenceDeliveryMode
  const physical = mode === "physical"
  const hybrid = mode === "hybrid"
  const anyOnline =
    mode === "online" ||
    (hybrid && (values.conferenceOnlineDefault || windowActive))

  const modeName =
    mode === "online"
      ? labels.deliveryOnline
      : mode === "hybrid"
        ? labels.deliveryHybrid
        : labels.deliveryPhysical

  const switchRow = (
    key:
      | "conferenceGuardiansObserve"
      | "conferenceStudentsJoinMuted"
      | "conferenceAutoPublishRecordings"
      | "conferenceRecordingDefault"
      | "conferenceAttendanceSync"
      | "conferenceOnlineDefault",
    label: string,
    hint?: React.ReactNode,
    disabled?: boolean
  ) => (
    <SettingsRow key={key} label={label} description={hint}>
      <Switch
        id={key}
        aria-label={label}
        checked={values[key]}
        disabled={disabled}
        onCheckedChange={(checked) => patch({ [key]: checked })}
      />
    </SettingsRow>
  )

  const numberRow = (
    key:
      | "conferenceReminderLeadMinutes"
      | "conferenceRetentionDays"
      | "conferenceMaxConcurrent"
      | "conferenceMaxDuration",
    label: string,
    min: number,
    max: number,
    hint?: string,
    suffix?: string
  ) => (
    <SettingsRow key={key} label={label} description={hint}>
      <div className="flex shrink-0 items-center gap-2">
        <Input
          id={key}
          aria-label={label}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          className="h-9 w-20 text-center"
          value={values[key]}
          onChange={(e) => patch({ [key]: Number(e.target.value) })}
        />
        {suffix ? (
          <span className="text-muted-foreground text-xs">{suffix}</span>
        ) : null}
      </div>
    </SettingsRow>
  )

  return (
    <div className="w-full max-w-2xl space-y-8">
      <div className="space-y-1">
        <SettingsGroup>
          <SettingsRow
            label={labels.deliverySummary.replace("{mode}", modeName)}
            description={
              mode === "online"
                ? labels.deliveryOnlineHint
                : mode === "hybrid"
                  ? labels.deliveryHybridHint
                  : labels.deliveryPhysicalHint
            }
          >
            <Link
              href={`/${lang}/school/configuration/teaching-mode`}
              className="text-primary shrink-0 text-sm hover:underline"
            >
              {labels.deliveryChange}
            </Link>
          </SettingsRow>
        </SettingsGroup>
        <SaveStatus pending={pending} savedAt={savedAt} className="px-4" />
        {failed ? (
          <p role="alert" className="text-destructive px-4 text-xs">
            {labels.error}
          </p>
        ) : null}
      </div>

      {!physical && (
        <SettingsGroup
          title={labels.groups.joining}
          footer={labels.reminderLeadHint}
        >
          {numberRow(
            "conferenceReminderLeadMinutes",
            labels.reminderLead,
            1,
            60,
            undefined,
            labels.minutes
          )}
          {switchRow(
            "conferenceStudentsJoinMuted",
            labels.joinMuted,
            labels.joinMutedHint
          )}
          {switchRow(
            "conferenceGuardiansObserve",
            labels.guardiansObserve,
            labels.guardiansObserveHint
          )}
        </SettingsGroup>
      )}

      {!physical && (
        <SettingsGroup
          title={labels.groups.attendance}
          footer={
            values.conferenceAttendanceSync
              ? labels.attendancePreview
                  .replace("{late}", String(values.conferenceLateGraceMinutes))
                  .replace(
                    "{present}",
                    String(values.conferenceMinPresenceMinutes)
                  )
                  .replace(
                    "{early}",
                    String(values.conferenceEarlyLeaveMinutes)
                  )
              : labels.thresholdsHint
          }
        >
          {switchRow(
            "conferenceAttendanceSync",
            labels.attendanceSync,
            labels.attendanceSyncHint
          )}
          {values.conferenceAttendanceSync && (
            <div className="grid gap-3 px-4 py-3 sm:grid-cols-3">
              {(
                [
                  ["conferenceLateGraceMinutes", labels.lateGrace, 0, 120],
                  ["conferenceMinPresenceMinutes", labels.minPresence, 0, 240],
                  ["conferenceEarlyLeaveMinutes", labels.earlyLeave, 0, 120],
                ] as const
              ).map(([key, label, min, max]) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key} className="text-xs font-normal">
                    {label}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    inputMode="numeric"
                    min={min}
                    max={max}
                    className="h-9"
                    value={values[key]}
                    onChange={(e) => patch({ [key]: Number(e.target.value) })}
                  />
                </div>
              ))}
            </div>
          )}
        </SettingsGroup>
      )}

      {!physical && (
        <SettingsGroup title={labels.groups.room} footer={labels.toolsHint}>
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {(
              [
                ["conferenceToolChat", labels.toolChat],
                ["conferenceToolHands", labels.toolHands],
                ["conferenceToolPolls", labels.toolPolls],
                ["conferenceToolWhiteboard", labels.toolWhiteboard],
                ["conferenceToolStudentShare", labels.toolStudentShare],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="switch"
                aria-checked={values[key]}
                onClick={() => patch({ [key]: !values[key] })}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                  values[key]
                    ? "bg-foreground text-background border-transparent"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </SettingsGroup>
      )}

      {!physical && (
        <Disclosure title={labels.groups.recording}>
          <SettingsGroup
            footer={!recordingReady ? labels.recordingUnavailable : undefined}
          >
            {switchRow(
              "conferenceRecordingDefault",
              labels.recordingDefault,
              undefined,
              !recordingReady && !values.conferenceRecordingDefault
            )}
            {switchRow(
              "conferenceAutoPublishRecordings",
              labels.autoPublish,
              labels.autoPublishHint
            )}
            {numberRow("conferenceRetentionDays", labels.retention, 1, 3650)}
            <div className="space-y-2 px-4 py-3">
              <Label htmlFor="consent-note" className="text-sm">
                {labels.consentNote}
              </Label>
              <p className="text-muted-foreground text-xs">
                {labels.consentNoteHint}
              </p>
              <textarea
                id="consent-note"
                rows={2}
                maxLength={500}
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                placeholder={labels.consentNotePlaceholder}
                value={values.conferenceRecordingConsentNote}
                onChange={(e) =>
                  patch({ conferenceRecordingConsentNote: e.target.value })
                }
              />
            </div>
          </SettingsGroup>
          <Fragment key="recordingExtras">{recordingExtras}</Fragment>
        </Disclosure>
      )}

      {hybrid && (
        <div className="space-y-6">
          <SettingsGroup
            title={labels.groups.hybrid}
            footer={labels.sectionsDefaultHint}
          >
            {switchRow("conferenceOnlineDefault", labels.sectionsDefault)}
          </SettingsGroup>
          <Fragment key="hybridExtras">{hybridExtras}</Fragment>
        </div>
      )}

      {!physical && (
        // The emergency switch. Deliberately NOT gated behind the standing
        // online switch: a school that teaches in person is exactly the
        // school that needs to open a window because of a storm, a closed
        // road, or a war.
        <SettingsGroup title={labels.window} footer={labels.windowHint}>
          <div className="space-y-3 px-4 py-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="window-from" className="text-xs font-normal">
                  {labels.windowFrom}
                </Label>
                <Input
                  id="window-from"
                  type="date"
                  value={values.conferenceOnlineFrom}
                  onChange={(e) =>
                    patch({ conferenceOnlineFrom: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="window-until" className="text-xs font-normal">
                  {labels.windowUntil}
                </Label>
                <Input
                  id="window-until"
                  type="date"
                  value={values.conferenceOnlineUntil}
                  onChange={(e) =>
                    patch({ conferenceOnlineUntil: e.target.value })
                  }
                />
              </div>
            </div>
            <Input
              id="window-note"
              aria-label={labels.windowNote}
              maxLength={280}
              placeholder={labels.windowNotePlaceholder}
              value={values.conferenceOnlineNote}
              onChange={(e) => patch({ conferenceOnlineNote: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-muted-foreground flex-1 text-xs">
                {labels.windowUntilHint}
              </p>
              {windowActive && (
                <span className="rounded-full bg-[#00bc6d]/15 px-2 py-0.5 text-xs font-medium text-[#00804a] dark:text-[#3ddc97]">
                  {labels.windowActive}
                </span>
              )}
              {(values.conferenceOnlineFrom ||
                values.conferenceOnlineUntil) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patch({
                      conferenceOnlineFrom: "",
                      conferenceOnlineUntil: "",
                      conferenceOnlineNote: "",
                    })
                  }
                >
                  {labels.windowClear}
                </Button>
              )}
            </div>
          </div>
        </SettingsGroup>
      )}

      {!physical && (
        <Disclosure title={labels.groups.advanced}>
          <SettingsGroup>
            {anyOnline && (
              <SettingsRow
                label={labels.provider}
                description={
                  values.conferenceProviderDefault === "livekit" &&
                  !livekitReady
                    ? labels.providerPendingHint
                    : undefined
                }
              >
                <select
                  id="provider-default"
                  aria-label={labels.provider}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  value={values.conferenceProviderDefault}
                  onChange={(e) =>
                    patch({
                      conferenceProviderDefault: e.target.value as
                        | "livekit"
                        | "external",
                    })
                  }
                >
                  <option value="livekit">{labels.providerLivekit}</option>
                  <option value="external">{labels.providerExternal}</option>
                </select>
              </SettingsRow>
            )}
            {anyOnline && (
              <SettingsRow label={labels.mode} description={labels.modeHint}>
                <select
                  id="online-mode"
                  aria-label={labels.mode}
                  className="border-input bg-background h-9 rounded-md border px-3 text-sm"
                  value={values.conferenceOnlineMode}
                  onChange={(e) =>
                    patch({
                      conferenceOnlineMode: e.target.value as
                        | "timetable"
                        | "open"
                        | "both",
                    })
                  }
                >
                  <option value="timetable">{labels.modeTimetable}</option>
                  <option value="open">{labels.modeOpen}</option>
                  <option value="both">{labels.modeBoth}</option>
                </select>
              </SettingsRow>
            )}
            {numberRow("conferenceMaxConcurrent", labels.maxConcurrent, 1, 500)}
            {numberRow(
              "conferenceMaxDuration",
              labels.maxDuration,
              15,
              240,
              undefined,
              labels.minutes
            )}
          </SettingsGroup>

          {anyOnline && (
            <SettingsGroup
              title={labels.fallbackUrl}
              footer={labels.fallbackUrlHint}
            >
              <div className="px-4 py-3">
                <Input
                  id="fallback-url"
                  aria-label={labels.fallbackUrl}
                  type="url"
                  inputMode="url"
                  dir="ltr"
                  placeholder="https://"
                  value={values.conferenceFallbackUrl}
                  onChange={(e) =>
                    patch({ conferenceFallbackUrl: e.target.value })
                  }
                />
              </div>
              {coverage && coverage.total > 0 && (
                <div className="space-y-1 px-4 py-3">
                  <p className="text-sm font-medium">{labels.coverage.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {labels.coverage.summary
                      .replace("{covered}", String(coverage.covered))
                      .replace("{total}", String(coverage.total))}
                  </p>
                  {coverage.gapCount === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      {labels.coverage.allCovered}
                    </p>
                  ) : (
                    <>
                      <p className="text-muted-foreground text-xs">
                        {coverage.hasFallback
                          ? labels.coverage.withFallback
                          : labels.coverage.withoutFallback}
                      </p>
                      <ul className="text-muted-foreground space-y-1 text-xs">
                        {coverage.gaps.map((g) => (
                          <li key={`${g.section}:${g.subject}`}>
                            {g.section} · {g.subject}
                          </li>
                        ))}
                      </ul>
                      {coverage.gapCount > coverage.gaps.length && (
                        <p className="text-muted-foreground text-xs">
                          {labels.coverage.andMore.replace(
                            "{count}",
                            String(coverage.gapCount - coverage.gaps.length)
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </SettingsGroup>
          )}

          {terms.length >= 2 && (
            <SettingsGroup title={labels.carryForward.title}>
              <div className="space-y-3 px-4 py-3">
                <div className="grid grid-cols-2 gap-3">
                  {(
                    [
                      ["cf-from", labels.carryForward.from, cfFrom, setCfFrom],
                      ["cf-to", labels.carryForward.to, cfTo, setCfTo],
                    ] as const
                  ).map(([id, label, value, set]) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id} className="text-xs font-normal">
                        {label}
                      </Label>
                      <select
                        id={id}
                        className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                        value={value}
                        onChange={(e) => set(e.target.value)}
                      >
                        <option value="" />
                        {terms.map((t) => (
                          <option key={t.id} value={t.id}>
                            {termOption(t)}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={carryForward}
                    disabled={cfPending || !cfFrom || !cfTo || cfFrom === cfTo}
                  >
                    {cfPending
                      ? labels.carryForward.running
                      : labels.carryForward.button}
                  </Button>
                  {cfMessage && (
                    <span
                      className={
                        cfError
                          ? "text-destructive text-sm"
                          : "text-muted-foreground text-sm"
                      }
                    >
                      {cfMessage}
                    </span>
                  )}
                </div>
              </div>
            </SettingsGroup>
          )}
          <Fragment key="advancedExtras">{advancedExtras}</Fragment>
        </Disclosure>
      )}
    </div>
  )
}

/**
 * A group the admin rarely needs, closed by default: the title row opens it.
 * Native <details>, so it works without JS and the keyboard gets it for free.
 */
function Disclosure({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <details className="group space-y-3">
      <summary className="text-muted-foreground hover:text-foreground flex cursor-pointer list-none items-center gap-1.5 px-4 text-xs font-medium [&::-webkit-details-marker]:hidden">
        <ChevronDown className="size-3.5 -rotate-90 transition-transform group-open:rotate-0 rtl:rotate-90 rtl:group-open:rotate-0" />
        {title}
      </summary>
      <div className="space-y-6">{children}</div>
    </details>
  )
}
