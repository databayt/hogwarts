// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"

import { MakeupBadge } from "@/components/school-dashboard/live/makeup-badge"
import type { UpcomingMakeup } from "@/components/school-dashboard/timetable/today-schedule"

/**
 * «حصص تعويضية قادمة» — the viewer's make-up classes for the coming week, above
 * the weekly grid. A make-up has no timetable slot, so the grid cannot draw it;
 * this strip is where it shows. Renders nothing for an empty list — no heading,
 * no reserved space.
 *
 * Presentational and server-safe: the data is the streamed `initialToday` or the
 * refresh's `getTodaySchedule()`, never a fetch of its own. The day and time are
 * formatted in the SCHOOL's zone (each item carries it), never the device's.
 */
export function MakeupStrip({
  items,
  lang,
  title,
  badge,
  showClass,
}: {
  items: UpcomingMakeup[] | undefined
  lang: string
  title: string | undefined
  badge: string | undefined
  /** A teacher teaches several sections, so the section name tells the rows apart. */
  showClass: boolean
}) {
  if (!items || items.length === 0) return null

  const locale = lang === "ar" ? "ar" : "en-US"
  return (
    <section
      className="space-y-2 print:hidden"
      aria-label={title}
      data-slot="makeup-strip"
    >
      {title ? <h2 className="text-sm font-medium">{title}</h2> : null}
      <ul className="space-y-2">
        {items.map((m) => {
          const when = new Intl.DateTimeFormat(locale, {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
            timeZone: m.timeZone,
          }).format(new Date(m.scheduledStart))
          const name =
            showClass && m.className
              ? `${m.subject} · ${m.className}`
              : m.subject
          return (
            <li key={m.id}>
              <Link
                href={`/${lang}/live/${m.id}`}
                className="hover:bg-muted/50 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2"
              >
                <MakeupBadge label={badge} />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {name}
                </span>
                <span className="text-muted-foreground text-xs">{when}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
