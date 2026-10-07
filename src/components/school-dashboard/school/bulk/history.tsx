"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import { Loader2, RotateCcw, Undo2 } from "lucide-react"
import { toast } from "sonner"

import { formatDateTime } from "@/lib/i18n-format"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"

import { listImportBatches, resumeImport, undoImport } from "./actions"
import type { BatchSummary } from "./engine/types"
import { LoginActions } from "./login-actions"
import { errorText, fmt, type BulkText } from "./text"

const STATUS_STYLE: Record<string, string> = {
  DONE: "bg-primary/10 text-primary border-primary/20",
  RUNNING: "bg-secondary text-secondary-foreground",
  PENDING: "bg-secondary text-secondary-foreground",
  STALLED: "bg-destructive/10 text-destructive border-destructive/20",
  FAILED: "bg-destructive/10 text-destructive border-destructive/20",
  UNDONE: "bg-muted text-muted-foreground",
}

export function ImportHistory({
  t,
  lang,
  refreshKey,
}: {
  t: BulkText
  lang: Locale
  /** Bumped by the page when a new import starts or ends. */
  refreshKey: number
}) {
  const [batches, setBatches] = useState<BatchSummary[] | null>(null)

  const load = useCallback(async () => {
    const res = await listImportBatches()
    if (res.ok) setBatches(res.batches)
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  // Poll only while something is running.
  const running = batches?.some(
    (b) => (b.status === "RUNNING" || b.status === "PENDING") && !b.stalled
  )
  useEffect(() => {
    if (!running) return
    const timer = setInterval(load, 2000)
    return () => clearInterval(timer)
  }, [running, load])

  if (batches === null) return null

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{t.history.title}</h2>
      {batches.length === 0 ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
          {t.history.empty}
        </p>
      ) : (
        <div className="divide-y rounded-xl border">
          {batches.map((b) => (
            <BatchRow key={b.id} b={b} t={t} lang={lang} onChange={load} />
          ))}
        </div>
      )}
    </section>
  )
}

function BatchRow({
  b,
  t,
  lang,
  onChange,
}: {
  b: BatchSummary
  t: BulkText
  lang: Locale
  onChange: () => void
}) {
  const [busy, setBusy] = useState(false)
  const status = b.stalled ? "STALLED" : b.status
  const statusLabel = (t.status as Record<string, string>)[status] ?? status
  const inFlight =
    (b.status === "RUNNING" || b.status === "PENDING") && !b.stalled

  async function onUndo() {
    setBusy(true)
    try {
      const res = await undoImport(b.id)
      if (!res.ok) toast.error(errorText(t, res.code))
      else
        SuccessToast(
          fmt(t.undoDone, {
            removed: res.removed,
            restored: res.restored,
            kept: res.kept,
          })
        )
      onChange()
    } finally {
      setBusy(false)
    }
  }

  async function onResume() {
    setBusy(true)
    try {
      const res = await resumeImport(b.id)
      if (!res.ok) toast.error(errorText(t, res.code))
      onChange()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{t[b.type]}</span>
          <Badge variant="outline" className={cn(STATUS_STYLE[status])}>
            {statusLabel}
          </Badge>
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {b.fileName} · {formatDateTime(b.createdAt, lang)}
        </p>
        {inFlight ? (
          <div className="flex items-center gap-2 pt-1">
            <Progress
              value={b.total ? (b.processed / b.total) * 100 : 0}
              className="h-1.5 w-40"
            />
            <span className="text-muted-foreground text-xs tabular-nums">
              {b.processed}/{b.total}
            </span>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">
            {fmt(t.dialog.doneCounts, {
              created: b.created,
              updated: b.updated,
              skipped: b.skipped,
              failed: b.failed,
            })}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {b.status === "DONE" && b.pendingLogins > 0 && (
          <LoginActions batchId={b.id} type={b.type} t={t} lang={lang} />
        )}
        {b.stalled && (
          <Button
            size="sm"
            variant="outline"
            onClick={onResume}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            {t.resume}
          </Button>
        )}
        {b.status === "DONE" && b.created + b.updated > 0 && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" disabled={busy}>
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Undo2 className="h-4 w-4" />
                )}
                {t.undo}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.undoTitle}</AlertDialogTitle>
                <AlertDialogDescription>{t.undoBody}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={onUndo}>
                  {t.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  )
}
