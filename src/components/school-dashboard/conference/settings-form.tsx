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
  labels: {
    retention: string
    maxConcurrent: string
    maxDuration: string
    recordingDefault: string
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

export function ConferenceSettingsForm({ initial, terms, labels }: Props) {
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

  function save() {
    setStatus("idle")
    startTransition(async () => {
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
