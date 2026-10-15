"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Today for students and guardians — a concise summary per child (rate,
 * absences, the last five school days). The full history is Records.
 */
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  statsOf,
  STATUS_TONE,
  toDays,
  useFamilyAttendance,
  type FamilyPerson,
} from "./family"
import { formatCount, formatDay, plural } from "./format"

interface Props {
  locale: Locale
  subdomain: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

export function StudentGuardianOverview({ locale }: Props) {
  const { dictionary } = useDictionary()
  const t = ((dictionary as Dict | undefined)?.attendanceToday?.family ??
    {}) as Dict
  const status = ((dictionary as Dict | undefined)?.attendanceHub?.status ??
    {}) as Record<string, string>
  const { loading, people, unexcused, failed } = useFamilyAttendance()

  if (loading) return <FamilySkeleton />

  if (failed || !people || people.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {failed
          ? (t.loadFailed ?? "Attendance couldn't load.")
          : (t.noData ?? "No attendance to show yet.")}
      </p>
    )
  }

  return (
    <div className="grid max-w-4xl gap-4 md:grid-cols-2">
      {people.map((person) => (
        <PersonCard
          key={person.id}
          person={person}
          locale={locale}
          t={t}
          status={status}
          needExcuse={
            [...unexcused.values()].filter((sid) => sid === person.id).length
          }
        />
      ))}
    </div>
  )
}

function PersonCard({
  person,
  locale,
  t,
  status,
  needExcuse,
}: {
  person: FamilyPerson
  locale: Locale
  t: Dict
  status: Record<string, string>
  needExcuse: number
}) {
  const days = toDays(person.records)
  const stats = statsOf(days)
  const lastFive = days.slice(0, 5).reverse()
  const section = person.records[0]?.sectionName
  const base = `/${locale}/attendance`
  const n = (v: number) => formatCount(v, locale)

  return (
    <section className="bg-card overflow-hidden rounded-2xl border">
      <div className="space-y-5 p-5">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">
            {person.name ?? t.self ?? "My attendance"}
          </h2>
          {section ? (
            <p className="text-muted-foreground truncate text-xs">{section}</p>
          ) : null}
        </div>

        {stats.days === 0 ? (
          <p className="text-muted-foreground text-sm">
            {t.noRecords ?? "No attendance recorded yet."}
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-semibold tracking-tight tabular-nums">
                  <bdi>{n(stats.rate)}%</bdi>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {plural(t.ofDays, stats.days, locale)}
                </p>
              </div>
              <dl className="flex gap-5 text-end">
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t.absences ?? "Absences"}
                  </dt>
                  <dd
                    className={cn(
                      "text-lg font-semibold tabular-nums",
                      stats.absent > 0 && "text-destructive"
                    )}
                  >
                    {n(stats.absent)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    {t.late ?? "Late"}
                  </dt>
                  <dd className="text-lg font-semibold tabular-nums">
                    {n(stats.late)}
                  </dd>
                </div>
              </dl>
            </div>

            <div>
              <p className="text-muted-foreground mb-2 text-xs">
                {t.lastDays ?? "Last school days"}
              </p>
              <ol className="flex gap-2">
                {lastFive.map((day) => (
                  <li
                    key={day.date}
                    className="flex flex-1 flex-col items-center gap-1.5"
                    title={`${formatDay(day.date, locale)} · ${status[day.status] ?? day.status}`}
                  >
                    <span
                      className={cn(
                        "size-3 rounded-full",
                        STATUS_TONE[day.status]?.dot ?? "bg-muted"
                      )}
                    />
                    <span className="text-muted-foreground text-[11px]">
                      {formatDay(day.date, locale, { weekday: "short" })}
                    </span>
                    <span className="sr-only">
                      {status[day.status] ?? day.status}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>

      <div className="divide-border/60 divide-y border-t">
        {needExcuse > 0 ? (
          <Link
            href={`${base}/excuses`}
            className="hover:bg-muted/50 text-destructive flex min-h-11 items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <span className="flex-1">
              {plural(t.needExcuse, needExcuse, locale)}
            </span>
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Link>
        ) : null}
        <Link
          href={`${base}/records`}
          className="hover:bg-muted/50 flex min-h-11 items-center gap-3 px-5 py-2.5 text-sm transition-colors"
        >
          <span className="flex-1">{t.allRecords ?? "All records"}</span>
          <ChevronRight className="text-muted-foreground size-4 rtl:rotate-180" />
        </Link>
      </div>
    </section>
  )
}

function FamilySkeleton() {
  return (
    <div className="grid max-w-4xl gap-4 md:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-5 rounded-2xl border p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-24" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((__, j) => (
              <Skeleton key={j} className="h-6 flex-1" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
