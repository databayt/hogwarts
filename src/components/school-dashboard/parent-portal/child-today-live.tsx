"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { type Locale } from "@/components/internationalization/config"
import {
  ClosureNotice,
  isRowLiveJoinable,
  LiveJoinButton,
  OnlineBadge,
  type LiveClassJoinInfo,
  type SchoolClosureInfo,
} from "@/components/school-dashboard/timetable/views/live-join-button"

export interface ChildTodayRow {
  periodId: string
  periodName: string
  startTime: Date | string
  endTime: Date | string
  subject: string
  teacher: string
  room: string
  isBreak: boolean
  liveClass?: LiveClassJoinInfo | null
}

interface Props {
  rows: ChildTodayRow[]
  closure: SchoolClosureInfo
  lang: Locale
  labels: {
    title: string
    description: string
    online: string
    join: string
    empty: string
    closed: string
  }
}

function formatTime(value: Date | string): string {
  const d = new Date(value)
  // Period bounds are stored as UTC wall-clock (Date.UTC(1970,0,1,h,m)) — read
  // them back the same way, exactly as the timetable grid does. A local-time
  // read here would shift every row by the reader's offset.
  const h = String(d.getUTCHours()).padStart(2, "0")
  const m = String(d.getUTCMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

/**
 * "Is my child's class online right now, and where do I click?" — the question
 * the Parent Portal could not answer.
 *
 * The portal's weekly timetable is a read-only table with no live-class
 * awareness at all, and guardians have no "Timetable" entry in the sidebar, so
 * the join-capable `guardian-view` was reachable only by typing the URL. This
 * strip sits above that table and closes the gap without duplicating it: today
 * only, because that is the only day a live session can exist for.
 */
export function ChildTodayLive({ rows, closure, lang, labels }: Props) {
  const teaching = rows.filter((r) => !r.isBreak && r.subject)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ClosureNotice closure={closure} label={labels.closed} />
        {teaching.length === 0 ? (
          <p className="text-muted-foreground text-sm">{labels.empty}</p>
        ) : (
          <ul className="divide-border divide-y">
            {teaching.map((row) => (
              <li
                key={row.periodId}
                className="flex flex-wrap items-center gap-3 py-2"
              >
                <span className="text-muted-foreground w-24 shrink-0 font-mono text-xs">
                  {formatTime(row.startTime)} – {formatTime(row.endTime)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{row.subject}</span>
                  <span className="text-muted-foreground ms-2 text-sm">
                    {[row.teacher, row.room].filter(Boolean).join(" · ")}
                  </span>
                  <OnlineBadge
                    liveClass={row.liveClass}
                    label={labels.online}
                  />
                </span>
                {isRowLiveJoinable(row.startTime, row.endTime) && (
                  <LiveJoinButton
                    liveClass={row.liveClass}
                    lang={lang}
                    label={labels.join}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
