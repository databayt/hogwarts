"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Label } from "@/components/ui/label"
import { ErrorToast } from "@/components/atom/toast"
import { setSectionOnline } from "@/components/school-dashboard/conference/actions/settings"

export interface SectionOnlineItem {
  id: string
  name: string
  conferenceOnline: boolean | null
}

export interface SectionOnlinePolicyLabels {
  title: string
  description: string
  inherit: string
  online: string
  offline: string
  empty: string
  error: string
}

/** `null` cannot round-trip through a <select> value, so it gets a sentinel. */
const INHERIT = "inherit"

function toValue(v: boolean | null): string {
  if (v === null || v === undefined) return INHERIT
  return v ? "on" : "off"
}

function fromValue(v: string): boolean | null {
  if (v === INHERIT) return null
  return v === "on"
}

/**
 * Per-section override of the school-wide "teach online" switch.
 *
 * Three states, not two: a section can INHERIT the school setting, be forced
 * online, or be held back. The third is what a hybrid school needs — one
 * section still meeting in person after the school went online — and it has to
 * stay distinguishable from "never decided", or flipping the school-wide
 * switch would silently sweep it up.
 */
export function SectionOnlinePolicy({
  sections,
  labels,
}: {
  sections: SectionOnlineItem[]
  labels: SectionOnlinePolicyLabels
}) {
  const [state, setState] = useState<Map<string, boolean | null>>(
    () => new Map(sections.map((s) => [s.id, s.conferenceOnline]))
  )
  const [, startTransition] = useTransition()

  function change(id: string, next: boolean | null) {
    // Capture BEFORE the optimistic write so a revert restores the true
    // pre-change value even under a rapid double-change.
    const previous = state.get(id) ?? null
    setState((prev) => new Map(prev).set(id, next))
    startTransition(async () => {
      const res = await setSectionOnline(id, next)
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
              <Label htmlFor={`online-${s.id}`} className="text-sm">
                {s.name}
              </Label>
              <select
                id={`online-${s.id}`}
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                value={toValue(state.get(s.id) ?? null)}
                onChange={(e) => change(s.id, fromValue(e.target.value))}
              >
                <option value={INHERIT}>{labels.inherit}</option>
                <option value="on">{labels.online}</option>
                <option value="off">{labels.offline}</option>
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
