"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { getSchoolClassification } from "../actions"
import { StructurePreview } from "../structure-preview"
import {
  DURATION_OPTIONS,
  extractConfig,
  findBestStructure,
  generatePeriods,
  getRecommendedStructures,
  PERIOD_COUNT_OPTIONS,
  START_TIME_OPTIONS,
  TIMETABLE_STRUCTURES,
  WEEKEND_OPTIONS,
  type ScheduleConfig,
  type TimetableStructure,
} from "../structures"

interface Props {
  /** School year the chosen structure applies to. */
  yearId: string
  disabled?: boolean
  applying?: boolean
  dictionary?: any
  lang?: string
  /** Applies the nearest named structure's periods (parent owns the action). */
  onApply: (slug: string) => Promise<void> | void
}

/**
 * Schedule configurator — same UI vocabulary as the onboarding schedule step
 * (a preset <Select> driving a live <StructurePreview>), with extra quick-config
 * knobs (weekend / periods / duration / start) for fine-tuning. Applying writes
 * the nearest named structure's periods; the period editor below handles
 * row-level manual tweaks.
 */
export function ScheduleConfigurator({
  yearId,
  disabled,
  applying,
  dictionary,
  lang = "en",
  onApply,
}: Props) {
  const dict = dictionary || {}
  const [recommendedSlug, setRecommendedSlug] = useState<string | null>(null)
  const [slug, setSlug] = useState<string>(TIMETABLE_STRUCTURES[0].slug)
  const [config, setConfig] = useState<ScheduleConfig>(() =>
    extractConfig(TIMETABLE_STRUCTURES[0])
  )

  // Default to the country-recommended structure, mirroring onboarding.
  useEffect(() => {
    let alive = true
    getSchoolClassification()
      .then(({ country, schoolType, schoolLevel }) => {
        if (!alive) return
        const { autoSelect, recommended } = getRecommendedStructures(
          country,
          schoolType,
          schoolLevel
        )
        const base = autoSelect ?? recommended[0] ?? TIMETABLE_STRUCTURES[0]
        setRecommendedSlug(base.slug)
        setSlug(base.slug)
        setConfig(extractConfig(base))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const selected =
    TIMETABLE_STRUCTURES.find((s) => s.slug === slug) ?? TIMETABLE_STRUCTURES[0]

  const handleSelectPreset = (next: string) => {
    const st = TIMETABLE_STRUCTURES.find((x) => x.slug === next)
    if (!st) return
    setSlug(next)
    setConfig(extractConfig(st))
  }

  // A quick-config change re-anchors the displayed base to the nearest preset.
  const patchConfig = (patch: Partial<ScheduleConfig>) => {
    const next = { ...config, ...patch }
    setConfig(next)
    const best = findBestStructure(next, TIMETABLE_STRUCTURES)
    if (best) setSlug(best.slug)
  }

  const preview = useMemo(
    () =>
      generatePeriods({
        periodsPerDay: config.periodsPerDay,
        durationMinutes: config.durationMinutes,
        startTime: config.startTime,
      }),
    [config]
  )

  const workingDays =
    WEEKEND_OPTIONS.find((w) => w.value === config.weekendType)?.workingDays ??
    selected.workingDays

  // Override the preview structure's working days so the days line matches the
  // chosen weekend (StructurePreview reads structure.workingDays directly).
  const previewStructure: TimetableStructure = { ...selected, workingDays }
  const badge =
    recommendedSlug && slug === recommendedSlug ? "best-match" : "custom"

  const handleApply = () => {
    const target = findBestStructure(config, TIMETABLE_STRUCTURES) ?? selected
    return onApply(target.slug)
  }

  const getName = (s: TimetableStructure) => (lang === "ar" ? s.name : s.nameEn)

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>{dict.preset || "Schedule preset"}</Label>
        <Select
          value={slug}
          onValueChange={handleSelectPreset}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMETABLE_STRUCTURES.map((s) => (
              <SelectItem key={s.slug} value={s.slug}>
                {getName(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick-config knobs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label className="text-xs">{dict.weekend || "Weekend"}</Label>
          <Select
            value={config.weekendType}
            onValueChange={(v) =>
              patchConfig({ weekendType: v as ScheduleConfig["weekendType"] })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKEND_OPTIONS.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">{dict.periodsDay || "Periods/day"}</Label>
          <Select
            value={String(config.periodsPerDay)}
            onValueChange={(v) => patchConfig({ periodsPerDay: Number(v) })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_COUNT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">{dict.duration || "Duration"}</Label>
          <Select
            value={String(config.durationMinutes)}
            onValueChange={(v) => patchConfig({ durationMinutes: Number(v) })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DURATION_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} min
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs">{dict.startTime || "Start"}</Label>
          <Select
            value={config.startTime}
            onValueChange={(v) => patchConfig({ startTime: v })}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {START_TIME_OPTIONS.map((tt) => (
                <SelectItem key={tt} value={tt}>
                  {tt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <StructurePreview
        structure={previewStructure}
        badge={badge}
        periodsOverride={preview.periods}
        schoolStartOverride={config.startTime}
        schoolEndOverride={preview.schoolEnd}
        periodsPerDayOverride={config.periodsPerDay}
        dictionary={dict}
        lang={lang}
      />

      <div className="flex justify-end">
        <Button onClick={handleApply} disabled={disabled || applying}>
          {applying && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {dict.applyPreset || "Apply schedule"}
        </Button>
      </div>
    </div>
  )
}
