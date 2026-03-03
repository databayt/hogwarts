"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Minus, Plus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { useWizard } from "../../context/wizard-provider"
import type { ExamType, QuestionTypeName } from "../../types"

interface SelectOption {
  id: string
  name: string
}

interface InfoStepProps {
  lang: string
  subjects: SelectOption[]
  grades: SelectOption[]
}

const EXAM_TYPES: { value: ExamType; en: string; ar: string }[] = [
  { value: "MIDTERM", en: "Midterm", ar: "نصفي" },
  { value: "FINAL", en: "Final", ar: "نهائي" },
  { value: "QUIZ", en: "Quiz", ar: "اختبار قصير" },
  { value: "POP_QUIZ", en: "Pop Quiz", ar: "اختبار مفاجئ" },
  { value: "MOCK", en: "Mock", ar: "تجريبي" },
  { value: "PRACTICE", en: "Practice", ar: "تدريبي" },
]

const QUESTION_TYPES: { value: QuestionTypeName; en: string; ar: string }[] = [
  { value: "MULTIPLE_CHOICE", en: "Multiple Choice", ar: "اختيار متعدد" },
  { value: "TRUE_FALSE", en: "True / False", ar: "صح / خطأ" },
  { value: "SHORT_ANSWER", en: "Short Answer", ar: "إجابة قصيرة" },
  { value: "ESSAY", en: "Essay", ar: "مقال" },
  { value: "FILL_BLANK", en: "Fill in the Blank", ar: "أكمل الفراغ" },
  { value: "MATCHING", en: "Matching", ar: "مطابقة" },
  { value: "ORDERING", en: "Ordering", ar: "ترتيب" },
]

export function InfoStep({ lang, subjects, grades }: InfoStepProps) {
  const { state, dispatch } = useWizard()
  const isAr = lang === "ar"

  const toggleSubject = (id: string) => {
    const current = state.subjectIds
    const updated = current.includes(id)
      ? current.filter((s) => s !== id)
      : [...current, id]
    dispatch({ type: "SET_INFO", payload: { subjectIds: updated } })
  }

  const toggleGrade = (id: string) => {
    const current = state.gradeIds
    const updated = current.includes(id)
      ? current.filter((g) => g !== id)
      : [...current, id]
    dispatch({ type: "SET_INFO", payload: { gradeIds: updated } })
  }

  const toggleQuestionType = (type: QuestionTypeName) => {
    const current = [...state.questionTypes]
    const idx = current.findIndex((q) => q.type === type)
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push({
        type,
        count: 5,
        difficulty: { EASY: 2, MEDIUM: 2, HARD: 1 },
      })
    }
    dispatch({ type: "SET_QUESTION_TYPES", payload: current })
  }

  const updateQuestionCount = (type: QuestionTypeName, delta: number) => {
    const current = [...state.questionTypes]
    const idx = current.findIndex((q) => q.type === type)
    if (idx >= 0) {
      const newCount = Math.max(1, current[idx].count + delta)
      current[idx] = { ...current[idx], count: newCount }
      dispatch({ type: "SET_QUESTION_TYPES", payload: current })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "معلومات الاختبار" : "Exam Information"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "أدخل التفاصيل الأساسية لقالب الاختبار"
            : "Enter the basic details for your exam template"}
        </p>
      </div>

      {/* Template Name */}
      <div className="space-y-2">
        <Label>{isAr ? "اسم القالب" : "Template Name"}</Label>
        <Input
          value={state.name}
          onChange={(e) =>
            dispatch({ type: "SET_INFO", payload: { name: e.target.value } })
          }
          placeholder={
            isAr
              ? "مثال: نصفي رياضيات - الصف العاشر"
              : "e.g., Midterm Math - Grade 10"
          }
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label>{isAr ? "الوصف (اختياري)" : "Description (Optional)"}</Label>
        <Textarea
          value={state.description}
          onChange={(e) =>
            dispatch({
              type: "SET_INFO",
              payload: { description: e.target.value },
            })
          }
          placeholder={isAr ? "وصف القالب..." : "Describe this template..."}
          rows={2}
        />
      </div>

      {/* Subjects (multi-select chips) */}
      <div className="space-y-2">
        <Label>{isAr ? "المواد" : "Subjects"}</Label>
        <div className="flex flex-wrap gap-2">
          {subjects.map((s) => (
            <Badge
              key={s.id}
              variant={state.subjectIds.includes(s.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleSubject(s.id)}
            >
              {s.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Grades (multi-select chips) */}
      <div className="space-y-2">
        <Label>{isAr ? "الصفوف" : "Grades"}</Label>
        <div className="flex flex-wrap gap-2">
          {grades.map((g) => (
            <Badge
              key={g.id}
              variant={state.gradeIds.includes(g.id) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => toggleGrade(g.id)}
            >
              {g.name}
            </Badge>
          ))}
        </div>
      </div>

      {/* Exam Type + Duration + Marks */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>{isAr ? "نوع الاختبار" : "Exam Type"}</Label>
          <Select
            value={state.examType}
            onValueChange={(v) =>
              dispatch({
                type: "SET_INFO",
                payload: { examType: v as ExamType },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXAM_TYPES.map((et) => (
                <SelectItem key={et.value} value={et.value}>
                  {isAr ? et.ar : et.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "المدة (دقيقة)" : "Duration (min)"}</Label>
          <Input
            type="number"
            min={5}
            max={480}
            value={state.duration}
            onChange={(e) =>
              dispatch({
                type: "SET_INFO",
                payload: { duration: parseInt(e.target.value) || 60 },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>{isAr ? "الدرجة الكلية" : "Total Marks"}</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={state.totalMarks}
            onChange={(e) =>
              dispatch({
                type: "SET_INFO",
                payload: { totalMarks: parseInt(e.target.value) || 100 },
              })
            }
          />
        </div>
      </div>

      {/* Question Types */}
      <div className="space-y-3">
        <Label>{isAr ? "أنواع الأسئلة" : "Question Types"}</Label>
        <p className="text-muted-foreground text-xs">
          {isAr
            ? "اختر أنواع الأسئلة وعدد كل نوع"
            : "Select question types and count for each"}
        </p>
        <div className="space-y-2">
          {QUESTION_TYPES.map((qt) => {
            const isSelected = state.questionTypes.some(
              (q) => q.type === qt.value
            )
            const config = state.questionTypes.find((q) => q.type === qt.value)

            return (
              <div
                key={qt.value}
                className="border-border flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleQuestionType(qt.value)}
                  />
                  <span className="text-sm font-medium">
                    {isAr ? qt.ar : qt.en}
                  </span>
                </div>
                {isSelected && config && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuestionCount(qt.value, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">
                      {config.count}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuestionCount(qt.value, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
