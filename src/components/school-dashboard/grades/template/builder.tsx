"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Compact report-card / grade template builder. Four minimal steps, each
 * editing ONE band (header → scores grid → footer → preview). Every step shows
 * just its own small table-grid mock — never a full A4 layout.
 */
import { useState, useTransition } from "react"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"

import { saveReportCardTemplate } from "./actions"
import { FooterBandMock, HeaderBandMock, ScoresBandMock } from "./band"
import {
  ALL_SCORE_COLUMNS,
  type ReportCardTemplate,
  type ScoreColumn,
} from "./types"

export interface BuilderLabels {
  steps: { header: string; scores: string; footer: string; preview: string }
  header: {
    title: string
    titleField: string
    logo: string
    schoolName: string
    term: string
    studentName: string
    studentId: string
    studentClass: string
  }
  scores: {
    title: string
    columns: string
    overallRow: string
    rank: string
    columnLabels: Record<ScoreColumn, string>
  }
  footer: {
    title: string
    attendance: string
    gpa: string
    teacherComments: string
    principalComments: string
    signatures: string
    note: string
  }
  preview: { title: string }
  back: string
  next: string
  save: string
  saving: string
  saved: string
  saveError: string
}

const STEP_KEYS = ["header", "scores", "footer", "preview"] as const
type StepKey = (typeof STEP_KEYS)[number]

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <Label className="text-sm font-normal">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function ReportCardTemplateBuilder({
  initial,
  labels,
}: {
  initial: ReportCardTemplate
  labels: BuilderLabels
}) {
  const [tpl, setTpl] = useState<ReportCardTemplate>(initial)
  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()

  const stepKey: StepKey = STEP_KEYS[step]

  const setHeader = (patch: Partial<ReportCardTemplate["header"]>) =>
    setTpl((t) => ({ ...t, header: { ...t.header, ...patch } }))
  const setScores = (patch: Partial<ReportCardTemplate["scores"]>) =>
    setTpl((t) => ({ ...t, scores: { ...t.scores, ...patch } }))
  const setFooter = (patch: Partial<ReportCardTemplate["footer"]>) =>
    setTpl((t) => ({ ...t, footer: { ...t.footer, ...patch } }))

  const toggleColumn = (c: ScoreColumn) =>
    setScores({
      columns: tpl.scores.columns.includes(c)
        ? tpl.scores.columns.filter((x) => x !== c)
        : [
            ...ALL_SCORE_COLUMNS.filter(
              (x) => x === c || tpl.scores.columns.includes(x)
            ),
          ],
    })

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveReportCardTemplate(tpl)
      if (res.success) SuccessToast(labels.saved)
      else ErrorToast(res.error ?? labels.saveError)
    })
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      {/* Compact step indicator */}
      <div className="flex items-center gap-1.5">
        {STEP_KEYS.map((k, i) => (
          <button
            key={k}
            type="button"
            onClick={() => setStep(i)}
            className={`flex h-6 flex-1 items-center justify-center gap-1 rounded text-[11px] transition-colors ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                  ? "bg-primary/15 text-foreground"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {i < step && <Check className="size-3" />}
            {labels.steps[k]}
          </button>
        ))}
      </div>

      {/* Step body — controls + the single band it edits */}
      <div className="space-y-3">
        {stepKey === "header" && (
          <>
            <HeaderBandMock band={tpl.header} />
            <div className="space-y-1">
              <Label className="text-xs">{labels.header.titleField}</Label>
              <Input
                value={tpl.header.title}
                onChange={(e) => setHeader({ title: e.target.value })}
                className="h-8"
              />
            </div>
            <div className="divide-y">
              <Toggle
                label={labels.header.logo}
                checked={tpl.header.showLogo}
                onChange={(v) => setHeader({ showLogo: v })}
              />
              <Toggle
                label={labels.header.schoolName}
                checked={tpl.header.showSchoolName}
                onChange={(v) => setHeader({ showSchoolName: v })}
              />
              <Toggle
                label={labels.header.term}
                checked={tpl.header.showTerm}
                onChange={(v) => setHeader({ showTerm: v })}
              />
              <Toggle
                label={labels.header.studentName}
                checked={tpl.header.showStudentName}
                onChange={(v) => setHeader({ showStudentName: v })}
              />
              <Toggle
                label={labels.header.studentId}
                checked={tpl.header.showStudentId}
                onChange={(v) => setHeader({ showStudentId: v })}
              />
              <Toggle
                label={labels.header.studentClass}
                checked={tpl.header.showClass}
                onChange={(v) => setHeader({ showClass: v })}
              />
            </div>
          </>
        )}

        {stepKey === "scores" && (
          <>
            <ScoresBandMock band={tpl.scores} />
            <div className="space-y-1.5">
              <Label className="text-xs">{labels.scores.columns}</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {ALL_SCORE_COLUMNS.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={tpl.scores.columns.includes(c)}
                      onCheckedChange={() => toggleColumn(c)}
                      disabled={c === "subject"}
                    />
                    {labels.scores.columnLabels[c]}
                  </label>
                ))}
              </div>
            </div>
            <div className="divide-y">
              <Toggle
                label={labels.scores.overallRow}
                checked={tpl.scores.showOverallRow}
                onChange={(v) => setScores({ showOverallRow: v })}
              />
              <Toggle
                label={labels.scores.rank}
                checked={tpl.scores.showRank}
                onChange={(v) => setScores({ showRank: v })}
              />
            </div>
          </>
        )}

        {stepKey === "footer" && (
          <>
            <FooterBandMock band={tpl.footer} />
            <div className="divide-y">
              <Toggle
                label={labels.footer.attendance}
                checked={tpl.footer.showAttendance}
                onChange={(v) => setFooter({ showAttendance: v })}
              />
              <Toggle
                label={labels.footer.gpa}
                checked={tpl.footer.showGpa}
                onChange={(v) => setFooter({ showGpa: v })}
              />
              <Toggle
                label={labels.footer.teacherComments}
                checked={tpl.footer.showTeacherComments}
                onChange={(v) => setFooter({ showTeacherComments: v })}
              />
              <Toggle
                label={labels.footer.principalComments}
                checked={tpl.footer.showPrincipalComments}
                onChange={(v) => setFooter({ showPrincipalComments: v })}
              />
              <Toggle
                label={labels.footer.signatures}
                checked={tpl.footer.showSignatures}
                onChange={(v) => setFooter({ showSignatures: v })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{labels.footer.note}</Label>
              <Textarea
                value={tpl.footer.note}
                onChange={(e) => setFooter({ note: e.target.value })}
                rows={2}
                className="text-sm"
              />
            </div>
          </>
        )}

        {stepKey === "preview" && (
          <div className="space-y-2">
            <HeaderBandMock band={tpl.header} />
            <ScoresBandMock band={tpl.scores} />
            <FooterBandMock band={tpl.footer} />
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          {labels.back}
        </Button>
        {step < STEP_KEYS.length - 1 ? (
          <Button
            type="button"
            size="sm"
            onClick={() =>
              setStep((s) => Math.min(STEP_KEYS.length - 1, s + 1))
            }
          >
            {labels.next}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? labels.saving : labels.save}
          </Button>
        )}
      </div>
    </div>
  )
}
