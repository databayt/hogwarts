"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useMemo, useState } from "react"
import type { DocumentTemplate } from "@prisma/client"
import { Check, Loader2, Wand2, X } from "lucide-react"

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

import { downloadBase64 } from "./download"
import {
  generateExamPaperFromTemplate,
  listBlueprintOptions,
  listClassOptions,
  listExamOptions,
  type BlueprintOption,
  type ClassOption,
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
  const [classes, setClasses] = useState<ClassOption[]>([])

  const [examId, setExamId] = useState("")
  const [blueprintId, setBlueprintId] = useState("")
  const [classId, setClassId] = useState("")
  const [title, setTitle] = useState("")
  const [examDate, setExamDate] = useState("")
  const [examType, setExamType] = useState("TEST")

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    void (async () => {
      const [e, b, c] = await Promise.all([
        listExamOptions(),
        listBlueprintOptions(),
        listClassOptions(),
      ])
      if (e.success && e.data) setExams(e.data)
      if (b.success && b.data) setBlueprints(b.data)
      if (c.success && c.data) setClasses(c.data)
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

  const canSubmit =
    mode === "existing"
      ? !!examId
      : !!blueprintId && !!classId && !!title.trim() && !!examDate

  const submit = async () => {
    setBusy(true)
    setError(null)
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
            classId,
            title: title.trim(),
            examDate,
            examType: examType as "MIDTERM",
          }
    )
    setBusy(false)
    if (res.success && res.data) {
      downloadBase64(res.data.filename, res.data.base64, res.data.mime)
      onOpenChange(false)
    } else {
      setError(res.error ?? d?.failed ?? "Could not generate the paper.")
    }
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
                  <Select value={blueprintId} onValueChange={setBlueprintId}>
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

              <div className="space-y-2">
                <Label>{d?.class}</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder={d?.class} />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

          {error && <p className="text-destructive text-sm">{error}</p>}

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
