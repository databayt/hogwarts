"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, RotateCcw, Trash2 } from "lucide-react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { resetGradeScale, saveGradeScale } from "../actions/scale"
import type { ScaleBand } from "../lib/scale"

type Row = {
  key: number
  grade: string
  minScore: string
  maxScore: string
  gpa: string
}

const toRows = (scale: ScaleBand[]): Row[] =>
  [...scale]
    .sort((a, b) => b.minScore - a.minScore)
    .map((b, i) => ({
      key: i,
      grade: b.grade,
      minScore: String(b.minScore),
      maxScore: String(b.maxScore),
      gpa: String(b.gpa),
    }))

/**
 * The school's grade scale as one inset list: each row a letter, the score
 * range that earns it and its GPA points. Saved as a whole; the server
 * refuses gaps at zero, overlaps and duplicates with a translated reason.
 */
export function ScaleEditor({
  scale,
  isCustom,
  canEdit,
}: {
  scale: ScaleBand[]
  isCustom: boolean
  canEdit: boolean
}) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.grades?.settings
  const [rows, setRows] = useState<Row[]>(() => toRows(scale))
  const [nextKey, setNextKey] = useState(scale.length)
  const [pending, startTransition] = useTransition()

  const update = (key: number, field: keyof Omit<Row, "key">, value: string) =>
    setRows((rs) =>
      rs.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    )

  const add = () => {
    setRows((rs) => [
      ...rs,
      { key: nextKey, grade: "", minScore: "0", maxScore: "0", gpa: "0" },
    ])
    setNextKey((k) => k + 1)
  }

  const save = () =>
    startTransition(async () => {
      const res = await saveGradeScale(
        rows.map((r) => ({
          grade: r.grade,
          minScore: Number(r.minScore),
          maxScore: Number(r.maxScore),
          gpa: Number(r.gpa),
        }))
      )
      if (!res.success) {
        const code = res.error ?? ""
        ErrorToast(
          (t?.errors as Record<string, string> | undefined)?.[code] ??
            actionErrorMessage(code, dictionary, t?.saveFailed ?? "")
        )
        return
      }
      SuccessToast(t?.saved ?? "")
      router.refresh()
    })

  const reset = () =>
    startTransition(async () => {
      const res = await resetGradeScale()
      if (!res.success) {
        ErrorToast(
          actionErrorMessage(res.error, dictionary, t?.saveFailed ?? "")
        )
        return
      }
      SuccessToast(t?.resetDone ?? "")
      router.refresh()
    })

  const cell = "h-9 text-center tabular-nums"

  return (
    <div className="space-y-4">
      <div className="bg-card overflow-hidden rounded-2xl border">
        <div className="text-muted-foreground grid grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 border-b px-4 py-2 text-xs font-medium">
          <span>{t?.grade}</span>
          <span className="text-center">{t?.from}</span>
          <span className="text-center">{t?.to}</span>
          <span className="text-center">{t?.gpa}</span>
          <span className="w-9" />
        </div>
        <div className="divide-border/60 divide-y">
          {rows.map((r) => (
            <div
              key={r.key}
              className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-center gap-3 px-4 py-2"
            >
              <Input
                dir="ltr"
                value={r.grade}
                onChange={(e) => update(r.key, "grade", e.target.value)}
                disabled={!canEdit || pending}
                className="h-9 font-medium"
                aria-label={t?.grade}
              />
              <Input
                dir="ltr"
                type="number"
                inputMode="decimal"
                value={r.minScore}
                onChange={(e) => update(r.key, "minScore", e.target.value)}
                disabled={!canEdit || pending}
                className={cell}
                aria-label={t?.from}
              />
              <Input
                dir="ltr"
                type="number"
                inputMode="decimal"
                value={r.maxScore}
                onChange={(e) => update(r.key, "maxScore", e.target.value)}
                disabled={!canEdit || pending}
                className={cell}
                aria-label={t?.to}
              />
              <Input
                dir="ltr"
                type="number"
                inputMode="decimal"
                step="0.1"
                value={r.gpa}
                onChange={(e) => update(r.key, "gpa", e.target.value)}
                disabled={!canEdit || pending}
                className={cell}
                aria-label={t?.gpa}
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-9"
                onClick={() =>
                  setRows((rs) => rs.filter((x) => x.key !== r.key))
                }
                disabled={!canEdit || pending || rows.length <= 1}
                aria-label={t?.remove}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground px-1 text-xs leading-relaxed">
        {isCustom ? t?.customHint : t?.defaultHint} {t?.existingHint}
      </p>

      {canEdit && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={add}
            disabled={pending}
            className="gap-2"
          >
            <Plus className="size-4" />
            {t?.add}
          </Button>
          {isCustom && (
            <Button
              variant="ghost"
              onClick={reset}
              disabled={pending}
              className="gap-2"
            >
              <RotateCcw className="size-4" />
              {t?.reset}
            </Button>
          )}
          <Button onClick={save} disabled={pending} className="ms-auto">
            {pending ? t?.saving : t?.save}
          </Button>
        </div>
      )}
    </div>
  )
}
