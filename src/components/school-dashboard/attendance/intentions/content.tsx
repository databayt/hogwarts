// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Planned absences. Staff review the school's queue (pending first);
 * guardians plan an absence for their children and follow its status.
 */
"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { getParentAttendanceSummary } from "../actions/dashboard"
import { formatInstant, plural } from "../overview/format"
import { AttendanceSectionNav } from "../ui/section-nav"
import {
  getAbsenceIntentions,
  getStudentIntentions,
  reviewAbsenceIntention,
} from "./actions"
import { IntentionSubmitForm } from "./submit-form"

interface IntentionsContentProps {
  locale?: string
  schoolId: string
  /** STAFF roles review; GUARDIAN plans. */
  mode?: "staff" | "guardian"
}

interface Intention {
  id: string
  studentName?: string
  dateFrom: Date
  dateTo: Date
  daysCount: number
  reason: string
  description: string | null
  status: string
  reviewNotes: string | null
}

type Filter = "ALL" | "PENDING" | "APPROVED" | "REJECTED"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

export default function IntentionsContent({
  locale = "ar",
  mode = "staff",
}: IntentionsContentProps) {
  return (
    <div className="max-w-3xl space-y-6">
      <AttendanceSectionNav group="excuses" />
      {mode === "staff" ? (
        <StaffIntentions locale={locale} />
      ) : (
        <GuardianIntentions locale={locale} />
      )}
    </div>
  )
}

function useT(): Dict {
  const { dictionary } = useDictionary()
  return ((dictionary as Dict | undefined)?.attendanceToday?.intentions ??
    {}) as Dict
}

function dateRange(i: Intention, locale: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }
  const from = formatInstant(i.dateFrom, locale, opts)
  const to = formatInstant(i.dateTo, locale, opts)
  return from === to ? from : `${from} – ${to}`
}

function StatusPill({ status, t }: { status: string; t: Dict }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        status === "APPROVED"
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : status === "REJECTED"
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-muted-foreground"
      )}
    >
      {t.status?.[status] ?? status}
    </span>
  )
}

function IntentionRow({
  intention,
  locale,
  t,
  trailing,
}: {
  intention: Intention
  locale: string
  t: Dict
  trailing: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="min-w-0 flex-1 space-y-0.5">
        {intention.studentName ? (
          <p className="truncate text-sm font-medium">
            {intention.studentName}
          </p>
        ) : null}
        <p
          className={cn(
            "truncate",
            intention.studentName
              ? "text-muted-foreground text-xs"
              : "text-sm font-medium"
          )}
        >
          {[
            dateRange(intention, locale),
            plural(t.days, intention.daysCount, locale),
            t.reasons?.[intention.reason] ?? intention.reason,
          ].join(" · ")}
        </p>
        {intention.description ? (
          <p className="text-muted-foreground line-clamp-2 text-xs">
            {intention.description}
          </p>
        ) : null}
        {intention.reviewNotes ? (
          <p className="text-muted-foreground truncate text-xs">
            {intention.reviewNotes}
          </p>
        ) : null}
      </div>
      {trailing}
    </div>
  )
}

// --- Staff: the review queue ---

function StaffIntentions({ locale }: { locale: string }) {
  const t = useT()
  const [filter, setFilter] = React.useState<Filter>("PENDING")
  const [rows, setRows] = React.useState<Intention[] | null>(null)
  const [failed, setFailed] = React.useState(false)
  const [selected, setSelected] = React.useState<Intention | null>(null)
  const [action, setAction] = React.useState<"APPROVED" | "REJECTED">(
    "APPROVED"
  )
  const [notes, setNotes] = React.useState("")
  const [reviewError, setReviewError] = React.useState<string | null>(null)
  const [processing, startTransition] = React.useTransition()

  const load = React.useCallback((f: Filter) => {
    setRows(null)
    setFailed(false)
    getAbsenceIntentions(f === "ALL" ? undefined : { status: f })
      .then((r) => {
        if (r.success && r.data) setRows(r.data.intentions)
        else setFailed(true)
      })
      .catch(() => setFailed(true))
  }, [])

  React.useEffect(() => {
    load(filter)
  }, [load, filter])

  function open(i: Intention, a: "APPROVED" | "REJECTED") {
    setSelected(i)
    setAction(a)
    setNotes("")
    setReviewError(null)
  }

  function confirm() {
    if (!selected) return
    startTransition(async () => {
      const result = await reviewAbsenceIntention({
        intentionId: selected.id,
        status: action,
        reviewNotes: notes.trim() || undefined,
      }).catch(() => null)
      if (result?.success) {
        setSelected(null)
        load(filter)
      } else {
        setReviewError(t.reviewFailed ?? "The decision couldn't be saved.")
      }
    })
  }

  return (
    <div className="space-y-5">
      <Segmented<Filter>
        value={filter}
        onValueChange={setFilter}
        options={[
          { value: "PENDING", label: t.pending ?? "Pending" },
          { value: "APPROVED", label: t.approved ?? "Approved" },
          { value: "REJECTED", label: t.rejected ?? "Rejected" },
          { value: "ALL", label: t.all ?? "All" },
        ]}
      />

      <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
        {rows === null && !failed ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 px-4 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          ))
        ) : failed ? (
          <p className="text-muted-foreground px-4 py-10 text-center text-sm">
            {t.loadFailed ?? "Planned absences couldn't load."}
          </p>
        ) : rows!.length === 0 ? (
          <p className="text-muted-foreground px-4 py-10 text-center text-sm">
            {t.none ?? "No planned absences."}
          </p>
        ) : (
          rows!.map((i) => (
            <IntentionRow
              key={i.id}
              intention={i}
              locale={locale}
              t={t}
              trailing={
                i.status === "PENDING" ? (
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive rounded-full"
                      onClick={() => open(i, "REJECTED")}
                    >
                      {t.reject ?? "Reject"}
                    </Button>
                    <Button
                      size="sm"
                      className="rounded-full px-4"
                      onClick={() => open(i, "APPROVED")}
                    >
                      {t.approve ?? "Approve"}
                    </Button>
                  </div>
                ) : (
                  <StatusPill status={i.status} t={t} />
                )
              }
            />
          ))
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === "APPROVED"
                ? (t.approveTitle ?? "Approve this planned absence?")
                : (t.rejectTitle ?? "Reject this planned absence?")}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? `${selected.studentName ?? ""} · ${dateRange(selected, locale)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground text-sm">
            {action === "APPROVED" ? t.approveDescription : t.rejectDescription}
          </p>
          <div className="space-y-1.5">
            <label
              htmlFor="intention-review-notes"
              className="text-muted-foreground text-xs"
            >
              {t.notes ?? "Note (optional)"}
            </label>
            <Textarea
              id="intention-review-notes"
              placeholder={t.notesPlaceholder}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          {reviewError ? (
            <p className="text-destructive text-sm">{reviewError}</p>
          ) : null}
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setSelected(null)}
              disabled={processing}
            >
              {t.cancel ?? "Cancel"}
            </Button>
            <Button
              className="rounded-full"
              variant={action === "APPROVED" ? "default" : "destructive"}
              onClick={confirm}
              disabled={processing}
            >
              {processing
                ? (t.processing ?? "Saving…")
                : action === "APPROVED"
                  ? (t.approve ?? "Approve")
                  : (t.reject ?? "Reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Guardian: plan an absence, follow the ones already sent ---

function GuardianIntentions({ locale }: { locale: string }) {
  const t = useT()
  const [children, setChildren] = React.useState<Array<{
    id: string
    name: string
  }> | null>(null)
  const [rows, setRows] = React.useState<Intention[]>([])

  const load = React.useCallback(async () => {
    const family = await getParentAttendanceSummary().catch(() => null)
    const kids =
      family?.success && family.data
        ? family.data.children.map((c) => ({
            id: c.studentId,
            name: c.studentName,
          }))
        : []
    setChildren(kids)
    const lists = await Promise.all(
      kids.map((k) =>
        getStudentIntentions(k.id)
          .then((r) =>
            r.success && r.data
              ? r.data.intentions.map((i) => ({
                  ...i,
                  studentName: kids.length > 1 ? k.name : undefined,
                }))
              : []
          )
          .catch(() => [])
      )
    )
    setRows(
      lists
        .flat()
        .sort(
          (a, b) =>
            new Date(b.dateFrom).getTime() - new Date(a.dateFrom).getTime()
        )
    )
  }, [])

  React.useEffect(() => {
    load()
  }, [load])

  if (children === null) {
    return <Skeleton className="h-80 w-full rounded-2xl" />
  }

  if (children.length === 0) {
    return (
      <p className="text-muted-foreground py-16 text-center text-sm">
        {t.none ?? "No planned absences."}
      </p>
    )
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <div className="px-4">
          <h2 className="text-sm font-medium">
            {t.planAbsence ?? "Plan an absence"}
          </h2>
          <p className="text-muted-foreground text-xs">
            {t.planAbsenceDesc ??
              "Tell the school ahead of time so the day is excused."}
          </p>
        </div>
        <IntentionSubmitForm
          locale={locale}
          students={children}
          onSuccess={() => load()}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-muted-foreground px-4 text-xs font-medium">
          {t.mine ?? "Your planned absences"}
        </h2>
        <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
          {rows.length === 0 ? (
            <p className="text-muted-foreground px-4 py-10 text-center text-sm">
              {t.none ?? "No planned absences."}
            </p>
          ) : (
            rows.map((i) => (
              <IntentionRow
                key={i.id}
                intention={i}
                locale={locale}
                t={t}
                trailing={<StatusPill status={i.status} t={t} />}
              />
            ))
          )}
        </div>
      </section>
    </div>
  )
}
