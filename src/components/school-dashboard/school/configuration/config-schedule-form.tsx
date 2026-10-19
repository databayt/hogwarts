"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { ChevronDown, SlidersHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ErrorToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import {
  getSchoolScheduleData,
  saveScheduleChoice,
} from "@/components/onboarding/schedule/actions"
import { StructurePreview } from "@/components/school-dashboard/timetable/structure-preview"
import type { TimetableStructure } from "@/components/school-dashboard/timetable/structures"
import {
  generatePeriods,
  getRecommendedStructures,
  TIMETABLE_STRUCTURES,
} from "@/components/school-dashboard/timetable/structures"

import { SaveStatus } from "./ui/save-status"
import { SettingsGroup, SettingsRow } from "./ui/settings-group"

// The full timetable settings (terms, working days, breaks, period editor) only
// load when someone opens Fine-tune — most visits just pick a preset.
const TimetableSettingsContent = dynamic(
  () => import("@/components/school-dashboard/timetable/settings/content"),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    ),
  }
)

type ScheduleDict = Partial<Record<string, string>>

interface Props {
  schoolId: string
  lang: string
  dictionary?: Dictionary
}

export function ConfigScheduleForm({
  schoolId,
  lang,
  dictionary: dictionaryProp,
}: Props) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const t: ScheduleDict =
    (dictionary as { schoolConfig?: { schedule?: ScheduleDict } } | null)
      ?.schoolConfig?.schedule ?? {}
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [fineTuneOpen, setFineTuneOpen] = useState(false)
  const [selectedStructure, setSelectedStructure] =
    useState<TimetableStructure | null>(null)
  const [autoSelectStructure, setAutoSelectStructure] =
    useState<TimetableStructure | null>(null)
  const savedSlugRef = useRef<string | null>(null)
  const onLoadError = useEffectEvent(() =>
    ErrorToast(t.loadError ?? "Couldn't load the schedule.")
  )

  useEffect(() => {
    let alive = true
    getSchoolScheduleData(schoolId)
      .then((result) => {
        if (!alive || !result.success || !result.data) return
        const {
          country,
          schoolType,
          schoolLevel,
          selectedStructure: saved,
        } = result.data as {
          country: string | null
          schoolType?: string
          schoolLevel?: string
          selectedStructure?: string
        }

        const { autoSelect } = getRecommendedStructures(
          country,
          schoolType,
          schoolLevel
        )
        const base = saved
          ? (TIMETABLE_STRUCTURES.find((s) => s.slug === saved) ?? autoSelect)
          : autoSelect
        if (!base) return

        setAutoSelectStructure(autoSelect)
        setSelectedStructure(base)
        savedSlugRef.current = base.slug
        // First visit: record the recommendation so the rest of the app
        // (provisioning, the timetable) reads the same preset.
        if (!saved) {
          startTransition(async () => {
            await saveScheduleChoice(schoolId, base.slug)
          })
        }
      })
      .catch(() => {
        if (alive) onLoadError()
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [schoolId])

  const handleStructureChange = (slug: string) => {
    const structure = TIMETABLE_STRUCTURES.find((s) => s.slug === slug)
    if (!structure || slug === selectedStructure?.slug) return
    setSelectedStructure(structure)
    startTransition(async () => {
      const result = await saveScheduleChoice(schoolId, slug)
      if (result.success) {
        savedSlugRef.current = slug
        setSavedAt(Date.now())
        // The sidebar row under this page shows the preset name.
        router.refresh()
      } else {
        const previous = TIMETABLE_STRUCTURES.find(
          (s) => s.slug === savedSlugRef.current
        )
        if (previous) setSelectedStructure(previous)
        ErrorToast(
          (dictionary as { schoolConfig?: { status?: ScheduleDict } } | null)
            ?.schoolConfig?.status?.error ?? "Couldn't save. Try again."
        )
      }
    })
  }

  // Fine-tune applied a structure (and the action recorded it) — follow it.
  const handleStructureApplied = (slug: string) => {
    const structure = TIMETABLE_STRUCTURES.find((s) => s.slug === slug)
    if (!structure) return
    savedSlugRef.current = slug
    setSelectedStructure(structure)
    setSavedAt(Date.now())
    router.refresh()
  }

  const getStructureName = (s: TimetableStructure) =>
    lang === "ar" ? s.name : (s.nameEn ?? s.name)

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

  const badge =
    selectedStructure && autoSelectStructure
      ? selectedStructure.slug === autoSelectStructure.slug
        ? ("best-match" as const)
        : ("custom" as const)
      : null

  const fineTuneRow = (
    <SettingsRow
      label={t.fineTuneLabel ?? "Customize the timetable"}
      description={t.fineTuneHint ?? "Period times, breaks and school days"}
    >
      <Button
        variant={fineTuneOpen ? "secondary" : "outline"}
        size="sm"
        aria-expanded={fineTuneOpen}
        aria-controls="schedule-fine-tune"
        onClick={() => setFineTuneOpen((open) => !open)}
      >
        <SlidersHorizontal className="size-4" />
        {t.fineTune ?? "Fine-tune"}
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            fineTuneOpen && "rotate-180"
          )}
        />
      </Button>
    </SettingsRow>
  )

  // Fine-tune opens in place, under the preview, so the preset and the
  // detailed timetable read as one page.
  const fineTunePanel = fineTuneOpen ? (
    <section id="schedule-fine-tune" className="space-y-4">
      <div className="px-4">
        <h3 className="text-sm font-medium">
          {t.fineTuneTitle ?? "Fine-tune the timetable"}
        </h3>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t.fineTuneDescription ??
            "Changes apply to the school year you pick and show on the timetable right away."}
        </p>
      </div>
      {dictionary?.school && (
        <TimetableSettingsContent
          dictionary={dictionary.school}
          lang={lang as Locale}
          initialStructureSlug={selectedStructure?.slug}
          onStructureApplied={handleStructureApplied}
          embedded
        />
      )}
    </section>
  ) : null

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    )
  }

  if (!selectedStructure) {
    return (
      <div className="space-y-6">
        <SettingsGroup footer={t.empty}>{fineTuneRow}</SettingsGroup>
        {fineTunePanel}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Select
          value={selectedStructure.slug}
          onValueChange={handleStructureChange}
        >
          <SelectTrigger
            className="w-60 max-w-full"
            aria-label={t.preset ?? "Schedule preset"}
          >
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
        <SaveStatus pending={isPending} savedAt={savedAt} />
      </div>

      <SettingsGroup footer={t.note}>
        <div className="p-4">
          <StructurePreview
            structure={selectedStructure}
            badge={badge}
            periodsOverride={preview?.periods}
            schoolStartOverride={selectedStructure.schoolStart}
            schoolEndOverride={preview?.schoolEnd}
            periodsPerDayOverride={selectedStructure.periodsPerDay}
            dictionary={t}
            lang={lang}
            variant="plain"
          />
        </div>
      </SettingsGroup>

      <SettingsGroup>{fineTuneRow}</SettingsGroup>
      {fineTunePanel}
    </div>
  )
}
