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

import { Form } from "@/components/ui/form"
import { ErrorToast } from "@/components/atom/toast"
import { SelectField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import {
  getAssignmentsForGrade,
  getClassesForGrade,
  getExamsForGrade,
  getStudentsForGrade,
  getSubjectsForGrade,
  updateGradeSelection,
} from "./actions"
import { selectionSchema, type SelectionFormData } from "./validation"

interface StudentOption {
  id: string
  givenName: string
  surname: string
}

interface ClassOption {
  id: string
  name: string
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
  subjectName: string
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
    const [classes, setClasses] = useState<ClassOption[]>([])
    const [assignments, setAssignments] = useState<AssignmentOption[]>([])
    const [exams, setExams] = useState<ExamOption[]>([])
    const [subjects, setSubjects] = useState<SubjectOption[]>([])

    const form = useForm<SelectionFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(selectionSchema) as any,
      defaultValues: {
        studentId: initialData?.studentId || "",
        classId: initialData?.classId || "",
        assignmentId: initialData?.assignmentId,
        examId: initialData?.examId,
        subjectId: initialData?.subjectId,
      },
    })

    const studentId = form.watch("studentId")
    const classId = form.watch("classId")

    // Notify parent of validity changes
    React.useEffect(() => {
      const isValid =
        studentId?.trim().length >= 1 && classId?.trim().length >= 1
      onValidChange?.(isValid)
    }, [studentId, classId, onValidChange])

    // Load students, classes, and subjects on mount
    useEffect(() => {
      async function loadOptions() {
        const [studentsRes, classesRes, subjectsRes] = await Promise.all([
          getStudentsForGrade(),
          getClassesForGrade(),
          getSubjectsForGrade(),
        ])
        if (studentsRes.success && studentsRes.data) {
          setStudents(studentsRes.data)
        }
        if (classesRes.success && classesRes.data) {
          setClasses(classesRes.data)
        }
        if (subjectsRes.success && subjectsRes.data) {
          setSubjects(subjectsRes.data)
        }
      }
      loadOptions()
    }, [])

    // Reload assignments and exams when classId changes
    useEffect(() => {
      if (!classId) {
        setAssignments([])
        setExams([])
        return
      }

      async function loadClassDependents() {
        const [assignmentsRes, examsRes] = await Promise.all([
          getAssignmentsForGrade(classId),
          getExamsForGrade(classId),
        ])
        if (assignmentsRes.success && assignmentsRes.data) {
          setAssignments(assignmentsRes.data)
        }
        if (examsRes.success && examsRes.data) {
          setExams(examsRes.data)
        }
      }
      loadClassDependents()
    }, [classId])

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
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    const studentOptions = students.map((s) => ({
      label: `${s.givenName} ${s.surname}`,
      value: s.id,
    }))

    const classOptions = classes.map((c) => ({
      label: c.name,
      value: c.id,
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
      label: s.subjectName,
      value: s.id,
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          <SelectField
            name="studentId"
            label="Student"
            options={studentOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="classId"
            label="Class"
            options={classOptions}
            required
            disabled={isPending}
          />
          <SelectField
            name="assignmentId"
            label="Assignment"
            options={assignmentOptions}
            disabled={isPending || !classId}
          />
          <SelectField
            name="examId"
            label="Exam"
            options={examOptions}
            disabled={isPending || !classId}
          />
          <SelectField
            name="subjectId"
            label="Subject"
            options={subjectOptions}
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

SelectionForm.displayName = "SelectionForm"
