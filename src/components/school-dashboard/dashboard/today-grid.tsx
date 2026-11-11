"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useMemo, useState, type ComponentProps } from "react"

import { type Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { JoinLinkButton } from "@/components/school-dashboard/timetable/views/join-link-button"
import SimpleGrid from "@/components/school-dashboard/timetable/views/simple-grid"
import { SlotDetailDialog } from "@/components/school-dashboard/timetable/views/slot-detail-dialog"
import {
  inJoinWindow,
  useNowMs,
} from "@/components/school-dashboard/timetable/views/use-now-ms"
import { useSlotOpen } from "@/components/school-dashboard/timetable/views/use-slot-open"

import { TodayJoinStrip, type TodayJoinRow } from "./today-join-strip"

type GridProps = ComponentProps<typeof SimpleGrid>

/** `joinRows` already says which slots are online (a room, or the policy);
 *  the per-room map /timetable also carries has nothing to add here. */
const NO_ROOMS = {}

/**
 * The dashboard's day grid with its way into a class.
 *
 * A client leaf because Join is a claim about the clock: the server hands over
 * each online class's join window as instants, and this decides "open now"
 * only after mounting (`useNowMs` is `null` before that), so the server render
 * carries no Join and cannot disagree with the reader's device. The pill sits
 * IN the cell, as on /timetable — an online school's reader looks for it on
 * the class itself. The Now strip above stays on phones, where the running
 * class can be rows below the fold.
 *
 * The cell TAP does what it does on /timetable (`useSlotOpen`), at every
 * width: on today's online class inside its window it walks into the class
 * through the slot's join link; on any other cell it opens the slot's detail
 * dialog. One grid, one gesture, wherever it is drawn.
 */
export function TodayGrid({
  slots,
  periods,
  dayOfWeek,
  joinRows,
  lang,
  viewMode,
  labels,
  dictionary,
}: {
  slots: GridProps["slots"]
  periods: GridProps["periods"]
  dayOfWeek: number
  /** Today's online classes; empty on a fallen-forward day. */
  joinRows: TodayJoinRow[]
  lang: Locale
  viewMode: "class" | "teacher"
  labels: { join: string; liveNow: string }
  dictionary: GridProps["dictionary"]
}) {
  const nowMs = useNowMs()
  const windows = useMemo(
    () => new Map(joinRows.map((row) => [row.timetableId, row])),
    [joinRows]
  )
  // The same two facts /timetable hands `useSlotOpen`: which of today's slots
  // are online, and each one's join window as instants.
  const { onlineToday, joinWindows } = useMemo(
    () => ({
      onlineToday: new Set(joinRows.map((row) => row.timetableId)),
      joinWindows: Object.fromEntries(
        joinRows.map((row) => [
          row.timetableId,
          { fromMs: row.fromMs, untilMs: row.untilMs },
        ])
      ),
    }),
    [joinRows]
  )
  const [inspectedSlotId, setInspectedSlotId] = useState<string | null>(null)
  const { open: openSlot } = useSlotOpen({
    lang,
    liveJoin: NO_ROOMS,
    onlineToday,
    joinWindows,
    onInspect: setInspectedSlotId,
  })
  // The dialog reads the whole school dictionary; it is already on the client
  // (the provider), so it is not sent a second time through this island.
  const school = useDictionary().dictionary?.school

  return (
    <>
      {joinRows.length > 0 ? (
        <div className="md:hidden">
          <TodayJoinStrip rows={joinRows} lang={lang} labels={labels} />
        </div>
      ) : null}

      <SimpleGrid
        slots={slots}
        workingDays={[dayOfWeek]}
        periods={periods}
        isRTL={lang === "ar"}
        viewMode={viewMode}
        editable={false}
        // The single column IS the day, so the highlight has nothing to
        // contrast against — and tailwind-merge collapses its `bg-primary/5`
        // onto the subject colour rather than over it, greying the day out.
        highlightToday={false}
        // Deliberately NOT passed: `liveIndicators`. The grid's lamp picks its
        // cell by comparing a LOCAL wall clock against UTC-extracted period
        // bounds during render — fine on /timetable, which mounts after a
        // client fetch, but this grid is server-rendered (server UTC, reader
        // Khartoum), so the lamp would be a hydration mismatch every school
        // day.
        onSlotInspect={openSlot}
        renderSlotAction={(slot) =>
          inJoinWindow(nowMs, windows.get(slot.id)) ? (
            <JoinLinkButton
              timetableId={slot.id}
              lang={lang}
              label={labels.join}
            />
          ) : null
        }
        dictionary={dictionary}
      />
      {school ? (
        <SlotDetailDialog
          slotId={inspectedSlotId}
          open={!!inspectedSlotId}
          onOpenChange={(next) => !next && setInspectedSlotId(null)}
          dictionary={school}
          lang={lang}
        />
      ) : null}
    </>
  )
}
