"use client"

import { useEffect, useState, useTransition } from "react"
import { useParams } from "next/navigation"

import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
import { useHostValidation } from "@/components/onboarding/host-validation-context"
import type { TimetableStructure } from "@/components/school-dashboard/timetable/structures"
import {
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
  const schoolId = params.id as string
  const { enableNext } = useHostValidation()

  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const [structures, setStructures] = useState<TimetableStructure[]>([])
  const [otherStructures, setOtherStructures] = useState<TimetableStructure[]>(
    []
  )

  useEffect(() => {
    loadData()
  }, [schoolId])

  // Always allow proceeding (step is optional)
  useEffect(() => {
    enableNext()
  }, [enableNext])

  const loadData = async () => {
    try {
      const result = await getSchoolScheduleData(schoolId)
      if (result.data) {
        const { country, schoolType, schoolLevel, selectedStructure } =
          result.data

        const recommended = getRecommendedStructures(
          country,
          schoolType,
          schoolLevel
        )
        setStructures(recommended)

        // Show remaining structures as alternatives
        const recommendedSlugs = new Set(recommended.map((s) => s.slug))
        setOtherStructures(
          TIMETABLE_STRUCTURES.filter((s) => !recommendedSlugs.has(s.slug))
        )

        // Pre-select if school already has a choice, or auto-select default
        if (selectedStructure) {
          setSelectedSlug(selectedStructure)
        } else if (recommended.length > 0 && recommended[0].isDefault) {
          setSelectedSlug(recommended[0].slug)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (slug: string) => {
    setSelectedSlug(slug)
    startTransition(async () => {
      await saveScheduleChoice(schoolId, slug)
    })
  }

  if (loading) {
    return (
      <FormLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </FormLayout>
    )
  }

  return (
    <FormLayout>
      <FormHeading
        title={dict.scheduleTitle || "Choose your school schedule"}
        description={
          dict.scheduleDescription ||
          "Select the timetable structure that matches your curriculum. You can customize it later in settings."
        }
      />

      <div className="space-y-6">
        {structures.length > 0 && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm font-medium">
              Recommended for your school
            </p>
            {structures.map((structure) => (
              <StructurePreview
                key={structure.slug}
                structure={structure}
                selected={selectedSlug === structure.slug}
                onSelect={() => handleSelect(structure.slug)}
              />
            ))}
          </div>
        )}

        {otherStructures.length > 0 && (
          <div className="space-y-3">
            <p className="text-muted-foreground text-sm font-medium">
              Other options
            </p>
            {otherStructures.map((structure) => (
              <StructurePreview
                key={structure.slug}
                structure={structure}
                selected={selectedSlug === structure.slug}
                onSelect={() => handleSelect(structure.slug)}
                compact
              />
            ))}
          </div>
        )}

        {structures.length === 0 && otherStructures.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No structures available. You can configure your schedule later in
            timetable settings.
          </p>
        )}
      </div>

      {isPending && <p className="text-muted-foreground text-xs">Saving...</p>}
    </FormLayout>
  )
}
