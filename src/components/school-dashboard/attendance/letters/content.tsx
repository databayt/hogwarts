// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Letters — pick a letter type (Segmented), tick students who need it
 * (shared risk thresholds, see early-warning/risk.ts), preview, then one
 * primary "Generate" action. `?student=<id>&band=<band>` (from the at-risk
 * list) preselects a fitting letter and that student.
 */
"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCount } from "@/components/school-dashboard/school/configuration/ui/format"
import { Segmented } from "@/components/school-dashboard/school/configuration/ui/segmented"

import { formatRate } from "../early-warning/risk"
import { pick, pl, useRiskDict, type RiskDict } from "../early-warning/use-risk-dict"
import { AttendanceSectionNav } from "../ui/section-nav"
import {
  bulkGenerateLetters,
  getStudentsNeedingLetters,
  previewLetter,
} from "./actions"
import { type DeliveryMethod, type LetterType } from "./validation"

interface StudentForLetter {
  id: string
  name: string
  sectionName: string | null
  rate: number
  absentDays: number
  totalDays: number
  hasGuardianEmail: boolean
}

const WARNINGS: LetterType[] = [
  "ATTENDANCE_NOTICE_1",
  "ATTENDANCE_NOTICE_2",
  "ATTENDANCE_NOTICE_3",
  "TRUANCY_WARNING",
  "ATTENDANCE_CONTRACT",
]
const POSITIVE: LetterType[] = ["ATTENDANCE_IMPROVEMENT", "PERFECT_ATTENDANCE"]

const AUDIENCE: Record<
  LetterType,
  "high" | "critical" | "improving" | "perfect"
> = {
  ATTENDANCE_NOTICE_1: "high",
  ATTENDANCE_NOTICE_2: "high",
  ATTENDANCE_NOTICE_3: "critical",
  TRUANCY_WARNING: "critical",
  ATTENDANCE_CONTRACT: "critical",
  ATTENDANCE_IMPROVEMENT: "improving",
  PERFECT_ATTENDANCE: "perfect",
}

const METHODS: DeliveryMethod[] = ["EMAIL", "PRINT", "PORTAL"]
const STEP = 25

export function LettersContent({ locale }: { locale: string }) {
  const lang = locale
  const params = useSearchParams()
  const focusStudent = params.get("student")
  const focusBand = params.get("band")

  const { t: dict } = useRiskDict()
  const t: NonNullable<RiskDict["letters"]> = dict.letters ?? {}

  const [group, setGroup] = useState<"warning" | "positive">("warning")
  const [type, setType] = useState<LetterType>(
    focusBand === "critical" ? "ATTENDANCE_NOTICE_3" : "ATTENDANCE_NOTICE_1"
  )
  const [method, setMethod] = useState<DeliveryMethod>("EMAIL")
  const [students, setStudents] = useState<StudentForLetter[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [shown, setShown] = useState(STEP)
  const [isSending, startSending] = useTransition()
  const [preview, setPreview] = useState<{
    name: string
    subject: string
    body: string
  } | null>(null)

  const [, startLoading] = useTransition()
  const load = useCallback(
    () =>
      startLoading(async () => {
        setLoading(true)
        const result = await getStudentsNeedingLetters(type)
        const list =
          result.success && result.data
            ? (result.data as StudentForLetter[])
            : []
        setStudents(list)
        setSelected(
          new Set(
            focusStudent && list.some((s) => s.id === focusStudent)
              ? [focusStudent]
              : []
          )
        )
        setShown(STEP)
        setLoading(false)
      }),
    [type, focusStudent]
  )

  useEffect(() => {
    load()
  }, [load])

  const types = group === "warning" ? WARNINGS : POSITIVE

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const allSelected = students.length > 0 && selected.size === students.length

  const openPreview = async (s: StudentForLetter) => {
    const r = await previewLetter(s.id, type, lang === "ar" ? "ar" : "en")
    if (r.success && r.data) {
      const d = r.data as { subject: string; body: string }
      setPreview({ name: s.name, subject: d.subject, body: d.body })
    }
  }

  const generate = () =>
    startSending(async () => {
      const r = await bulkGenerateLetters([...selected], type, method)
      const d = r.data as { succeeded: number; failed: number } | undefined
      if (d) {
        const msg = pl(t.done, d.succeeded, lang)
        if (d.failed > 0)
          toast.warning(
            `${msg} · ${(t.someFailed ?? "").replace("{n}", formatCount(d.failed, lang))}`
          )
        else toast.success(msg)
        load()
      }
    })

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="risk" />

      <div className="space-y-3">
        <Segmented
          value={group}
          onValueChange={(g) => {
            setGroup(g)
            setType(g === "warning" ? "ATTENDANCE_NOTICE_1" : POSITIVE[0])
          }}
          options={[
            { value: "warning", label: t.groups?.warning },
            { value: "positive", label: t.groups?.positive },
          ]}
        />
        <Segmented
          value={type}
          onValueChange={setType}
          options={types.map((v) => ({ value: v, label: t.types?.[v] ?? v }))}
          className="overflow-x-auto"
        />
        <p className="text-muted-foreground px-1 text-xs">
          {t.for?.[AUDIENCE[type]]}
        </p>
      </div>

      {loading ? (
        <div className="space-y-2 rounded-2xl border p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-1 rounded-2xl border px-6 py-16 text-center">
          <p className="font-medium">{t.empty}</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            {t.emptyHint}
          </p>
        </div>
      ) : (
        <div className="bg-card divide-border/60 divide-y overflow-hidden rounded-2xl border">
          <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() =>
                setSelected(
                  allSelected ? new Set() : new Set(students.map((s) => s.id))
                )
              }
            />
            <span className="text-muted-foreground text-xs">{t.selectAll}</span>
          </label>
          {students.slice(0, shown).map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors",
                selected.has(s.id) && "bg-muted/40"
              )}
            >
              <Checkbox
                checked={selected.has(s.id)}
                onCheckedChange={() => toggle(s.id)}
                aria-label={s.name}
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-start"
                onClick={() => toggle(s.id)}
              >
                <p className="truncate text-sm font-medium">
                  <bdi>{s.name}</bdi>
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {s.sectionName ? (
                    <>
                      <bdi>{s.sectionName}</bdi> ·{" "}
                    </>
                  ) : null}
                  {(t.missed ?? "")
                    .replace("{absent}", formatCount(s.absentDays, lang))
                    .replace("{total}", formatCount(s.totalDays, lang))}
                  {!s.hasGuardianEmail && method === "EMAIL" ? (
                    <span className="text-amber-700 dark:text-amber-400">
                      {" · "}
                      {t.noEmail}
                    </span>
                  ) : null}
                </p>
              </button>
              <span className="text-sm font-medium tabular-nums">
                {formatRate(s.rate, lang)}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={() => openPreview(s)}
              >
                {t.preview}
              </Button>
            </div>
          ))}
        </div>
      )}

      {students.length > shown ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setShown((n) => n + STEP)}
          >
            {t.showMore}
          </Button>
        </div>
      ) : null}

      {students.length > 0 ? (
        <div className="bg-background/80 sticky bottom-4 flex flex-col gap-3 rounded-2xl border p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-xs">{t.delivery}</span>
            <Segmented
              value={method}
              onValueChange={setMethod}
              options={METHODS.map((m) => ({
                value: m,
                label: pick(t.methods, m) ?? m,
              }))}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground text-sm tabular-nums">
              {pl(t.selected, selected.size, lang)}
            </span>
            <Button
              className="rounded-full px-6"
              disabled={selected.size === 0 || isSending}
              onClick={generate}
            >
              {isSending
                ? t.generating
                : (t.generate ?? "{n}").replace(
                    "{n}",
                    formatCount(selected.size, lang)
                  )}
            </Button>
          </div>
        </div>
      ) : null}

      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.previewTitle}</DialogTitle>
            <DialogDescription>
              <bdi>{preview?.name}</bdi>
            </DialogDescription>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <p className="font-medium">{preview.subject}</p>
              <pre className="bg-muted/50 rounded-xl p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap">
                {preview.body}
              </pre>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => setPreview(null)}
            >
              {t.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
