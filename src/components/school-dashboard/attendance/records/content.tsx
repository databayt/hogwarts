"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Records — the full attendance history for a student or a guardian's
 * children, one row per mark. Today holds the summary; this is the ledger.
 */
import { useMemo, useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { STATUS_TONE, useFamilyAttendance } from "../overview/family"
import { formatCount, formatDay, plural } from "../overview/format"

interface Props {
  locale: Locale
  subdomain: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>
type Filter = "all" | "absent" | "late"

const PAGE = 40

export function RecordsContent({ locale }: Props) {
  const { dictionary } = useDictionary()
  const root = (dictionary as Dict | undefined)?.attendanceToday as
    | Dict
    | undefined
  const t = (root?.records ?? {}) as Dict
  const status = ((dictionary as Dict | undefined)?.attendanceHub?.status ??
    {}) as Record<string, string>
  const { loading, people, unexcused, isGuardian, failed } =
    useFamilyAttendance()
  const [personId, setPersonId] = useState<string | null>(null)
  const [filter, setFilter] = useState<Filter>("all")
  const [limit, setLimit] = useState(PAGE)

  const person = people?.find((p) => p.id === personId) ?? people?.[0]
  const rows = useMemo(() => {
    const all = [...(person?.records ?? [])].sort((a, b) =>
      b.date.localeCompare(a.date)
    )
    if (filter === "absent") return all.filter((r) => r.status === "ABSENT")
    if (filter === "late") return all.filter((r) => r.status === "LATE")
    return all
  }, [person, filter])

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <Skeleton className="h-8 w-64 rounded-full" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  if (failed || !people || !person) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {root?.family?.loadFailed ?? "Attendance couldn't load."}
      </p>
    )
  }

  const visible = rows.slice(0, limit)

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {people.length > 1 ? (
          <Segmented
            value={person.id}
            onValueChange={(v) => {
              setPersonId(v)
              setLimit(PAGE)
            }}
            options={people.map((p) => ({
              value: p.id,
              label: p.name ?? "",
            }))}
          />
        ) : null}
        <Segmented<Filter>
          value={filter}
          onValueChange={(v) => {
            setFilter(v)
            setLimit(PAGE)
          }}
          options={[
            { value: "all", label: t.all ?? "All" },
            { value: "absent", label: t.absent ?? "Absences" },
            { value: "late", label: t.late ?? "Late" },
          ]}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-muted-foreground px-4 text-xs font-medium">
          {plural(t.count, rows.length, locale)}
        </h2>
        <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
          {visible.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">
              {t.empty ?? "Nothing to show here."}
            </p>
          ) : (
            visible.map((r) => {
              const needsExcuse = isGuardian && unexcused.has(r.id)
              return (
                <div
                  key={r.id}
                  className="flex min-h-12 items-center gap-3 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {formatDay(r.date, locale, {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {r.sectionName ? (
                      <p className="text-muted-foreground truncate text-xs">
                        {r.sectionName}
                      </p>
                    ) : null}
                  </div>
                  {needsExcuse ? (
                    <Link
                      href={`/${locale}/attendance/excuses`}
                      className="text-primary text-xs font-medium hover:underline"
                    >
                      {t.submitExcuse ?? "Submit excuse"}
                    </Link>
                  ) : null}
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      STATUS_TONE[r.status]?.pill ??
                        "bg-muted text-muted-foreground"
                    )}
                  >
                    {status[r.status] ?? r.status}
                  </span>
                </div>
              )
            })
          )}
        </div>
        {rows.length > limit ? (
          <div className="px-4">
            <button
              type="button"
              onClick={() => setLimit(rows.length)}
              className="text-primary text-xs font-medium hover:underline"
            >
              {root?.today?.showAll ?? "Show all"} (
              {formatCount(rows.length, locale)})
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}
