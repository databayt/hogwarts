"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import {
  getAssignmentsForStudent,
  getExamsForStudent,
  getStudentsForGrade,
  getSubjectsForStudent,
  updateGradeSelection,
} from "./actions"
import { selectionSchema, type SelectionFormData } from "./validation"

interface StudentOption {
  id: string
  firstName: string
  lastName: string
}

interface AssignmentOption {
  id: string
  title: string
}

interface ExamOption {
  id: string
  title: string
}

interface SubjectOption {
  id: string
  name: string
}

interface SelectionFormProps {
  resultId: string
  initialData?: Partial<SelectionFormData>
  onValidChange?: (isValid: boolean) => void
}

export const SelectionForm = forwardRef<WizardFormRef, SelectionFormProps>(
  ({ resultId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()
    const [students, setStudents] = useState<StudentOption[]>([])
    const [assignments, setAssignments] = useState<AssignmentOption[]>([])
    const [exams, setExams] = useState<ExamOption[]>([])
    const [subjects, setSubjects] = useState<SubjectOption[]>([])
    const { dictionary: dict } = useDictionary()
    const d = dict?.school?.grades as Record<string, any> | undefined

    const form = useForm<SelectionFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(selectionSchema) as any,
      defaultValues: {
        studentId: initialData?.studentId || "",
        subjectId: initialData?.subjectId || "",
        assignmentId: initialData?.assignmentId,
        examId: initialData?.examId,
      },
    })

    const studentId = form.watch("studentId")
    const subjectId = form.watch("subjectId")

    // Notify parent of validity changes
    React.useEffect(() => {
      const isValid =
        studentId?.trim().length >= 1 && subjectId?.trim().length >= 1
      onValidChange?.(isValid)
    }, [studentId, subjectId, onValidChange])

    // Load students on mount
    useEffect(() => {
      getStudentsForGrade().then((res) => {
        if (res.success && res.data) setStudents(res.data)
      })
    }, [])

    // The subjects the chosen student studies (their grade's)
    useEffect(() => {
      if (!studentId) return
      let alive = true
      getSubjectsForStudent(studentId).then((res) => {
        if (alive && res.success && res.data) setSubjects(res.data)
      })
      return () => {
        alive = false
      }
    }, [studentId])

    // Exams and assignments of that subject for that student
    useEffect(() => {
      if (!studentId || !subjectId) return
      let alive = true
      Promise.all([
        getAssignmentsForStudent(studentId, subjectId),
        getExamsForStudent(studentId, subjectId),
      ]).then(([assignmentsRes, examsRes]) => {
        if (!alive) return
        setAssignments(
          assignmentsRes.success && assignmentsRes.data
            ? assignmentsRes.data
            : []
        )
        setExams(examsRes.success && examsRes.data ? examsRes.data : [])
      })
      return () => {
        alive = false
      }
    }, [studentId, subjectId])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(new Error("Validation failed"))
                return
              }
              const data = form.getValues()
              const result = await updateGradeSelection(resultId, data)
              if (!result.success) {
                ErrorToast(
                  actionErrorMessage(result.error, dict, d?.failedToSave || "")
                )
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg =
                err instanceof Error ? err.message : d?.failedToSave || ""
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    const studentOptions = students.map((s) => ({
      label: `${s.firstName} ${s.lastName}`,
      value: s.id,
    }))

    const assignmentOptions = assignments.map((a) => ({
      label: a.title,
      value: a.id,
    }))

    const examOptions = exams.map((e) => ({
      label: e.title,
      value: e.id,
    }))

    const subjectOptions = subjects.map((s) => ({
      label: s.name,
      value: s.id,
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <SelectField
            name="studentId"
            label={d?.student || "Student"}
            options={studentOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="subjectId"
            label={d?.subject || "Subject"}
            options={subjectOptions}
            required
            disabled={isPending || !studentId}
          />
          <SelectField
            name="examId"
            label={d?.exam || "Exam"}
            options={examOptions}
            disabled={isPending || !subjectId}
          />
          <SelectField
            name="assignmentId"
            label={d?.assignment || "Assignment"}
            options={assignmentOptions}
            disabled={isPending || !subjectId}
          />
        </form>
      </Form>
    )
  }
)

SelectionForm.displayName = "SelectionForm"
