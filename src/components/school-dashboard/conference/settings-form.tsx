"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { carryForwardConferenceLinks } from "@/components/school-dashboard/conference/actions/recurring"
import { updateConferenceSettings } from "@/components/school-dashboard/conference/actions/settings"

export interface ConferenceSettingsValues {
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

/** Link coverage for the active term — see `getConferenceLinkCoverage`. */
export interface ConferenceLinkCoverage {
  total: number
  covered: number
  gapCount: number
  gaps: Array<{ section: string; subject: string }>
  hasFallback: boolean
  truncated: boolean
}

export interface ConferenceTerm {
  id: string
  termNumber: number
  startDate: string | Date
  isActive: boolean
}

interface Props {
  initial: ConferenceSettingsValues
  terms: ConferenceTerm[]
  /**
   * Whether the SFU is actually provisioned. The school's provider preference
   * is stored either way; this only drives the hint, mirroring how the create
   * wizard disables its in-app option until the infra lands.
   */
  livekitReady: boolean
  /**
   * Whether the stored window is in force TODAY, resolved server-side in the
   * SCHOOL's timezone. Never recompute this in the browser — the reader's zone
   * is not the school's, and a window is day-granular.
   */
  windowActive: boolean
  coverage: ConferenceLinkCoverage | null
  labels: {
    retention: string
    maxConcurrent: string
    maxDuration: string
    recordingDefault: string
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

export function ConferenceSettingsForm({
  initial,
  terms,
  livekitReady,
  windowActive,
  coverage,
  labels,
}: Props) {
  const [values, setValues] = useState<ConferenceSettingsValues>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")

  // Carry-forward recurring links across terms.
  const [cfFrom, setCfFrom] = useState("")
  const [cfTo, setCfTo] = useState("")
  const [cfPending, startCarryForward] = useTransition()
  const [cfMessage, setCfMessage] = useState<string | null>(null)
  const [cfError, setCfError] = useState(false)

  const termOption = (t: ConferenceTerm) =>
    `${labels.carryForward.termPrefix} ${t.termNumber} · ${new Date(
      t.startDate
    ).getUTCFullYear()}`

  function carryForward() {
    if (!cfFrom || !cfTo || cfFrom === cfTo) return
    setCfMessage(null)
    setCfError(false)
    startCarryForward(async () => {
      const res = await carryForwardConferenceLinks(cfFrom, cfTo)
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

  function setNum(key: keyof ConferenceSettingsValues, raw: string) {
    setStatus("idle")
    setValues((v) => ({ ...v, [key]: Number(raw) }))
  }

  function setText(key: keyof ConferenceSettingsValues, raw: string) {
    setStatus("idle")
    setValues((v) => ({ ...v, [key]: raw }))
  }

  function clearWindow() {
    setStatus("idle")
    setValues((v) => ({
      ...v,
      conferenceOnlineFrom: "",
      conferenceOnlineUntil: "",
      conferenceOnlineNote: "",
    }))
  }

  // Online delivery is ADDITIVE — it never closes the building — so these two
  // controls only matter once *something* has put the school online: the
  // standing switch above, or a window below.
  const anyOnline = values.conferenceOnlineDefault || windowActive

  function save() {
    setStatus("idle")
    startTransition(async () => {
      // `values` also carries the read-only fields the page spread in
      // (`timezone`, `livekitReady`, `windowActive`). That is safe only because
      // `liveClassSettingsSchema` is a plain z.object, which STRIPS unknown
      // keys — adding `.strict()` to it would start rejecting every save.
      const res = await updateConferenceSettings(values)
      setStatus("success" in res && res.success ? "saved" : "error")
    })
  }

  return (
    <div className="max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="retention">{labels.retention}</Label>
        <Input
          id="retention"
          type="number"
          min={1}
          max={3650}
          value={values.conferenceRetentionDays}
          onChange={(e) => setNum("conferenceRetentionDays", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-concurrent">{labels.maxConcurrent}</Label>
        <Input
          id="max-concurrent"
          type="number"
          min={1}
          max={500}
          value={values.conferenceMaxConcurrent}
          onChange={(e) => setNum("conferenceMaxConcurrent", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="max-duration">{labels.maxDuration}</Label>
        <Input
          id="max-duration"
          type="number"
          min={15}
          max={240}
          value={values.conferenceMaxDuration}
          onChange={(e) => setNum("conferenceMaxDuration", e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <Label htmlFor="recording-default">{labels.recordingDefault}</Label>
        <Switch
          id="recording-default"
          checked={values.conferenceRecordingDefault}
          onCheckedChange={(checked) => {
            setStatus("idle")
            setValues((v) => ({ ...v, conferenceRecordingDefault: checked }))
          }}
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="attendance-sync">{labels.attendanceSync}</Label>
          <p className="text-muted-foreground text-xs">
            {labels.attendanceSyncHint}
          </p>
        </div>
        <Switch
          id="attendance-sync"
          checked={values.conferenceAttendanceSync}
          onCheckedChange={(checked) => {
            setStatus("idle")
            setValues((v) => ({ ...v, conferenceAttendanceSync: checked }))
          }}
        />
      </div>

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="online-default">{labels.online}</Label>
          <p className="text-muted-foreground text-xs">{labels.onlineHint}</p>
        </div>
        <Switch
          id="online-default"
          checked={values.conferenceOnlineDefault}
          onCheckedChange={(checked) => {
            setStatus("idle")
            setValues((v) => ({ ...v, conferenceOnlineDefault: checked }))
          }}
        />
      </div>

      {/* The emergency switch. Deliberately NOT gated behind the standing
          "we are an online school" toggle: a school that teaches in person is
          exactly the school that needs to open a window because of a storm,
          a closed road, or a war. */}
      <div className="space-y-3 border-t pt-6">
        <div className="space-y-1">
          <Label>{labels.window}</Label>
          <p className="text-muted-foreground text-xs">{labels.windowHint}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="window-from">{labels.windowFrom}</Label>
            <Input
              id="window-from"
              type="date"
              value={values.conferenceOnlineFrom}
              onChange={(e) => setText("conferenceOnlineFrom", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="window-until">{labels.windowUntil}</Label>
            <Input
              id="window-until"
              type="date"
              value={values.conferenceOnlineUntil}
              onChange={(e) => setText("conferenceOnlineUntil", e.target.value)}
            />
          </div>
        </div>
        <p className="text-muted-foreground text-xs">
          {labels.windowUntilHint}
        </p>
        <div className="space-y-2">
          <Label htmlFor="window-note">{labels.windowNote}</Label>
          <Input
            id="window-note"
            maxLength={280}
            placeholder={labels.windowNotePlaceholder}
            value={values.conferenceOnlineNote}
            onChange={(e) => setText("conferenceOnlineNote", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {windowActive && (
            <span className="text-muted-foreground text-xs">
              {labels.windowActive}
            </span>
          )}
          {(values.conferenceOnlineFrom || values.conferenceOnlineUntil) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearWindow}
            >
              {labels.windowClear}
            </Button>
          )}
        </div>
      </div>

      {anyOnline && (
        <div className="space-y-2">
          <Label htmlFor="online-mode">{labels.mode}</Label>
          <select
            id="online-mode"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            value={values.conferenceOnlineMode}
            onChange={(e) => {
              setStatus("idle")
              setValues((v) => ({
                ...v,
                conferenceOnlineMode: e.target.value as
                  | "timetable"
                  | "open"
                  | "both",
              }))
            }}
          >
            <option value="timetable">{labels.modeTimetable}</option>
            <option value="open">{labels.modeOpen}</option>
            <option value="both">{labels.modeBoth}</option>
          </select>
          <p className="text-muted-foreground text-xs">{labels.modeHint}</p>
        </div>
      )}

      {anyOnline && (
        <div className="space-y-2">
          <Label htmlFor="fallback-url">{labels.fallbackUrl}</Label>
          <Input
            id="fallback-url"
            type="url"
            inputMode="url"
            dir="ltr"
            placeholder="https://"
            value={values.conferenceFallbackUrl}
            onChange={(e) => setText("conferenceFallbackUrl", e.target.value)}
          />
          <p className="text-muted-foreground text-xs">
            {labels.fallbackUrlHint}
          </p>
        </div>
      )}

      {anyOnline && coverage && coverage.total > 0 && (
        <div className="space-y-2 border-t pt-6">
          <p className="font-medium">{labels.coverage.title}</p>
          <p className="text-muted-foreground text-sm">
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

      {anyOnline && (
        <div className="space-y-2">
          <Label htmlFor="provider-default">{labels.provider}</Label>
          <select
            id="provider-default"
            className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
            value={values.conferenceProviderDefault}
            onChange={(e) => {
              setStatus("idle")
              setValues((v) => ({
                ...v,
                conferenceProviderDefault: e.target.value as
                  | "livekit"
                  | "external",
              }))
            }}
          >
            <option value="external">{labels.providerExternal}</option>
            <option value="livekit">{labels.providerLivekit}</option>
          </select>
          {/* The preference is saved as chosen; it just isn't in force yet. */}
          {values.conferenceProviderDefault === "livekit" && !livekitReady && (
            <p className="text-muted-foreground text-xs">
              {labels.providerPendingHint}
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending}>
          {pending ? labels.saving : labels.save}
        </Button>
        {status === "saved" && (
          <span className="text-muted-foreground text-sm">{labels.saved}</span>
        )}
        {status === "error" && (
          <span className="text-destructive text-sm">{labels.error}</span>
        )}
      </div>

      {terms.length >= 2 && (
        <div className="space-y-3 border-t pt-6">
          <p className="font-medium">{labels.carryForward.title}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cf-from">{labels.carryForward.from}</Label>
              <select
                id="cf-from"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={cfFrom}
                onChange={(e) => setCfFrom(e.target.value)}
              >
                <option value="" />
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {termOption(t)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cf-to">{labels.carryForward.to}</Label>
              <select
                id="cf-to"
                className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                value={cfTo}
                onChange={(e) => setCfTo(e.target.value)}
              >
                <option value="" />
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {termOption(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
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
      )}
    </div>
  )
}
