"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Check } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import type {
  ClassOption,
  ExamOption,
  ExamWizardAction,
  ExamWizardState,
} from "../types"

interface SelectExamStepProps {
  lang: string
  state: ExamWizardState
  dispatch: React.Dispatch<ExamWizardAction>
  existingExams: ExamOption[]
  classes: ClassOption[]
}

export function SelectExamStep({
  lang,
  state,
  dispatch,
  existingExams,
  classes,
}: SelectExamStepProps) {
  const isAr = lang === "ar"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          {isAr ? "تفاصيل الاختبار" : "Exam Details"}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isAr
            ? "اختر اختبارًا موجودًا أو أنشئ اختبارًا جديدًا"
            : "Select an existing exam or create a new one"}
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            state.examMode === "new"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          onClick={() => dispatch({ type: "SET_EXAM_MODE", payload: "new" })}
        >
          {isAr ? "اختبار جديد" : "New Exam"}
        </button>
        <button
          type="button"
          className={`rounded-md px-4 py-2 text-sm font-medium transition ${
            state.examMode === "existing"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          }`}
          onClick={() =>
            dispatch({ type: "SET_EXAM_MODE", payload: "existing" })
          }
        >
          {isAr ? "اختبار موجود" : "Existing Exam"}
        </button>
      </div>

      {state.examMode === "existing" ? (
        <div className="space-y-3">
          {existingExams.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {isAr
                ? "لا توجد اختبارات مخططة. أنشئ اختبارًا جديدًا."
                : "No planned exams found. Create a new exam instead."}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {existingExams.map((exam) => {
                const isSelected = state.existingExamId === exam.id
                return (
                  <Card
                    key={exam.id}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? "ring-primary ring-2"
                        : "hover:border-primary/50"
                    }`}
                    onClick={() =>
                      dispatch({
                        type: "SET_EXISTING_EXAM",
                        payload: exam.id,
                      })
                    }
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-sm font-medium">
                          {exam.title}
                        </CardTitle>
                        {isSelected && (
                          <Check className="text-primary h-4 w-4 shrink-0" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-xs">
                      <div className="flex gap-2">
                        <Badge variant="secondary">{exam.className}</Badge>
                        <Badge variant="outline">{exam.subjectName}</Badge>
                      </div>
                      <p className="text-muted-foreground">
                        {new Date(exam.examDate).toLocaleDateString(
                          isAr ? "ar" : "en"
                        )}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>{isAr ? "عنوان الاختبار" : "Exam Title"}</Label>
            <Input
              value={state.newExamTitle}
              onChange={(e) =>
                dispatch({
                  type: "SET_NEW_EXAM",
                  payload: { newExamTitle: e.target.value },
                })
              }
              placeholder={
                isAr ? "مثال: اختبار منتصف الفصل" : "e.g. Midterm Exam"
              }
            />
          </div>

          <div>
            <Label>{isAr ? "الفصل" : "Class"}</Label>
            <Select
              value={state.newExamClassId}
              onValueChange={(v) =>
                dispatch({
                  type: "SET_NEW_EXAM",
                  payload: { newExamClassId: v },
                })
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isAr ? "اختر الفصل" : "Select class"}
                />
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

          <div>
            <Label>{isAr ? "تاريخ الاختبار" : "Exam Date"}</Label>
            <Input
              type="date"
              value={state.newExamDate}
              onChange={(e) =>
                dispatch({
                  type: "SET_NEW_EXAM",
                  payload: { newExamDate: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Label>{isAr ? "وقت البدء" : "Start Time"}</Label>
            <Input
              type="time"
              value={state.newExamStartTime}
              onChange={(e) =>
                dispatch({
                  type: "SET_NEW_EXAM",
                  payload: { newExamStartTime: e.target.value },
                })
              }
            />
          </div>

          <div>
            <Label>{isAr ? "المدة (بالدقائق)" : "Duration (minutes)"}</Label>
            <Input
              type="number"
              min={15}
              max={480}
              value={state.newExamDuration}
              onChange={(e) =>
                dispatch({
                  type: "SET_NEW_EXAM",
                  payload: {
                    newExamDuration: parseInt(e.target.value) || 60,
                  },
                })
              }
            />
          </div>

          <div>
            <Label>{isAr ? "الدرجة الكلية" : "Total Marks"}</Label>
            <Input
              type="number"
              min={1}
              value={state.newExamTotalMarks}
              onChange={(e) =>
                dispatch({
                  type: "SET_NEW_EXAM",
                  payload: {
                    newExamTotalMarks: parseInt(e.target.value) || 100,
                  },
                })
              }
            />
          </div>

          <div>
            <Label>{isAr ? "درجة النجاح" : "Passing Marks"}</Label>
            <Input
              type="number"
              min={1}
              max={state.newExamTotalMarks}
              value={state.newExamPassingMarks}
              onChange={(e) =>
                dispatch({
                  type: "SET_NEW_EXAM",
                  payload: {
                    newExamPassingMarks: parseInt(e.target.value) || 50,
                  },
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}
