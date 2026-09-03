"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState } from "react"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"

import { getTimetableByStudentGrade, getTodaySchedule } from "../actions"
import { TimetableGridSkeleton } from "./grid-skeleton"
import {
  ClosureNotice,
  type LiveClassJoinInfo,
  type SchoolClosureInfo,
} from "./live-join-button"
import SimpleGrid from "./simple-grid"
import { SlotDetailDialog } from "./slot-detail-dialog"

interface Props {
  dictionary: Dictionary["school"]
  lang: Locale
  termId: string
  termInfo: {
    id: string
    termNumber: number
    yearName: string
    label: string
  }
  workingDays: number[]
  periods: Array<{
    id: string
    name: string
    order: number
    startTime: Date
    endTime: Date
    isBreak: boolean
  }>
  lunchAfterPeriod: number | null
  isLoading?: boolean
  classId?: string // Legacy prop - no longer needed
  classIds?: string[] // All enrolled class IDs
}

// `termInfo` and `lunchAfterPeriod` still arrive via RoleRouter's `commonProps`
// spread; the student surface stopped rendering a term badge and a lunch label
// when the header card went, so they are deliberately not destructured here.
export default function StudentView({
  dictionary,
  lang,
  termId,
  workingDays,
  periods,
  isLoading,
}: Props) {
  const d = dictionary?.timetable as Record<string, any> | undefined
  const sv = (d as Record<string, any>)?.studentViewUi
  const CLOSED_LABEL =
    (d as Record<string, any>)?.closedToday ?? "School is closed today"
  const isRTL = lang === "ar"

  const [isLoadingData, setIsLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Week / day view mode — the student's analogue of the admin toolbar's
  // classroom/teacher switch: it changes what the SAME grid shows, never which
  // component renders.
  //
  // The viewport decides the ORDER, and the order decides everything else: the
  // leading half is what the toggle opens on. A phone leads with the single day
  // (a five-day grid does not fit); a laptop leads with the week. Keeping order
  // and default as one fact means they cannot drift apart, and the thumb simply
  // follows "is the active half the trailing one".
  //
  // `isNarrow` starts false so the server and the first client render agree —
  // matchMedia is only readable after mount, and seeding state from it would
  // hydrate mismatched. `picked` stays null until the student chooses, so the
  // default keeps tracking a rotation; once chosen, their pick wins at any width.
  const [picked, setPicked] = useState<"week" | "day" | null>(null)
  const [isNarrow, setIsNarrow] = useState(false)
  const ORDER: ReadonlyArray<"week" | "day"> = isNarrow
    ? ["day", "week"]
    : ["week", "day"]
  const viewRange: "week" | "day" = picked ?? ORDER[0]

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)")
    const sync = () => setIsNarrow(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])
  // Weekly data
  const [slots, setSlots] = useState<any[]>([])
  const [liveIndicators, setLiveIndicators] = useState<
    Record<string, "live" | "scheduled">
  >({})
  const [liveJoin, setLiveJoin] = useState<Record<string, LiveClassJoinInfo>>(
    {}
  )
  // Which cell the reader opened. The grid is read-only here, so a click means
  // "tell me about this", not "let me change it".
  const [inspectedSlotId, setInspectedSlotId] = useState<string | null>(null)

  // Today's schedule is fetched for its CLOSURE only — the day list and the
  // current/next card it used to feed are both gone, but a declared holiday
  // still has to be announced above the grid.
  const [closure, setClosure] = useState<SchoolClosureInfo>(null)
  const [currentDay, setCurrentDay] = useState<number>(new Date().getDay())

  // Load data
  useEffect(() => {
    loadData()
  }, [termId])

  const loadData = async () => {
    setIsLoadingData(true)
    setError(null)

    try {
      const [weeklyResult, todayResult] = await Promise.all([
        getTimetableByStudentGrade({ termId }),
        getTodaySchedule(),
      ])

      setSlots(weeklyResult.slots)
      setLiveIndicators(weeklyResult.liveIndicators ?? {})
      setLiveJoin(weeklyResult.liveJoin ?? {})
      setClosure(todayResult.closure ?? null)
      setCurrentDay(todayResult.dayOfWeek)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : (sv?.noClasses ?? "Failed to load schedule")
      )
    } finally {
      setIsLoadingData(false)
    }
  }

  // NOTE these live under `studentView`, NOT the `studentViewUi` that `sv`
  // points at — that block has no week/day labels, so reading them off `sv`
  // silently rendered the English fallback on /ar.
  //
  // `week` is its own key rather than the `weekView` ("عرض الأسبوع") that
  // layout.tsx's teacher/guardian tab uses: a segmented control wants one word
  // per half, and renaming the shared key would have relabelled a tab for two
  // roles nobody asked about.
  const RANGE_LABEL: Record<"week" | "day", string> = {
    week: d?.studentView?.week ?? "Week",
    day: d?.studentView?.today ?? "Today",
  }

  // Day mode narrows the SAME grid to one column. Today is normally that
  // column, but a student opening this on a Friday would otherwise get a grid
  // with no days at all — so fall forward to the next working day, which the
  // column header names for itself.
  const visibleDays = (() => {
    if (viewRange === "week" || workingDays.length === 0) return workingDays
    const today = new Date().getDay()
    if (workingDays.includes(today)) return [today]
    for (let offset = 1; offset <= 7; offset++) {
      const candidate = (today + offset) % 7
      if (workingDays.includes(candidate)) return [candidate]
    }
    return workingDays
  })()

  if (error) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 print:space-y-2">
      {/* Declared holiday / cancelled day — informs, never blanks. */}
      {!isLoadingData && (
        <ClosureNotice closure={closure} label={CLOSED_LABEL} />
      )}

      {/* Toolbar + grid. The grid is BARE — no Card wrapper — under
          `space-y-12`, matching AdminView's toolbar-over-grid layout. The
          week/day control follows the pricing page's billing toggle
          (`saas-marketing/pricing/billing-toggle.tsx`) exactly: a two-column
          ToggleGroup with a `bg-muted` thumb sliding under the active half. */}
      <div className="space-y-12">
        <div className="flex items-center gap-5 print:hidden">
          <ToggleGroup
            type="single"
            size="sm"
            value={viewRange}
            onValueChange={(val) => {
              if (!val) return // ignore clearing — clicking the active half
              setPicked(val as "week" | "day")
            }}
            aria-label={RANGE_LABEL.week}
            className="bg-background relative grid h-9 grid-cols-2 overflow-hidden rounded-md border p-0"
          >
            <span
              aria-hidden
              className={cn(
                "bg-muted pointer-events-none absolute inset-y-0 start-0 w-1/2 rounded-md transition-transform duration-200 ease-out",
                // Slide only when the ACTIVE half is the trailing one, whichever
                // mode that happens to be at this width.
                viewRange === ORDER[1]
                  ? "translate-x-full rtl:-translate-x-full"
                  : "translate-x-0"
              )}
            />
            {ORDER.map((mode) => (
              <ToggleGroupItem
                key={mode}
                value={mode}
                className={cn(
                  "z-10 h-9 w-full min-w-[64px] justify-center rounded-md px-3",
                  viewRange === mode
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-background"
                )}
                aria-label={RANGE_LABEL[mode]}
              >
                {RANGE_LABEL[mode]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {isLoadingData || isLoading ? (
          <TimetableGridSkeleton
            workingDays={visibleDays}
            periods={periods}
            className="print:hidden"
          />
        ) : (
          <SimpleGrid
            slots={slots}
            workingDays={visibleDays}
            periods={periods}
            isRTL={isRTL}
            viewMode="class"
            editable={false}
            // Only meaningful when there are other days to contrast against.
            // In day mode the single column IS today, and the highlight is a
            // `bg-primary/5` that tailwind-merge collapses ONTO the subject
            // colour rather than over it — so leaving it on would render the
            // whole day grey instead of admin's coloured cells.
            highlightToday={viewRange === "week"}
            liveIndicators={liveIndicators}
            onSlotInspect={(slot) => setInspectedSlotId(slot.id)}
            // Join is the corner icon now: it replaces the live dot rather
            // than sitting beside it, because in a 128px cell a dot next to a
            // link says the same thing twice. Still time-gated — a target only
            dictionary={{
              period: d?.period,
              break: d?.break,
              days: d?.dayNames,
              conflict: d?.conflict,
              liveNow: d?.liveNow,
              scheduledToday: dictionary?.liveClasses?.status?.scheduled,
            }}
          />
        )}
      </div>
      <SlotDetailDialog
        slotId={inspectedSlotId}
        open={!!inspectedSlotId}
        onOpenChange={(next) => !next && setInspectedSlotId(null)}
        dictionary={dictionary}
        lang={lang}
        liveClass={inspectedSlotId ? (liveJoin[inspectedSlotId] ?? null) : null}
      />
    </div>
  )
}
