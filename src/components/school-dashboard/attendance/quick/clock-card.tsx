"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useState, useTransition } from "react"
import { CheckCircle2, LogIn, LogOut, Timer } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

import type { ClockStatus } from "../actions/clock"
import { clockIn, clockOut, getMyClockStatus } from "../actions/clock"

interface ClockCardProps {
  locale: string
  dictionary?: Record<string, string>
}

/**
 * Self-service check-in/check-out for teachers and staff, writing to their
 * timesheet system of record (StaffTimesheetEntry / finance TimesheetEntry).
 * Renders nothing when the signed-in user has no teacher/staff identity.
 */
export function ClockCard({ locale, dictionary }: ClockCardProps) {
  const t = dictionary ?? {}
  const [status, setStatus] = useState<ClockStatus | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getMyClockStatus().then((res) => {
      if (res.success && res.data) setStatus(res.data)
      setLoaded(true)
    })
  }, [])

  if (loaded && !status?.available) return null

  const timeFormatter = new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const fmt = (template: string, key: string, value: string) =>
    template.replace(`{${key}}`, value)

  const checkedIn = Boolean(status?.checkedInAt)
  const checkedOut = Boolean(status?.checkedOutAt)

  function onClock(action: "in" | "out") {
    startTransition(async () => {
      const res = action === "in" ? await clockIn() : await clockOut()
      if (res.success && res.data) {
        setStatus(res.data)
      } else {
        toast.error(
          action === "in"
            ? (t.checkInFailed ?? "Check-in failed")
            : (t.checkOutFailed ?? "Check-out failed")
        )
      }
    })
  }

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="bg-muted rounded-full p-2.5">
            <Timer className="text-muted-foreground h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t.title ?? "My day"}</p>
            {!loaded ? (
              <Skeleton className="mt-1 h-4 w-32" />
            ) : (
              <p className="text-muted-foreground truncate text-xs">
                {checkedOut && status?.checkedOutAt
                  ? fmt(
                      t.checkedOutAt ?? "Checked out {time}",
                      "time",
                      timeFormatter.format(new Date(status.checkedOutAt))
                    )
                  : checkedIn && status?.checkedInAt
                    ? fmt(
                        t.checkedInAt ?? "Checked in {time}",
                        "time",
                        timeFormatter.format(new Date(status.checkedInAt))
                      )
                    : null}
                {(checkedIn || checkedOut) && " · "}
                {fmt(
                  t.weekHours ?? "{hours}h this week",
                  "hours",
                  String(status?.weekHours ?? 0)
                )}
              </p>
            )}
          </div>
        </div>

        {!loaded ? (
          <Skeleton className="h-9 w-24" />
        ) : checkedOut ? (
          <span className="text-muted-foreground inline-flex items-center gap-1.5 text-sm">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            {t.done ?? "Day complete"}
          </span>
        ) : checkedIn ? (
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => onClock("out")}
          >
            <LogOut className="me-1.5 h-4 w-4 rtl:rotate-180" />
            {t.checkOut ?? "Check out"}
          </Button>
        ) : (
          <Button size="sm" disabled={isPending} onClick={() => onClock("in")}>
            <LogIn className="me-1.5 h-4 w-4 rtl:rotate-180" />
            {t.checkIn ?? "Check in"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
