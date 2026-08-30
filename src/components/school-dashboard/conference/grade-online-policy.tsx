"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"

import { Label } from "@/components/ui/label"
import { ErrorToast } from "@/components/atom/toast"
import { setGradeOnline } from "@/components/school-dashboard/conference/actions/settings"

export interface GradeOnlineItem {
  id: string
  name: string
  conferenceOnline: boolean | null
}

export interface GradeOnlinePolicyLabels {
  title: string
  description: string
  inherit: string
  online: string
  offline: string
  empty: string
  error: string
}

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
 * Per-grade online override — between the school default and the per-section
 * setting (section ?? grade ?? school). Hybrid mode only. Same tri-state as
 * the section list: "inherit" must stay distinguishable from "decided no".
 */
export function GradeOnlinePolicy({
  grades,
  labels,
}: {
  grades: GradeOnlineItem[]
  labels: GradeOnlinePolicyLabels
}) {
  const [state, setState] = useState<Map<string, boolean | null>>(
    () => new Map(grades.map((g) => [g.id, g.conferenceOnline]))
  )
  const [, startTransition] = useTransition()

  function change(id: string, next: boolean | null) {
    const previous = state.get(id) ?? null
    setState((prev) => new Map(prev).set(id, next))
    startTransition(async () => {
      const res = await setGradeOnline(id, next)
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
      {grades.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.empty}</p>
      ) : (
        <ul className="divide-y rounded-md border">
          {grades.map((g) => (
            <li
              key={g.id}
              className="flex items-center justify-between gap-4 px-3 py-2"
            >
              <Label htmlFor={`grade-online-${g.id}`} className="text-sm">
                {g.name}
              </Label>
              <select
                id={`grade-online-${g.id}`}
                className="border-input bg-background h-8 rounded-md border px-2 text-sm"
                value={toValue(state.get(g.id) ?? null)}
                onChange={(e) => change(g.id, fromValue(e.target.value))}
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
