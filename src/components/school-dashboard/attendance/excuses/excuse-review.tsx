"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Staff excuse queue: pending first, approved and rejected one tap away.
 * One inset list; a row opens the review dialog (pending) or shows the
 * decision (history).
 */
import { useCallback, useEffect, useState, useTransition } from "react"
import { Paperclip } from "lucide-react"

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

import { getPendingExcuses, reviewExcuse } from "../actions"
import { fill, formatDay, formatInstant } from "../overview/format"

type Status = "PENDING" | "APPROVED" | "REJECTED"

interface ExcuseRow {
  id: string
  studentName: string
  className: string
  date: string
  reason: string
  description: string | null
  attachments: string[]
  submitterName: string | null
  submittedAt: string
  status: string
  reviewNotes: string | null
  reviewedAt: string | null
}

interface ExcuseReviewListProps {
  /** Only this section's excuses (within the teacher's own). */
  sectionId?: string
  locale?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dict = Record<string, any>

export function ExcuseReviewList({
  sectionId,
  locale = "ar",
}: ExcuseReviewListProps) {
  const { dictionary } = useDictionary()
  const t = ((dictionary as Dict | undefined)?.attendanceToday?.excuses ??
    {}) as Dict
  const [status, setStatus] = useState<Status>("PENDING")
  const [rows, setRows] = useState<ExcuseRow[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [selected, setSelected] = useState<ExcuseRow | null>(null)
  const [notes, setNotes] = useState("")
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const load = useCallback(
    (s: Status) => {
      getPendingExcuses({ sectionId, status: s })
        .then((r) => {
          if (r.success && r.data) setRows(r.data.excuses)
          else setFailed(true)
        })
        .catch(() => setFailed(true))
    },
    [sectionId]
  )

  useEffect(() => {
    load(status)
  }, [load, status])

  const reasonLabel = (r: string) => t.reasons?.[r] ?? r

  function decide(decision: "APPROVED" | "REJECTED") {
    if (!selected) return
    setReviewError(null)
    startTransition(async () => {
      const result = await reviewExcuse({
        excuseId: selected.id,
        status: decision,
        reviewNotes: notes.trim() || undefined,
      }).catch(() => null)
      if (result?.success) {
        setRows((prev) => prev?.filter((e) => e.id !== selected.id) ?? null)
        setSelected(null)
      } else {
        setReviewError(t.reviewFailed ?? "The decision couldn't be saved.")
      }
    })
  }

  const emptyText =
    status === "PENDING"
      ? (t.emptyPending ?? "No excuses are waiting.")
      : status === "APPROVED"
        ? (t.emptyApproved ?? "No approved excuses yet.")
        : (t.emptyRejected ?? "No rejected excuses.")

  return (
    <div className="space-y-5">
      <Segmented<Status>
        value={status}
        onValueChange={(s) => {
          // Reset in the handler, not the effect, so the list shows its
          // skeleton while the next filter loads.
          setRows(null)
          setFailed(false)
          setStatus(s)
        }}
        options={[
          { value: "PENDING", label: t.pending ?? "Pending" },
          { value: "APPROVED", label: t.approved ?? "Approved" },
          { value: "REJECTED", label: t.rejected ?? "Rejected" },
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
            {t.loadFailed ?? "Excuses couldn't load."}
          </p>
        ) : rows!.length === 0 ? (
          <p className="text-muted-foreground px-4 py-10 text-center text-sm">
            {emptyText}
          </p>
        ) : (
          rows!.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="truncate text-sm font-medium">{e.studentName}</p>
                <p className="text-muted-foreground truncate text-xs">
                  {[
                    e.className,
                    formatDay(e.date, locale),
                    reasonLabel(e.reason),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  {e.attachments.length > 0 ? (
                    <Paperclip className="ms-1.5 inline size-3 align-[-2px]" />
                  ) : null}
                </p>
                {e.status !== "PENDING" && e.reviewNotes ? (
                  <p className="text-muted-foreground truncate text-xs">
                    {fill(t.reviewNote, { note: e.reviewNotes }, e.reviewNotes)}
                  </p>
                ) : null}
              </div>
              {e.status === "PENDING" ? (
                <Button
                  size="sm"
                  className="rounded-full px-4"
                  onClick={() => {
                    setSelected(e)
                    setNotes("")
                    setReviewError(null)
                  }}
                >
                  {t.review ?? "Review"}
                </Button>
              ) : (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    e.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  {t.status?.[e.status] ?? e.status}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.reviewTitle ?? "Review excuse"}</DialogTitle>
            <DialogDescription>
              {t.reviewDescription ??
                "Read the reason, then approve or reject it."}
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-4">
              <dl className="bg-muted/50 divide-border/60 divide-y rounded-xl text-sm">
                {[
                  [t.student ?? "Student", selected.studentName],
                  [t.section ?? "Section", selected.className],
                  [t.date ?? "Absence date", formatDay(selected.date, locale)],
                  [t.reason ?? "Reason", reasonLabel(selected.reason)],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between gap-4 px-3 py-2"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="truncate font-medium">{value}</dd>
                  </div>
                ))}
              </dl>

              {selected.description ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">
                    {t.details ?? "Details"}
                  </p>
                  <p className="text-sm leading-relaxed">
                    {selected.description}
                  </p>
                </div>
              ) : null}

              {selected.attachments.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {selected.attachments.map((url, i) => (
                    <a
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                    >
                      <Paperclip className="size-3.5" />
                      {fill(t.attachment, { n: i + 1 }, `#${i + 1}`)}
                    </a>
                  ))}
                </div>
              ) : null}

              <p className="text-muted-foreground text-xs">
                {fill(
                  t.from,
                  {
                    name: selected.submitterName ?? t.unknownSender ?? "",
                    date: formatInstant(selected.submittedAt, locale),
                  },
                  ""
                )}
              </p>

              <div className="space-y-1.5">
                <label
                  htmlFor="excuse-review-notes"
                  className="text-muted-foreground text-xs"
                >
                  {t.notes ?? "Note to the family (optional)"}
                </label>
                <Textarea
                  id="excuse-review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t.notesPlaceholder}
                  rows={2}
                />
              </div>

              {reviewError ? (
                <p className="text-destructive text-sm">{reviewError}</p>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setSelected(null)}
              disabled={isPending}
            >
              {t.cancel ?? "Cancel"}
            </Button>
            <Button
              variant="outline"
              className="text-destructive rounded-full"
              onClick={() => decide("REJECTED")}
              disabled={isPending}
            >
              {t.reject ?? "Reject"}
            </Button>
            <Button
              className="rounded-full"
              onClick={() => decide("APPROVED")}
              disabled={isPending}
            >
              {t.approve ?? "Approve"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
