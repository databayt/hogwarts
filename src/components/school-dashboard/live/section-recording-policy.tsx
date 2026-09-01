"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ErrorToast } from "@/components/atom/toast"
import { setSectionRecordingOptOut } from "@/components/school-dashboard/live/actions/settings"

export interface SectionRecordingItem {
  id: string
  name: string
  conferenceRecordingOptOut: boolean
}

export interface SectionRecordingPolicyLabels {
  title: string
  description: string
  optOut: string
  empty: string
  error: string
  pick: string
  overrides: string
}

/**
 * ADMIN/DEV control to opt individual sections out of live-class recording,
 * overriding the school-wide default. Each toggle persists via
 * `setSectionRecordingOptOut` with optimistic UI + revert-on-failure.
 *
 * The roster is a picker, not a row per section — a school has dozens — and
 * the sections currently opted out are listed underneath so the exceptions
 * stay visible.
 */
export function SectionRecordingPolicy({
  sections,
  labels,
}: {
  sections: SectionRecordingItem[]
  labels: SectionRecordingPolicyLabels
}) {
  const [state, setState] = useState<Map<string, boolean>>(
    () => new Map(sections.map((s) => [s.id, s.conferenceRecordingOptOut]))
  )
  const [selectedId, setSelectedId] = useState<string>(
    () => sections[0]?.id ?? ""
  )
  const [, startTransition] = useTransition()

  function toggle(id: string, optOut: boolean) {
    // Capture the value BEFORE the optimistic write so revert restores the true
    // pre-toggle state — `!optOut` would diverge under a rapid double-toggle.
    const previous = state.get(id) ?? false
    setState((prev) => new Map(prev).set(id, optOut))
    startTransition(async () => {
      const res = await setSectionRecordingOptOut(id, optOut)
      if (!("success" in res) || !res.success) {
        setState((prev) => new Map(prev).set(id, previous))
        ErrorToast(labels.error)
      }
    })
  }

  const optedOut = sections.filter((s) => state.get(s.id))
  const selected = sections.find((s) => s.id === selectedId)

  return (
    <div className="w-full space-y-3 border-t pt-6">
      <div className="space-y-1">
        <p className="font-medium">{labels.title}</p>
        <p className="text-muted-foreground text-sm">{labels.description}</p>
      </div>
      {sections.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.empty}</p>
      ) : (
        <>
          <div className="grid items-end gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rec-optout-section">{labels.pick}</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="rec-optout-section" className="w-full">
                  <SelectValue placeholder={labels.pick} />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pb-2">
              <Switch
                id="rec-optout-value"
                checked={state.get(selectedId) ?? false}
                disabled={!selected}
                aria-label={`${labels.optOut}: ${selected?.name ?? ""}`}
                onCheckedChange={(checked) => toggle(selectedId, checked)}
              />
              <Label htmlFor="rec-optout-value" className="text-sm">
                {labels.optOut}
              </Label>
            </div>
          </div>
          {optedOut.length > 0 && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                {labels.overrides.replace("{count}", String(optedOut.length))}
              </p>
              <ul className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {optedOut.map((s) => (
                  <li key={s.id}>
                    <bdi>{s.name}</bdi>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  )
}
