"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2 } from "lucide-react"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import { TeachingScopePicker } from "@/components/school-dashboard/teaching-scope/picker"
import {
  EMPTY_TEACHING_SCOPE,
  type TeachingScopeValue,
} from "@/components/school-dashboard/teaching-scope/validation"

import { adoptExam } from "./actions/catalog-adopt"

const L = {
  title: { en: "Adopt exam", ar: "تبنّي الاختبار" },
  description: {
    en: "Schedule it for a grade or one of its sections — questions are copied into your bank.",
    ar: "جدوله لصف أو لأحد فصوله — تُنسخ الأسئلة إلى بنك أسئلتك.",
  },
  date: { en: "Exam date", ar: "تاريخ الاختبار" },
  start: { en: "Start", ar: "البداية" },
  end: { en: "End", ar: "النهاية" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  adopt: { en: "Adopt & schedule", ar: "تبنّى وجدول" },
  failed: { en: "Failed to adopt exam", ar: "فشل تبنّي الاختبار" },
} as const

interface AdoptExamDialogProps {
  examId: string | null
  /** The catalog exam's subject — fixes the subject of the scope. */
  subjectId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdoptExamDialog({
  examId,
  subjectId,
  open,
  onOpenChange,
}: AdoptExamDialogProps) {
  const { locale } = useLocale()
  const { dictionary } = useDictionary()
  const lang = locale === "ar" ? "ar" : "en"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // Mounted per exam (keyed by the caller), so the scope starts empty with
  // that exam's subject.
  const [scope, setScope] = useState<TeachingScopeValue>(() => ({
    ...EMPTY_TEACHING_SCOPE,
    subjectId: subjectId ?? "",
  }))
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [error, setError] = useState<string | null>(null)

  const canSubmit = !!examId && !!scope.gradeId && !!date && !isPending

  const handleAdopt = () => {
    if (!examId) return
    setError(null)
    startTransition(async () => {
      const result = await adoptExam({
        catalogExamId: examId,
        gradeId: scope.gradeId,
        sectionId: scope.sectionId,
        examDate: new Date(date),
        startTime,
        endTime,
      })
      if (result.success && result.data) {
        onOpenChange(false)
        router.push(
          `/${locale}/exams/paper/${result.data.generatedExamId}/preview`
        )
      } else {
        // The action answers with an ACTION code for the checks that have one;
        // older raw sentences in that file pass through unchanged.
        setError(actionErrorMessage(result.error, dictionary, L.failed[lang]))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{L.title[lang]}</DialogTitle>
          <DialogDescription>{L.description[lang]}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <TeachingScopePicker
            value={scope}
            onChange={setScope}
            subjectId={subjectId ?? undefined}
            disabled={isPending}
          />

          <div className="space-y-2">
            <Label htmlFor="adopt-date">{L.date[lang]}</Label>
            <Input
              id="adopt-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adopt-start">{L.start[lang]}</Label>
              <Input
                id="adopt-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="adopt-end">{L.end[lang]}</Label>
              <Input
                id="adopt-end"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {L.cancel[lang]}
          </Button>
          <Button onClick={handleAdopt} disabled={!canSubmit}>
            {isPending ? (
              <Loader2 className="me-1 size-4 animate-spin" />
            ) : (
              <Download className="me-1 size-4" />
            )}
            {L.adopt[lang]}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
