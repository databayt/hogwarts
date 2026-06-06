"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateConferenceSettings } from "@/components/school-dashboard/conference/actions/settings"

export interface ConferenceSettingsValues {
  conferenceRetentionDays: number
  conferenceMaxConcurrent: number
  conferenceMaxDuration: number
  conferenceRecordingDefault: boolean
}

interface Props {
  initial: ConferenceSettingsValues
  labels: {
    retention: string
    maxConcurrent: string
    maxDuration: string
    recordingDefault: string
    save: string
    saving: string
    saved: string
    error: string
  }
}

export function ConferenceSettingsForm({ initial, labels }: Props) {
  const [values, setValues] = useState<ConferenceSettingsValues>(initial)
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle")

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
    </div>
  )
}
