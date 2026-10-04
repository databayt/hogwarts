"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useMemo, useState } from "react"
import type { DocumentTemplate } from "@prisma/client"
import { AlertTriangle, Check, Loader2, Wand2, X } from "lucide-react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { TeachingScopePicker } from "@/components/school-dashboard/teaching-scope/picker"
import {
  EMPTY_TEACHING_SCOPE,
  type TeachingScopeValue,
} from "@/components/school-dashboard/teaching-scope/validation"

import { downloadBase64 } from "./download"
import {
  generateExamPaperFromTemplate,
  listBlueprintOptions,
  listExamOptions,
  type BlueprintOption,
  type ExamOption,
} from "./exam-paper-flow"
import { FIELD_VOCAB } from "./field-vocab"

type Mode = "existing" | "blueprint"

interface Props {
  template: DocumentTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UseExamTemplateDialog({ template, open, onOpenChange }: Props) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.documents?.useDialog
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"

  const [mode, setMode] = useState<Mode>("existing")
  const [exams, setExams] = useState<ExamOption[]>([])
  const [blueprints, setBlueprints] = useState<BlueprintOption[]>([])

  const [examId, setExamId] = useState("")
  const [blueprintId, setBlueprintId] = useState("")
  const [scope, setScope] = useState<TeachingScopeValue>(EMPTY_TEACHING_SCOPE)
  const [title, setTitle] = useState("")
  const [examDate, setExamDate] = useState("")
  const [examType, setExamType] = useState("TEST")

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Slots the bank could not fill when NOTHING could be selected.
  const [unfilled, setUnfilled] = useState<string[]>([])
  // Set when the paper downloaded but the bank could not fill the blueprint.
  const [shortfall, setShortfall] = useState<{
    missing: string[]
    questions: number
  } | null>(null)

  useEffect(() => {
    if (!open) return
    void (async () => {
      const [e, b] = await Promise.all([
        listExamOptions(),
        listBlueprintOptions(),
      ])
      if (e.success && e.data) setExams(e.data)
      if (b.success && b.data) setBlueprints(b.data)
    })()
  }, [open])

  // Which of the template's own tags this category can actually fill — the
  // "coupling" the school needs to see before trusting the output.
  const coverage = useMemo(() => {
    // The vocabulary is flat — loop children are listed as their own entries.
    const known = new Set(
      (FIELD_VOCAB[template.category] ?? []).map((f) => f.tag)
    )
    return template.mergeFields.map((tag) => ({ tag, ok: known.has(tag) }))
  }, [template])

  // The blueprint fixes the subject; the scope picks grade and section.
  const blueprint = blueprints.find((b) => b.id === blueprintId)
  const pickBlueprint = (id: string) => {
    setBlueprintId(id)
    const next = blueprints.find((b) => b.id === id)
    setScope({ ...EMPTY_TEACHING_SCOPE, subjectId: next?.subjectId ?? "" })
  }

  const canSubmit =
    mode === "existing"
      ? !!examId
      : !!blueprintId && !!scope.gradeId && !!title.trim() && !!examDate

  const submit = async () => {
    setBusy(true)
    setError(null)
    setShortfall(null)
    setUnfilled([])
    const res = await generateExamPaperFromTemplate(
      mode === "existing"
        ? {
            mode: "existing",
            documentTemplateId: template.id,
            generatedExamId: examId,
          }
        : {
            mode: "blueprint",
            documentTemplateId: template.id,
            blueprintId,
            gradeId: scope.gradeId,
            sectionId: scope.sectionId,
            title: title.trim(),
            examDate,
            examType: examType as "MIDTERM",
          }
    )
    setBusy(false)
    if (!res.success || !res.data) {
      // Codes, not sentences, come back from the action — `QUESTION_BANK_EMPTY`
      // and `TEMPLATE_INVALID` are the two a school actually hits here.
      setError(
        actionErrorMessage(
          res.error,
          dictionary,
          d?.failed ?? "Could not generate the paper."
        )
      )
      // A blueprint the bank cannot fill AT ALL carries the same per-slot
      // breakdown a partial shortfall does. Without it "no matching questions"
      // is a dead end; with it the teacher knows which question types to add.
      if (res.details) setUnfilled(res.details.split("; ").filter(Boolean))
      return
    }

    downloadBase64(res.data.filename, res.data.base64, res.data.mime)

    // Question selection degrades instead of failing — an under-stocked bank
    // yields a SHORT paper, not an error. Closing the dialog here would hand a
    // teacher a 12-mark paper for a 50-mark exam with nothing said, so hold it
    // open and name the slots that went unfilled.
    if (res.data.distributionMet === false) {
      setShortfall({
        missing: res.data.missingCategories ?? [],
        questions: res.data.totalQuestions ?? 0,
      })
      return
    }
    onOpenChange(false)
  }

  const dateFmt = new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeZone: "UTC",
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{d?.title}</DialogTitle>
          <DialogDescription>{d?.desc}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{d?.source}</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "existing" ? "default" : "outline"}
                onClick={() => setMode("existing")}
              >
                {d?.sourceExisting}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "blueprint" ? "default" : "outline"}
                onClick={() => setMode("blueprint")}
              >
                {d?.sourceBlueprint}
              </Button>
            </div>
          </div>

          {mode === "existing" ? (
            <div className="space-y-2">
              <Label>{d?.exam}</Label>
              {exams.length === 0 ? (
                <p className="text-muted-foreground text-sm">{d?.noExams}</p>
              ) : (
                <Select value={examId} onValueChange={setExamId}>
                  <SelectTrigger>
                    <SelectValue placeholder={d?.exam} />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.title} — {e.className} —{" "}
                        {dateFmt.format(new Date(e.examDate))}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{d?.blueprint}</Label>
                {blueprints.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {d?.noBlueprints}
                  </p>
                ) : (
                  <Select value={blueprintId} onValueChange={pickBlueprint}>
                    <SelectTrigger>
                      <SelectValue placeholder={d?.blueprint} />
                    </SelectTrigger>
                    <SelectContent>
                      {blueprints.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name} — {b.subjectName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {blueprint && (
                <TeachingScopePicker
                  value={scope}
                  onChange={setScope}
                  subjectId={blueprint.subjectId}
                  disabled={busy}
                />
              )}

              <div className="space-y-2">
                <Label htmlFor="paper-title">{d?.examTitle}</Label>
                <Input
                  id="paper-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={d?.examTitlePlaceholder}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="paper-date">{d?.examDate}</Label>
                  <Input
                    id="paper-date"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{d?.examType}</Label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          "MIDTERM",
                          "FINAL",
                          "QUIZ",
                          "TEST",
                          "PRACTICAL",
                        ] as const
                      ).map((t) => (
                        <SelectItem key={t} value={t}>
                          {d?.types?.[t] ?? t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <p className="text-muted-foreground text-xs">
                {d?.questionsNote}
              </p>
            </div>
          )}

          {coverage.length > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-muted-foreground mb-2 text-xs font-medium">
                {d?.coverage}
              </p>
              <div className="flex flex-wrap gap-1">
                {coverage.map((f) => (
                  <Badge
                    key={f.tag}
                    variant={f.ok ? "secondary" : "outline"}
                    className="gap-1 text-[10px]"
                    title={f.ok ? d?.filled : d?.unsupported}
                  >
                    {f.ok ? (
                      <Check className="size-2.5" />
                    ) : (
                      <X className="size-2.5" />
                    )}
                    {f.tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {shortfall && (
            <div className="space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
              <p className="flex items-center gap-2 text-sm font-medium text-amber-600">
                <AlertTriangle className="size-4" />
                {d?.shortfallTitle}
              </p>
              <p className="text-muted-foreground text-xs">
                {(d?.shortfallBody ?? "").replace(
                  "{count}",
                  String(shortfall.questions)
                )}
              </p>
              {shortfall.missing.length > 0 && (
                <ul className="text-muted-foreground list-inside list-disc text-xs">
                  {shortfall.missing.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <div className="space-y-1">
              <p className="text-destructive text-sm">{error}</p>
              {unfilled.length > 0 && (
                <ul className="text-muted-foreground list-inside list-disc text-xs">
                  {unfilled.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {d?.cancel}
            </Button>
            <Button onClick={submit} disabled={!canSubmit || busy}>
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Wand2 className="size-4" />
              )}
              {busy ? d?.generating : d?.submit}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
