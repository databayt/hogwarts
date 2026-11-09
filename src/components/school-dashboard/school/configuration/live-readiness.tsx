"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import { AlertCircle, CheckCircle2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import type { LiveTodaySummary } from "@/components/school-dashboard/live/live-today"

import { SettingsGroup, SettingsRow } from "./ui/settings-group"

type Copy = Partial<{
  title: string
  footer: string
  roomsOk: string
  roomsMissing: string
  roomsMissingHint: string
  slotsNone: string
  slotsNoneHint: string
  onlineSome: string
  onlineNone: string
  onlineNoneHint: string
  loginsOk: string
  loginsMissing: string
  loginsMissingHint: string
  reminders: string
  attendanceOn: string
  attendanceOff: string
  liveNow: string
  fix: string
  change: string
}>

const fill = (s: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
    s
  )

/**
 * "Ready for today": one row per thing that decides whether a live class
 * actually opens today. A ✗ row carries the one link that fixes it. This is
 * the checklist the alabidae go-live (2026-11-09) needed and did not have.
 * The school was set to Live, but five teachers had no login, so nobody could
 * start those classes.
 */
export function LiveReadiness({
  summary: s,
  lang,
}: {
  summary: LiveTodaySummary
  lang: string
}) {
  const dictionary = useDictionaryFallback()
  const t: Copy =
    (
      dictionary?.schoolSettings?.teachingMode as
        | { readiness?: Copy }
        | undefined
    )?.readiness ?? {}

  const rows: Array<{
    ok: boolean
    label: string
    hint?: string
    href?: string
  }> = []

  rows.push(
    s.roomsReady
      ? { ok: true, label: t.roomsOk ?? "Classroom video service is connected" }
      : {
          ok: false,
          label: t.roomsMissing ?? "Classroom video service is not connected",
          hint:
            t.roomsMissingHint ??
            "Classes will only open through a meeting link until the platform connects it. Contact support.",
        }
  )

  if (s.slotsToday === 0) {
    rows.push({
      ok: false,
      label: t.slotsNone ?? "No classes on today's timetable",
      hint:
        t.slotsNoneHint ??
        "A live class is a timetable class. Build or publish the timetable first.",
      href: "/timetable",
    })
  } else if (s.onlineToday === 0) {
    rows.push({
      ok: false,
      label: t.onlineNone ?? "None of today's classes are online",
      hint:
        t.onlineNoneHint ??
        "In hybrid mode, choose the grades or sections that go live.",
      href: "/school/configuration/live-classes",
    })
  } else {
    rows.push({
      ok: true,
      label: fill(t.onlineSome ?? "{n} of today's {total} classes are live", {
        n: s.onlineToday,
        total: s.slotsToday,
      }),
      hint: s.nextStart
        ? fill(t.liveNow ?? "Next one starts at {time}", { time: s.nextStart })
        : undefined,
    })
  }

  if (s.onlineToday > 0) {
    rows.push(
      s.noTeacherLogin === 0
        ? {
            ok: true,
            label: t.loginsOk ?? "Every teacher can start their class",
          }
        : {
            ok: false,
            label: fill(
              t.loginsMissing ??
                "{n} classes can't start: {teachers} teachers have no login",
              { n: s.noTeacherLogin, teachers: s.teachersWithoutLogin }
            ),
            hint:
              t.loginsMissingHint ??
              "Issue a login from the teacher's page so they can start the class.",
            href: "/teachers",
          }
    )
  }

  rows.push({
    ok: true,
    label: fill(
      t.reminders ?? "Students and guardians are notified {n} min before",
      { n: s.reminderLeadMinutes }
    ),
    href: "/school/configuration/live-classes",
  })

  rows.push({
    ok: s.attendanceSync,
    label: s.attendanceSync
      ? (t.attendanceOn ?? "Attendance is taken from who joined")
      : (t.attendanceOff ?? "Attendance is not taken automatically"),
    href: s.attendanceSync ? undefined : "/school/configuration/live-classes",
  })

  return (
    <SettingsGroup title={t.title ?? "Ready for today"} footer={t.footer}>
      {rows.map((r) => (
        <SettingsRow
          key={r.label}
          icon={
            r.ok ? (
              <CheckCircle2 className="text-[#00a35e]" />
            ) : (
              <AlertCircle className="text-amber-600" />
            )
          }
          label={r.label}
          description={r.hint}
        >
          {r.href ? (
            <Link
              href={`/${lang}${r.href}`}
              className={cn(
                "shrink-0 text-sm hover:underline",
                r.ok ? "text-muted-foreground" : "text-primary font-medium"
              )}
            >
              {r.ok ? (t.change ?? "Change") : (t.fix ?? "Fix")}
            </Link>
          ) : null}
        </SettingsRow>
      ))}
    </SettingsGroup>
  )
}
