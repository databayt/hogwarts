"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

import {
  analyzeImportFile,
  resumeImport,
  getImportBatch,
  previewImport,
  startImport,
  type AnalyzeResult,
} from "./actions"
import type {
  BatchDetail,
  ImportOptions,
  Issue,
  PreviewResult,
  RowAction,
} from "./engine/types"
import {
  FIELDS,
  missingRequired,
  suggestMapping,
  type ColumnMapping,
  type ImportType,
} from "./fields"
import { LoginActions } from "./login-actions"
import { errorText, fieldLabel, fmt, issueText, type BulkText } from "./text"

type Step = "reading" | "map" | "preview" | "run" | "done" | "failed"

const PREVIEW_LIMIT = 300

const ACTION_STYLE: Record<RowAction, string> = {
  create: "bg-primary/10 text-primary border-primary/20",
  update: "bg-secondary text-secondary-foreground",
  skip: "bg-muted text-muted-foreground",
  error: "bg-destructive/10 text-destructive border-destructive/20",
}

function typeLabel(t: BulkText, type: ImportType) {
  return t[type]
}

/** Every step of one file's import, from reading to logins. */
export function ImportDialog({
  type: initialType,
  file,
  t,
  lang,
  onClose,
  onStarted,
}: {
  type: ImportType
  file: File
  t: BulkText
  lang: string
  onClose: () => void
  /** A batch exists now — refresh the history. */
  onStarted: () => void
}) {
  const [type, setType] = useState(initialType)
  const [step, setStep] = useState<Step>("reading")
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [options, setOptions] = useState<ImportOptions>({
    updateExisting: false,
    createMissing: true,
    notifyFamilies: false,
  })
  const [preview, setPreview] = useState<PreviewResult | null>(null)
  const [filter, setFilter] = useState<RowAction | "all">("all")
  const [pending, setPending] = useState(false)
  const [batch, setBatch] = useState<BatchDetail | null>(null)

  // 1. Read the file once.
  useEffect(() => {
    let cancelled = false
    const fd = new FormData()
    fd.append("file", file)
    fd.append("type", initialType)
    analyzeImportFile(fd)
      .then((res) => {
        if (cancelled) return
        if (!res.ok) {
          setError(errorText(t, res.code))
          setStep("failed")
          return
        }
        setAnalysis(res)
        setMapping(res.mapping)
        setStep("map")
      })
      .catch(() => {
        if (cancelled) return
        setError(errorText(t, "generic"))
        setStep("failed")
      })
    return () => {
      cancelled = true
    }
  }, [file, initialType, t])

  // 4. Follow the run.
  const batchId = batch?.id
  const finished =
    batch?.status === "DONE" ||
    batch?.status === "FAILED" ||
    batch?.status === "UNDONE"
  useEffect(() => {
    if (!batchId || finished) return
    const timer = setInterval(async () => {
      const res = await getImportBatch(batchId)
      if (!res.ok) return
      setBatch(res.batch)
      if (res.batch.status === "DONE" || res.batch.status === "FAILED") {
        setStep("done")
        onStarted()
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [batchId, finished, onStarted])

  const missing = useMemo(() => missingRequired(type, mapping), [type, mapping])

  // A file that looks like another type's — offered once, on the map step.
  const betterType =
    analysis?.betterType && analysis.betterType !== type
      ? analysis.betterType
      : null

  function switchType(next: ImportType) {
    if (!analysis) return
    setType(next)
    setMapping(suggestMapping(next, analysis.table.headers))
    setAnalysis({ ...analysis, betterType: null })
  }

  async function toPreview() {
    if (!analysis) return
    setPending(true)
    setError(null)
    try {
      const res = await previewImport({
        type,
        table: analysis.table,
        mapping,
        options,
      })
      if (!res.ok) {
        setError(errorText(t, res.code))
        return
      }
      setPreview(res)
      setFilter(res.counts.error ? "error" : "all")
      setStep("preview")
    } catch {
      setError(errorText(t, "generic"))
    } finally {
      setPending(false)
    }
  }

  async function run() {
    if (!analysis) return
    setPending(true)
    setError(null)
    try {
      const res = await startImport({
        type,
        table: analysis.table,
        mapping,
        options,
        fileName: analysis.fileName,
      })
      if (!res.ok) {
        setError(errorText(t, res.code))
        return
      }
      const status = await getImportBatch(res.batchId)
      if (status.ok) setBatch(status.batch)
      setStep(status.ok && status.batch.status === "DONE" ? "done" : "run")
      onStarted()
    } catch {
      setError(errorText(t, "generic"))
    } finally {
      setPending(false)
    }
  }

  const title = `${t.dialog.importOf} ${typeLabel(t, type)}`

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-4xl"
      >
        <DialogHeader className="space-y-1 border-b p-5">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {analysis
              ? fmt(t.dialog.rowsFound, {
                  count: analysis.table.rows.length,
                  file: analysis.fileName,
                })
              : file.name}
          </DialogDescription>
          <Steps step={step} t={t} />
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {step === "reading" && (
            <Centered>
              <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              <p className="text-muted-foreground text-sm">
                {t.dialog.reading}
              </p>
            </Centered>
          )}

          {step === "failed" && (
            <Centered>
              <AlertCircle className="text-destructive h-6 w-6" />
              <p className="text-sm">{error}</p>
            </Centered>
          )}

          {step === "map" && analysis && (
            <MapStep
              t={t}
              type={type}
              analysis={analysis}
              mapping={mapping}
              setMapping={setMapping}
              missing={missing}
              betterType={betterType}
              onSwitch={switchType}
              options={options}
              setOptions={setOptions}
            />
          )}

          {step === "preview" && preview && (
            <PreviewStep
              t={t}
              preview={preview}
              filter={filter}
              setFilter={setFilter}
            />
          )}

          {step === "run" && batch && (
            <RunStep
              t={t}
              batch={batch}
              onResume={async () => {
                const res = await resumeImport(batch.id)
                if (!res.ok) setError(errorText(t, res.code))
                else setBatch({ ...batch, stalled: false })
              }}
            />
          )}

          {step === "done" && batch && (
            <DoneStep t={t} batch={batch} type={type} lang={lang} />
          )}

          {error && step !== "failed" && (
            <p className="text-destructive mt-4 text-sm">{error}</p>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 border-t p-4 sm:justify-between">
          {step === "map" && (
            <>
              <Button variant="ghost" onClick={onClose}>
                {t.cancel}
              </Button>
              <Button
                onClick={toPreview}
                disabled={pending || missing.length > 0}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {pending ? t.dialog.checking : t.dialog.review}
              </Button>
            </>
          )}
          {step === "preview" && preview && (
            <>
              <Button
                variant="ghost"
                onClick={() => setStep("map")}
                disabled={pending}
              >
                {t.dialog.back}
              </Button>
              <Button
                onClick={run}
                disabled={
                  pending || preview.counts.create + preview.counts.update === 0
                }
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {preview.counts.create + preview.counts.update === 0
                  ? t.dialog.nothingToImport
                  : fmt(t.dialog.importCount, {
                      count: preview.counts.create + preview.counts.update,
                    })}
              </Button>
            </>
          )}
          {(step === "run" ||
            step === "done" ||
            step === "failed" ||
            step === "reading") && (
            <Button variant="outline" className="ms-auto" onClick={onClose}>
              {t.dialog.close}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
      {children}
    </div>
  )
}

function Steps({ step, t }: { step: Step; t: BulkText }) {
  const order = ["map", "preview", "run"] as const
  const current =
    step === "done" ? 3 : step === "run" ? 2 : step === "preview" ? 1 : 0
  return (
    <ol className="text-muted-foreground flex items-center gap-2 pt-2 text-xs">
      {order.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
              i < current &&
                "bg-primary text-primary-foreground border-primary",
              i === current && "border-foreground text-foreground"
            )}
          >
            {i + 1}
          </span>
          <span className={cn(i === current && "text-foreground font-medium")}>
            {t.steps[s]}
          </span>
          {i < order.length - 1 && <span className="bg-border h-px w-6" />}
        </li>
      ))}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// Step: match columns
// ---------------------------------------------------------------------------

function MapStep({
  t,
  type,
  analysis,
  mapping,
  setMapping,
  missing,
  betterType,
  onSwitch,
  options,
  setOptions,
}: {
  t: BulkText
  type: ImportType
  analysis: AnalyzeResult
  mapping: ColumnMapping
  setMapping: (m: ColumnMapping) => void
  missing: string[]
  betterType: ImportType | null
  onSwitch: (type: ImportType) => void
  options: ImportOptions
  setOptions: (o: ImportOptions) => void
}) {
  const { headers, rows } = analysis.table
  const sample = (idx: number) =>
    rows.slice(0, 20).find((r) => r[idx]?.trim())?.[idx] ?? ""
  const used = new Set(Object.values(mapping).filter((v) => v != null))
  const [showAll, setShowAll] = useState(false)
  // Required and matched fields first; the rest wait behind "more fields"
  // so a 21-field students form doesn't open as a wall of "not in file".
  const relevant = FIELDS[type].filter(
    // First/last-name columns only matter when there's no full-name column.
    (f) =>
      !((f.key === "firstName" || f.key === "lastName") && mapping.name != null)
  )
  const primary = relevant.filter((f) => f.required || mapping[f.key] != null)
  const rest = relevant.filter((f) => !f.required && mapping[f.key] == null)
  const fields = showAll ? [...primary, ...rest] : primary

  return (
    <div className="space-y-5">
      {betterType && (
        <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
          <p className="flex items-center gap-2 text-sm">
            <ArrowRightLeft className="h-4 w-4" />
            {fmt(t.dialog.wrongType, { type: t[betterType] })}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSwitch(betterType)}
          >
            {fmt(t.dialog.switchTo, { type: t[betterType] })}
          </Button>
        </div>
      )}

      {missing.length > 0 && (
        <p className="text-destructive flex items-center gap-2 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {fmt(t.dialog.missingRequired, {
            fields: missing.map((k) => fieldLabel(t, k)).join("، "),
          })}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border">
        <div className="bg-muted/50 text-muted-foreground grid grid-cols-[1fr_1.2fr] gap-3 px-3 py-2 text-xs font-medium sm:grid-cols-[1fr_1.2fr_1fr]">
          <span>{t.dialog.field}</span>
          <span>{t.dialog.column}</span>
          <span className="hidden sm:block">{t.dialog.sample}</span>
        </div>
        {fields.map((f) => {
          const idx = mapping[f.key]
          return (
            <div
              key={f.key}
              className="grid grid-cols-[1fr_1.2fr] items-center gap-3 border-t px-3 py-2 sm:grid-cols-[1fr_1.2fr_1fr]"
            >
              <span className="flex items-center gap-2 text-sm">
                {fieldLabel(t, f.key)}
                {f.required && (
                  <Badge variant="outline" className="text-[10px]">
                    {t.dialog.required}
                  </Badge>
                )}
              </span>
              <Select
                value={idx == null ? "none" : String(idx)}
                onValueChange={(v) =>
                  setMapping({
                    ...mapping,
                    [f.key]: v === "none" ? null : Number(v),
                  })
                }
              >
                <SelectTrigger
                  className={cn(
                    "h-8 w-full",
                    f.required && idx == null && "border-destructive/50"
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t.dialog.notInFile}</SelectItem>
                  {headers.map((h, i) => (
                    <SelectItem
                      key={i}
                      value={String(i)}
                      disabled={used.has(i) && idx !== i}
                    >
                      {h || `#${i + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground hidden truncate text-sm sm:block">
                {idx == null ? "—" : sample(idx)}
              </span>
            </div>
          )
        })}
      </div>

      {rest.length > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground -mt-2"
          onClick={() => setShowAll(!showAll)}
        >
          {showAll
            ? t.dialog.fewerFields
            : fmt(t.dialog.moreFields, { count: rest.length })}
        </Button>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-medium">{t.dialog.options}</h3>
        <OptionRow
          label={t.dialog.updateExisting}
          hint={t.dialog.updateExistingHint}
          checked={options.updateExisting}
          onChange={(v) => setOptions({ ...options, updateExisting: v })}
        />
        {type !== "guardians" && (
          <OptionRow
            label={t.dialog.createMissing}
            hint={t.dialog.createMissingHint}
            checked={options.createMissing}
            onChange={(v) => setOptions({ ...options, createMissing: v })}
          />
        )}
        {type === "students" && (
          <OptionRow
            label={t.dialog.notifyFamilies}
            hint={t.dialog.notifyFamiliesHint}
            checked={options.notifyFamilies}
            onChange={(v) => setOptions({ ...options, notifyFamilies: v })}
          />
        )}
      </div>
    </div>
  )
}

function OptionRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border p-3">
      <span className="space-y-0.5">
        <span className="block text-sm">{label}</span>
        <span className="text-muted-foreground block text-xs">{hint}</span>
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  )
}

// ---------------------------------------------------------------------------
// Step: review
// ---------------------------------------------------------------------------

function IssueLine({ t, issue }: { t: BulkText; issue: Issue }) {
  return (
    <span
      className={cn(
        "flex items-start gap-1.5 text-xs",
        issue.level === "error" ? "text-destructive" : "text-muted-foreground"
      )}
    >
      {issue.level === "error" ? (
        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
      )}
      {issueText(t, issue)}
    </span>
  )
}

function PreviewStep({
  t,
  preview,
  filter,
  setFilter,
}: {
  t: BulkText
  preview: PreviewResult
  filter: RowAction | "all"
  setFilter: (f: RowAction | "all") => void
}) {
  const rows =
    filter === "all"
      ? preview.rows
      : preview.rows.filter((r) => r.action === filter)
  const shown = rows.slice(0, PREVIEW_LIMIT)
  const actions: RowAction[] = ["create", "update", "skip", "error"]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={t.dialog.all}
          count={preview.rows.length}
        />
        {actions.map((a) =>
          preview.counts[a] ? (
            <FilterChip
              key={a}
              active={filter === a}
              onClick={() => setFilter(a)}
              label={t.dialog.action[a]}
              count={preview.counts[a]}
              className={filter === a ? undefined : ACTION_STYLE[a]}
            />
          ) : null
        )}
      </div>

      <div className="divide-y rounded-lg border">
        {shown.map((r) => (
          <div
            key={r.row}
            className="grid grid-cols-[3rem_1fr_auto] items-start gap-3 px-3 py-2.5"
          >
            <span className="text-muted-foreground pt-0.5 text-xs tabular-nums">
              {r.row}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="truncate text-sm font-medium">{r.name || "—"}</p>
              {r.summary && (
                <p className="text-muted-foreground text-xs">{r.summary}</p>
              )}
              {r.changes && r.changes.length > 0 && (
                <p className="text-muted-foreground text-xs">
                  {fmt(t.dialog.changes, {
                    fields: r.changes.map((c) => fieldLabel(t, c)).join("، "),
                  })}
                </p>
              )}
              {r.issues.map((issue, i) => (
                <IssueLine key={i} t={t} issue={issue} />
              ))}
            </div>
            <Badge variant="outline" className={ACTION_STYLE[r.action]}>
              {t.dialog.action[r.action]}
            </Badge>
          </div>
        ))}
      </div>
      {rows.length > shown.length && (
        <p className="text-muted-foreground text-center text-xs">
          {fmt(t.dialog.shownOf, { shown: shown.length, total: rows.length })}
        </p>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
  className,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "bg-foreground text-background border-foreground"
          : "hover:bg-muted",
        className
      )}
    >
      {label} <span className="tabular-nums">{count}</span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Step: run + done
// ---------------------------------------------------------------------------

function RunStep({
  t,
  batch,
  onResume,
}: {
  t: BulkText
  batch: BatchDetail
  onResume: () => void
}) {
  if (batch.stalled)
    return (
      <Centered>
        <AlertTriangle className="text-destructive h-6 w-6" />
        <p className="text-sm font-medium">{t.dialog.stalled}</p>
        <p className="text-muted-foreground max-w-md text-xs">
          {t.dialog.resumeHint}
        </p>
        <Button variant="outline" onClick={onResume}>
          {t.resume}
        </Button>
      </Centered>
    )

  const pct = batch.total
    ? Math.round((batch.processed / batch.total) * 100)
    : 0
  return (
    <Centered>
      <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      <p className="text-sm font-medium">
        {fmt(t.dialog.running, { done: batch.processed, total: batch.total })}
      </p>
      <Progress value={pct} className="w-full max-w-md" />
      <p className="text-muted-foreground max-w-md text-xs">
        {t.dialog.runningHint}
      </p>
    </Centered>
  )
}

function DoneStep({
  t,
  batch,
  type,
  lang,
}: {
  t: BulkText
  batch: BatchDetail
  type: ImportType
  lang: string
}) {
  const byRow = new Map<number, Issue[]>()
  for (const i of batch.issues)
    byRow.set(i.row, [...(byRow.get(i.row) ?? []), i])
  const rows = [...byRow.entries()].sort(
    (a, b) =>
      Number(b[1].some((i) => i.level === "error")) -
        Number(a[1].some((i) => i.level === "error")) || a[0] - b[0]
  )

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        <div className="space-y-1">
          <p className="font-medium">{t.dialog.done}</p>
          <p className="text-muted-foreground text-sm">
            {fmt(t.dialog.doneCounts, {
              created: batch.created,
              updated: batch.updated,
              skipped: batch.skipped,
              failed: batch.failed,
            })}
          </p>
        </div>
      </div>

      {batch.pendingLogins > 0 && (
        <div className="space-y-2 rounded-lg border p-4">
          <p className="text-sm font-medium">{t.logins}</p>
          <p className="text-muted-foreground text-xs">{t.loginsHint}</p>
          <LoginActions batchId={batch.id} type={type} t={t} lang={lang} />
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">{t.dialog.notes}</h3>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.dialog.noNotes}</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {rows.slice(0, PREVIEW_LIMIT).map(([row, issues]) => (
              <div
                key={row}
                className="grid grid-cols-[3rem_1fr] gap-3 px-3 py-2"
              >
                <span className="text-muted-foreground text-xs tabular-nums">
                  {row || "—"}
                </span>
                <div className="space-y-1">
                  {issues.map((issue, i) => (
                    <IssueLine key={i} t={t} issue={issue} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
