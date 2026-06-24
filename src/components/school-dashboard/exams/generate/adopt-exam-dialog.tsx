"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Download, Loader2 } from "lucide-react"

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useLocale } from "@/components/internationalization/use-locale"
import { getClassOptions } from "@/components/school-dashboard/exams/wizard/exam-wizard-v2/exam/actions"

import { adoptExam } from "./actions/catalog-adopt"

const L = {
  title: { en: "Adopt exam", ar: "تبنّي الاختبار" },
  description: {
    en: "Schedule it for a class — questions are copied into your bank.",
    ar: "جدوله لفصل — تُنسخ الأسئلة إلى بنك أسئلتك.",
  },
  class: { en: "Class", ar: "الفصل" },
  selectClass: { en: "Select a class", ar: "اختر فصلًا" },
  date: { en: "Exam date", ar: "تاريخ الاختبار" },
  start: { en: "Start", ar: "البداية" },
  end: { en: "End", ar: "النهاية" },
  cancel: { en: "Cancel", ar: "إلغاء" },
  adopt: { en: "Adopt & schedule", ar: "تبنّى وجدول" },
  failed: { en: "Failed to adopt exam", ar: "فشل تبنّي الاختبار" },
} as const

interface AdoptExamDialogProps {
  examId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdoptExamDialog({
  examId,
  open,
  onOpenChange,
}: AdoptExamDialogProps) {
  const { locale } = useLocale()
  const lang = locale === "ar" ? "ar" : "en"
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([])
  const [classId, setClassId] = useState("")
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    getClassOptions().then((result) => {
      if (result.success && result.data) setClasses(result.data)
    })
  }, [open])

  const canSubmit = !!examId && !!classId && !!date && !isPending

  const handleAdopt = () => {
    if (!examId) return
    setError(null)
    startTransition(async () => {
      const result = await adoptExam({
        catalogExamId: examId,
        classId,
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
        setError(result.error || L.failed[lang])
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
          <div className="space-y-2">
            <Label>{L.class[lang]}</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder={L.selectClass[lang]} />
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
