"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { TriangleAlert } from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { type Locale } from "@/components/internationalization/config"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import { useSchoolTimeZone } from "@/components/school-dashboard/context/school-context"

import {
  getTimetableByStudentGrade,
  getTimetableByTeacher,
  getTodaySchedule,
} from "../actions"
import { schoolNow } from "../school-now"
import type { UpcomingMakeup } from "../today-schedule"
import { TimetableGridSkeleton } from "./grid-skeleton"
import {
  ClosureNotice,
  type LiveClassJoinInfo,
  type SchoolClosureInfo,
} from "./live-join-button"
import { MakeupStrip } from "./makeup-strip"
import type { InitialToday, InitialWeekly } from "./role-router"
import SimpleGrid from "./simple-grid"
import { SlotDetailDialog } from "./slot-detail-dialog"
import { SlotJoinAction } from "./slot-join-action"
import { useSlotOpen } from "./use-slot-open"

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
    untimed?: boolean
  }>
  lunchAfterPeriod: number | null
  isLoading?: boolean
  /**
   * Set for a TEACHER: the same surface, fed the teacher's own week instead
   * of a section's. The cells then name the section that walks in (the
   * grid's "teacher" mode), and a period with no room yet in a school that
   * teaches live offers Start. Everything else — the week/day toggle, the
   * bare grid, the phone's single day — is the student's, on purpose: the
   * teacher's separate page (header card, workload chips, Today list) drew
   * the same week in a second shape and was retired on 2026-11-11.
   */
  teacherId?: string
  /**
   * The viewer's week and today's closure, streamed with the page (see
   * `loadInitialTimetable`). When both are present the view starts on them and
   * fires no server action on mount; the load effect still runs for any later
   * change (another term, another teacher, a retry).
   */
  initialGrid?: InitialWeekly
  initialToday?: InitialToday
}

// `termInfo` and `lunchAfterPeriod` still arrive via RoleRouter's `commonProps`
// spread; the student surface stopped rendering a term badge and a lunch label
// when the header card went, so they are deliberately not destructured here.
export default function StudentView({
  dictionary,
  lang,
  termId,
  workingDays,
  periods: schoolPeriods,
  isLoading,
  teacherId,
  initialGrid,
  initialToday,
}: Props) {
  const isTeacher = !!teacherId
  const timeZone = useSchoolTimeZone()
  // The streamed first screen is usable only whole: the week without today's
  // closure would paint a grid that might sit on a declared holiday.
  const seed = initialGrid && initialToday ? initialGrid : null
  // The load key the seed answers for. An effect pass for THIS key is skipped;
  // any other key (term / teacher changed) loads as before. Never reset, so a
  // StrictMode re-run of the effect cannot fire the fetch the seed replaced.
  const seededKey = useRef(seed ? `${termId}|${teacherId ?? ""}` : null)
  const d = dictionary?.timetable as Record<string, any> | undefined
  const sv = (d as Record<string, any>)?.studentViewUi
  const CLOSED_LABEL =
    (d as Record<string, any>)?.closedToday ?? "School is closed today"
  const isRTL = lang === "ar"

  // Starts TRUE: the fetch is kicked off from an effect, which React runs after
  // the first paint, so seeding this `false` painted one frame of the real grid
  // with no slots in it — a full week of "-" cells — before the skeleton
  // replaced it. The component has nothing to show until `loadData` returns, so
  // say so from the first render.
  // With the streamed seed there is nothing to wait for, so it starts false.
  const [isLoadingData, setIsLoadingData] = useState(!seed)
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
  const [picked, setPickedState] = useState<"week" | "day" | null>(null)
  // The toggle repaints a whole grid; mark it a transition so the tap itself
  // (the thumb sliding) answers first.
  const [, startToggle] = useTransition()
  const setPicked = useCallback(
    (next: "week" | "day" | null) => startToggle(() => setPickedState(next)),
    []
  )
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
  const [slots, setSlots] = useState<any[]>(() => seed?.slots ?? [])
  // The grid's own bell, from the fetch: grades ring different bells, so the
  // school-wide list from the router is only the fallback until it lands.
  const [gridPeriods, setGridPeriods] = useState<typeof schoolPeriods | null>(
    () => (seed && seed.periods.length > 0 ? seed.periods : null)
  )
  const periods = gridPeriods ?? schoolPeriods
  const [liveIndicators, setLiveIndicators] = useState<
    Record<string, "live" | "scheduled">
  >(() => seed?.liveIndicators ?? {})
  const [liveJoin, setLiveJoin] = useState<Record<string, LiveClassJoinInfo>>(
    () => seed?.liveJoin ?? {}
  )
  // Today's slots that are online by policy, row or no row yet.
  const [onlineToday, setOnlineToday] = useState<ReadonlySet<string>>(
    () => new Set(seed?.onlineToday ?? [])
  )
  // Today's join windows as instants, from the server (school zone).
  const [joinWindows, setJoinWindows] = useState<
    Record<string, { fromMs: number; untilMs: number }>
  >(() => seed?.joinWindows ?? {})
  // Teacher only: whether the school teaches live at all (its teaching mode).
  // An in-person school offers no Start — Join to an existing room is never
  // gated on it.
  const [liveEnabled, setLiveEnabled] = useState(() =>
    seed && "liveEnabled" in seed ? (seed.liveEnabled ?? false) : false
  )
  const startErrorLabel =
    dictionary?.liveClasses?.startError ??
    (isRTL ? "تعذّر بدء البث المباشر" : "Couldn't start the live class")
  // Which cell the reader opened. The grid is read-only here, so a click means
  // "tell me about this", not "let me change it".
  const [inspectedSlotId, setInspectedSlotId] = useState<string | null>(null)
  // A click on today's live cell IS the join; any other cell opens the dialog.
  const { open: openSlot } = useSlotOpen({
    lang,
    liveJoin,
    onlineToday,
    joinWindows,
    onInspect: setInspectedSlotId,
    // A teacher's tap inside the window, with no room yet, starts the class.
    canStart: isTeacher && liveEnabled,
    startErrorLabel,
  })
  // A JOIN the reader can SEE. The cell tap above already joins, but nothing
  // said so: on 2026-11-08 an alabidae student on a 360px phone reported «ما
  // قادر ادخل الحصه» from this exact grid (hogwarts#469). Today's class inside
  // its window — a room, a standing link, or an online section whose room the
  // link will open — now carries a labelled pill.
  const joinLabel = dictionary?.liveClasses?.join ?? (isRTL ? "انضمام" : "Join")
  // The clock lives in `SlotJoinAction`, a leaf per cell: a 30 s tick
  // re-renders the cells' pills, not this view or the grid. The callback keeps
  // its identity until the join inputs change, so the memoized grid is not
  // re-rendered by anything else this view does.
  const startLabel =
    dictionary?.liveClasses?.start ??
    (isRTL ? "بدء البث المباشر" : "Start live class")
  const startingLabel =
    dictionary?.liveClasses?.starting ?? (isRTL ? "جارٍ البدء…" : "Starting…")
  const renderJoin = useCallback(
    (slot: { id: string }) => (
      <SlotJoinAction
        slotId={slot.id}
        lang={lang}
        window={joinWindows[slot.id]}
        joinable={!!liveJoin[slot.id] || onlineToday.has(slot.id)}
        canStart={isTeacher && liveEnabled}
        joinLabel={joinLabel}
        startLabel={startLabel}
        startingLabel={startingLabel}
        errorLabel={startErrorLabel}
      />
    ),
    [
      lang,
      joinWindows,
      liveJoin,
      onlineToday,
      isTeacher,
      liveEnabled,
      joinLabel,
      startLabel,
      startingLabel,
      startErrorLabel,
    ]
  )

  // Today's schedule is fetched for its CLOSURE only — the day list and the
  // current/next card it used to feed are both gone, but a declared holiday
  // still has to be announced above the grid.
  const [closure, setClosure] = useState<SchoolClosureInfo>(
    () => initialToday?.closure ?? null
  )
  // The viewer's make-up classes for the coming week: seeded by the stream,
  // refreshed by the same getTodaySchedule() call as the closure — no fetch of
  // its own.
  const [upcomingMakeups, setUpcomingMakeups] = useState<UpcomingMakeup[]>(
    () => initialToday?.upcomingMakeups ?? []
  )
  const [currentDay, setCurrentDay] = useState<number>(
    () => initialToday?.dayOfWeek ?? schoolNow(timeZone).dayOfWeek
  )

  // Load data — except the pass the streamed seed already answered.
  useEffect(() => {
    if (seededKey.current === `${termId}|${teacherId ?? ""}`) return
    loadData()
  }, [termId, teacherId])

  const loadData = async () => {
    setIsLoadingData(true)
    setError(null)

    try {
      const [weeklyResult, todayResult] = await Promise.all([
        teacherId
          ? getTimetableByTeacher({ termId, teacherId })
          : getTimetableByStudentGrade({ termId }),
        getTodaySchedule(),
      ])

      setSlots(weeklyResult.slots)
      setGridPeriods(
        weeklyResult.periods.length > 0 ? weeklyResult.periods : null
      )
      setLiveIndicators(weeklyResult.liveIndicators ?? {})
      setLiveJoin(weeklyResult.liveJoin ?? {})
      setOnlineToday(new Set(weeklyResult.onlineToday ?? []))
      setJoinWindows(weeklyResult.joinWindows ?? {})
      setLiveEnabled(
        "liveEnabled" in weeklyResult
          ? (weeklyResult.liveEnabled ?? false)
          : false
      )
      setClosure(todayResult.closure ?? null)
      setUpcomingMakeups(todayResult.upcomingMakeups ?? [])
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
  const visibleDays = useMemo(() => {
    if (viewRange === "week" || workingDays.length === 0) return workingDays
    const today = schoolNow(timeZone).dayOfWeek
    if (workingDays.includes(today)) return [today]
    for (let offset = 1; offset <= 7; offset++) {
      const candidate = (today + offset) % 7
      if (workingDays.includes(candidate)) return [candidate]
    }
    return workingDays
  }, [viewRange, workingDays, timeZone])

  // Stable props for the memoized grid: a render of this view that changes
  // none of the grid's inputs (the week/day thumb, the dialog opening) must
  // not repaint ~50 cells.
  const gridDictionary = useMemo(
    () => ({
      period: d?.period,
      break: d?.break,
      days: d?.dayNames,
      conflict: d?.conflict,
      liveNow: d?.liveNow,
      scheduledToday: dictionary?.liveClasses?.status?.scheduled,
    }),
    [d, dictionary?.liveClasses?.status?.scheduled]
  )
  const openSlotRef = useRef(openSlot)
  openSlotRef.current = openSlot
  const onSlotInspect = useCallback<typeof openSlot>(
    (slot, period) => openSlotRef.current(slot, period),
    []
  )

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

      {/* Make-up classes («حصص تعويضية قادمة») — they have no slot, so the grid
          cannot draw them. Nothing renders when there are none. */}
      {!isLoadingData && (
        <MakeupStrip
          items={upcomingMakeups}
          lang={lang}
          title={d?.studentView?.makeupTitle}
          badge={dictionary?.liveClasses?.landing?.makeupBadge}
          showClass={isTeacher}
        />
      )}

      {/* Toolbar + grid. The grid is BARE — no Card wrapper — under
          `space-y-12`, matching AdminView's toolbar-over-grid layout. The
          week/day control is the pricing page's former monthly/yearly
          toggle, kept here: a two-column ToggleGroup with a `bg-muted` thumb
          sliding under the active half. */}
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
          // Until the student picks a half, the mode follows the viewport — so
          // the placeholder has to as well, and it cannot ask `matchMedia`: that
          // is unreadable before mount, which is exactly when this renders. Hand
          // the skeleton the whole week and let a media query collapse it to one
          // column below `md`, the same 767px boundary `isNarrow` watches. An
          // explicit pick is width-independent, so that case narrows the days
          // themselves and leaves the media query out of it.
          <TimetableGridSkeleton
            workingDays={picked === null ? workingDays : visibleDays}
            periods={periods}
            collapseToDayOnMobile={picked === null}
            className="print:hidden"
          />
        ) : (
          <SimpleGrid
            slots={slots}
            workingDays={visibleDays}
            periods={periods}
            isRTL={isRTL}
            viewMode={isTeacher ? "teacher" : "class"}
            editable={false}
            // Only meaningful when there are other days to contrast against.
            // In day mode the single column IS today, and the highlight is a
            // `bg-primary/5` that tailwind-merge collapses ONTO the subject
            // colour rather than over it — so leaving it on would render the
            // whole day grey instead of admin's coloured cells.
            highlightToday={viewRange === "week"}
            liveIndicators={liveIndicators}
            onSlotInspect={onSlotInspect}
            renderSlotAction={renderJoin}
            dictionary={gridDictionary}
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
