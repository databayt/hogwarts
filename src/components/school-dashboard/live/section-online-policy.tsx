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
import { ErrorToast } from "@/components/atom/toast"
import { setSectionOnline } from "@/components/school-dashboard/live/actions/settings"

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
  pick: string
  overrides: string
}

/** `null` cannot round-trip through a select value, so it gets a sentinel. */
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
 *
 * A school has dozens of sections, so the roster is a picker rather than a
 * row per section: choose a section, set its policy. The sections that
 * actually deviate from the school default are listed underneath, so the
 * overrides stay visible without the full list.
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
  const [selectedId, setSelectedId] = useState<string>(
    () => sections[0]?.id ?? ""
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

  const selected = sections.find((item) => item.id === selectedId)
  const overrides = sections.filter((s) => (state.get(s.id) ?? null) !== null)

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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="online-section">{labels.pick}</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger id="online-section" className="w-full">
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
            <div className="space-y-2">
              <Label htmlFor="online-value">
                <bdi>{selected?.name ?? labels.title}</bdi>
              </Label>
              <Select
                value={toValue(state.get(selectedId) ?? null)}
                onValueChange={(v) => change(selectedId, fromValue(v))}
                disabled={!selectedId}
              >
                <SelectTrigger id="online-value" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={INHERIT}>{labels.inherit}</SelectItem>
                  <SelectItem value="on">{labels.online}</SelectItem>
                  <SelectItem value="off">{labels.offline}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {overrides.length > 0 && (
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">
                {labels.overrides.replace("{count}", String(overrides.length))}
              </p>
              <ul className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {overrides.map((s) => (
                  <li key={s.id}>
                    <bdi>{s.name}</bdi> ·{" "}
                    {state.get(s.id) ? labels.online : labels.offline}
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
