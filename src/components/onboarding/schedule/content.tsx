"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState, useTransition } from "react"
import { useParams } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
import { useHostValidation } from "@/components/onboarding/host-validation-context"
import type { TimetableStructure } from "@/components/school-dashboard/timetable/structures"
import {
  generatePeriods,
  getRecommendedStructures,
  TIMETABLE_STRUCTURES,
} from "@/components/school-dashboard/timetable/structures"

import { getSchoolScheduleData, saveScheduleChoice } from "./actions"
import { StructurePreview } from "./structure-preview"

interface Props {
  dictionary?: any
}

export default function ScheduleContent({ dictionary }: Props) {
  const dict = dictionary?.onboarding || {}
  const params = useParams()
  const lang = (params.lang as string) || "en"
  const schoolId = params.id as string
  const { enableNext } = useHostValidation()

  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [selectedStructure, setSelectedStructure] =
    useState<TimetableStructure | null>(null)
  const [autoSelectStructure, setAutoSelectStructure] =
    useState<TimetableStructure | null>(null)

  // Always allow proceeding (step is optional)
  useEffect(() => {
    enableNext()
  }, [enableNext])

  useEffect(() => {
    loadData()
  }, [schoolId])

  const loadData = async () => {
    try {
      const result = await getSchoolScheduleData(schoolId)
      if (result.data) {
        const {
          country,
          schoolType,
          schoolLevel,
          selectedStructure: saved,
        } = result.data

        const { autoSelect } = getRecommendedStructures(
          country,
          schoolType,
          schoolLevel
        )

        const base = saved
          ? (TIMETABLE_STRUCTURES.find((s) => s.slug === saved) ?? autoSelect)
          : autoSelect

        if (base) {
          setAutoSelectStructure(autoSelect)
          setSelectedStructure(base)
          if (!saved) {
            startTransition(async () => {
              await saveScheduleChoice(schoolId, base.slug)
            })
          }
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStructureChange = (slug: string) => {
    const structure = TIMETABLE_STRUCTURES.find((s) => s.slug === slug)
    if (!structure) return
    setSelectedStructure(structure)
    startTransition(async () => {
      await saveScheduleChoice(schoolId, slug)
    })
  }

  const getStructureName = (s: TimetableStructure) =>
    lang === "ar" ? s.name : s.nameEn

  // Generate live preview
  const preview = useMemo(() => {
    if (!selectedStructure) return null
    return generatePeriods({
      periodsPerDay: selectedStructure.periodsPerDay,
      durationMinutes:
        selectedStructure.periods.find((p) => p.type === "class")
          ?.durationMinutes ?? 45,
      startTime: selectedStructure.schoolStart,
    })
  }, [selectedStructure])

  // Determine badge type
  const badge = useMemo(() => {
    if (!selectedStructure || !autoSelectStructure) return null
    if (selectedStructure.slug === autoSelectStructure.slug)
      return "best-match" as const
    return "custom" as const
  }, [selectedStructure, autoSelectStructure])

  if (loading) {
    return (
      <FormLayout>
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-28 w-full rounded-lg" />
        </div>
        <Skeleton className="h-3 w-64" />
      </FormLayout>
    )
  }

  if (!selectedStructure) {
    return (
      <FormLayout>
        <FormHeading
          title={dict.scheduleTitle || "Choose your school schedule"}
          description={
            dict.noStructuresAvailable ||
            "No structures available. You can configure your schedule later in timetable settings."
          }
        />
      </FormLayout>
    )
  }

  return (
    <FormLayout>
      <FormHeading
        title={dict.scheduleTitle || "Choose your school schedule"}
        description={
          dict.scheduleDescription ||
          "Pick a schedule that fits your school. You can fine-tune it later."
        }
      />

      <div className="space-y-6">
        <Select
          value={selectedStructure.slug}
          onValueChange={handleStructureChange}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIMETABLE_STRUCTURES.map((s) => (
              <SelectItem key={s.slug} value={s.slug}>
                {getStructureName(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <StructurePreview
          structure={selectedStructure}
          badge={badge}
          periodsOverride={preview?.periods}
          schoolStartOverride={selectedStructure.schoolStart}
          schoolEndOverride={preview?.schoolEnd}
          periodsPerDayOverride={selectedStructure.periodsPerDay}
          dictionary={dict}
          lang={lang}
        />
      </div>

      <p className="text-muted-foreground text-xs">
        {dict.scheduleNote ||
          "Choose the most relevant — you can customize it from the dashboard later."}
      </p>
    </FormLayout>
  )
}
