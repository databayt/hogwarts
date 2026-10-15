"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Hall passes: who is out of class right now, one row each, with the time
 * left and one action (back). Issuing a pass is the page's one primary
 * button. Refreshes every 30 seconds.
 */
import { useCallback, useEffect, useMemo, useState } from "react"
import { CircleCheck, Ellipsis, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { AttendanceSectionNav } from "../ui/section-nav"
import { cancelHallPass, getActiveHallPasses, returnHallPass } from "./actions"
import { IssuePassDialog } from "./issue-dialog"
import { destinationIcon, destinationLabel } from "./labels"
import type { HallPassDestination } from "./validation"

interface ActivePass {
  id: string
  student: { id: string; name: string; photoUrl?: string | null }
  class: { id: string; name: string }
  destination: HallPassDestination
  destinationNote?: string | null
  issuedAt: Date
  expectedReturn: Date
  expectedDuration: number
  minutesRemaining: number
  hasConflict: boolean
}

interface HallPassContentProps {
  locale: string
}

export function HallPassContent({ locale }: HallPassContentProps) {
  const { dictionary } = useDictionary()
  const t = (dictionary?.attendanceTake?.hallPass ?? {}) as Record<
    string,
    string
  >
  const labels = dictionary?.attendanceTake?.hallPass?.destinations as
    | Record<string, string>
    | undefined
  const [passes, setPasses] = useState<ActivePass[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [issuing, setIssuing] = useState(false)

  const time = useMemo(
    () =>
      new Intl.DateTimeFormat(
        locale === "ar" ? "ar-SA-u-ca-gregory-nu-latn" : "en-US",
        { hour: "numeric", minute: "2-digit" }
      ),
    [locale]
  )
  const num = useMemo(
    () => new Intl.NumberFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-US"),
    [locale]
  )

  const loadPasses = useCallback(async () => {
    const result = await getActiveHallPasses()
    if (result.success && result.data) {
      setPasses(result.data as ActivePass[])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    const first = setTimeout(() => void loadPasses(), 0)
    const interval = setInterval(() => void loadPasses(), 30000)
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [loadPasses])

  const handleReturn = async (passId: string) => {
    const result = await returnHallPass({ passId })
    if (result.success) void loadPasses()
  }

  const handleCancel = async (passId: string) => {
    const result = await cancelHallPass(passId)
    if (result.success) void loadPasses()
  }

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="take" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {isLoading
            ? " "
            : passes.length === 0
              ? (t.noneOut ?? "Everyone is in class.")
              : (t.out ?? "{n} out of class now").replace(
                  "{n}",
                  num.format(passes.length)
                )}
        </p>
        <Button className="rounded-full" onClick={() => setIssuing(true)}>
          <Plus className="size-4" />
          {t.issue ?? "Issue a pass"}
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-muted/50 h-40 animate-pulse rounded-2xl" />
      ) : passes.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-2xl border px-4 py-12 text-center">
          <CircleCheck className="size-8 text-green-600" />
          <p className="font-medium">{t.noneOut ?? "Everyone is in class."}</p>
          <p className="text-muted-foreground text-sm">
            {t.noneOutHint ??
              "Passes you issue show up here until the student is back."}
          </p>
        </div>
      ) : (
        <ul className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
          {passes.map((pass) => {
            const Icon = destinationIcon[pass.destination]
            const overdue = pass.minutesRemaining <= 0
            const soon = !overdue && pass.minutesRemaining <= 2
            return (
              <li
                key={pass.id}
                className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3"
              >
                <span className="bg-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pass.student.name}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {pass.destination === "OTHER" && pass.destinationNote
                      ? pass.destinationNote
                      : destinationLabel(pass.destination, labels)}
                    {pass.class?.name ? ` · ${pass.class.name}` : ""}
                    {" · "}
                    {(t.since ?? "since {time}").replace(
                      "{time}",
                      time.format(new Date(pass.issuedAt))
                    )}
                  </p>
                  {pass.hasConflict ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {t.conflict ?? "Another student is at the same place."}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    overdue
                      ? "text-destructive font-medium"
                      : soon
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                  )}
                >
                  {overdue
                    ? (t.overdue ?? "Overdue")
                    : (t.left ?? "{n} min left").replace(
                        "{n}",
                        num.format(pass.minutesRemaining)
                      )}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    className="rounded-full"
                    onClick={() => void handleReturn(pass.id)}
                  >
                    {t.back ?? "Back"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-full"
                        aria-label={t.more ?? "More"}
                      >
                        <Ellipsis className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => void handleCancel(pass.id)}
                      >
                        {t.cancelPass ?? "Cancel pass"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <IssuePassDialog
        open={issuing}
        onOpenChange={setIssuing}
        locale={locale}
        onSuccess={() => void loadPasses()}
      />
    </div>
  )
}
