"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ErrorToast } from "@/components/atom/toast"
import { setSectionRecordingOptOut } from "@/components/school-dashboard/conference/actions/settings"

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
}

/**
 * ADMIN/DEV control to opt individual sections out of live-class recording,
 * overriding the school-wide default. Each toggle persists via
 * `setSectionRecordingOptOut` with optimistic UI + revert-on-failure.
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

  return (
    <div className="max-w-md space-y-3 border-t pt-6">
      <div className="space-y-1">
        <p className="font-medium">{labels.title}</p>
        <p className="text-muted-foreground text-sm">{labels.description}</p>
      </div>
      {sections.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.empty}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {sections.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-4 px-3 py-2"
            >
              <Label htmlFor={`rec-optout-${s.id}`} className="text-sm">
                {s.name}
              </Label>
              <Switch
                id={`rec-optout-${s.id}`}
                checked={state.get(s.id) ?? false}
                aria-label={`${labels.optOut}: ${s.name}`}
                onCheckedChange={(checked) => toggle(s.id, checked)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
