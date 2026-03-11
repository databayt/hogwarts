"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Form } from "@/components/ui/form"
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  createStudent,
  getGradesAndSections,
  getStudent,
  updateStudent,
} from "@/components/school-dashboard/listings/students/actions"
import {
  createStudentCreateSchema,
  studentCreateSchema as legacyStudentCreateSchema,
} from "@/components/school-dashboard/listings/students/validation"

import { STEP_FIELDS, STEPS, TOTAL_FIELDS } from "./config"
import { EnrollmentStep } from "./enrollment"
import { InformationStep } from "./information"

interface StudentCreateFormProps {
  dictionary?: Dictionary["school"]["students"]
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function StudentCreateForm({
  dictionary,
  onSuccess,
}: StudentCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [academicGrades, setAcademicGrades] = useState<
    Array<{
      id: string
      name: string
      gradeNumber: number
      level: { id: string; name: string; level: string } | null
    }>
  >([])
  const [sections, setSections] = useState<
    Array<{
      id: string
      name: string
      gradeId: string
      maxCapacity: number
      currentCount: number
    }>
  >([])

  // Create localized schema (memoized)
  // Note: dictionary prop is Dictionary["school"]["students"] (subsection),
  // but createStudentCreateSchema expects a full Dictionary with messages.validation.
  // Use legacy schema since we don't have the full dictionary here.
  const studentCreateSchema = useMemo(() => {
    return legacyStudentCreateSchema
  }, [])

  const form = useForm<z.infer<typeof studentCreateSchema>>({
    resolver: zodResolver(studentCreateSchema),
    defaultValues: {
      givenName: "",
      middleName: "",
      surname: "",
      dateOfBirth: "",
      gender: undefined as unknown as "male" | "female" | undefined,
      enrollmentDate: "",
      userId: "",
      academicGradeId: "",
      sectionId: "",
    },
  })

  const isView = !!(modal.id && modal.id.startsWith("view:"))
  const currentId = modal.id
    ? modal.id.startsWith("view:")
      ? modal.id.split(":")[1]
      : modal.id
    : undefined

  // Load grades and sections on mount
  useEffect(() => {
    const loadGradesAndSections = async () => {
      const res = await getGradesAndSections()
      if (res.success && res.data) {
        setAcademicGrades(res.data.grades)
        setSections(res.data.sections)
      }
    }
    void loadGradesAndSections()
  }, [])

  useEffect(() => {
    const load = async () => {
      if (!currentId) return
      const res = await getStudent({ id: currentId })
      if (!res.success || !res.data) return
      const s = res.data as any
      form.reset({
        givenName: s.givenName ?? "",
        middleName: s.middleName ?? "",
        surname: s.surname ?? "",
        dateOfBirth: s.dateOfBirth
          ? new Date(s.dateOfBirth).toISOString().slice(0, 10)
          : "",
        gender:
          ((s.gender ?? "") as string).toLowerCase() === "female"
            ? "female"
            : "male",
        enrollmentDate: s.enrollmentDate
          ? new Date(s.enrollmentDate).toISOString().slice(0, 10)
          : "",
        userId: s.userId ?? "",
        academicGradeId: s.academicGradeId ?? "",
        sectionId: s.sectionId ?? "",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: z.infer<typeof studentCreateSchema>) {
    // Prevent double submissions
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const res = currentId
        ? await updateStudent({ id: currentId, ...values })
        : await createStudent(values)

      if (res?.success) {
        const successMsg = currentId
          ? "Student updated successfully"
          : "Student created successfully"
        toast.success(successMsg)
        // Refresh data first, then close modal
        if (onSuccess) {
          await onSuccess()
        }
        // Always call router.refresh to ensure server data is updated
        router.refresh()
        // Close modal after refresh
        closeModal()
      } else {
        // Show error but also close modal so user doesn't get stuck
        const errorMsg =
          res?.error ||
          (currentId ? "Failed to update student" : "Failed to create student")
        toast.error(errorMsg)
        // Close modal after showing error - user can try again
        closeModal()
      }
    } catch (error) {
      console.error("Form submission error:", error)
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error(errorMessage)
      // Close modal even on exception so user doesn't get stuck
      closeModal()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = [
        "givenName",
        "middleName",
        "surname",
        "dateOfBirth",
        "gender",
      ] as const
      const step1Valid = await form.trigger(step1Fields)
      if (step1Valid) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      await form.handleSubmit(onSubmit)()
    }
  }

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields =
        currentStep === 1
          ? ([
              "givenName",
              "middleName",
              "surname",
              "dateOfBirth",
              "gender",
            ] as const)
          : ([
              "enrollmentDate",
              "userId",
              "academicGradeId",
              "sectionId",
            ] as const)

      const stepValid = await form.trigger(currentStepFields)
      if (stepValid) {
        await form.handleSubmit(onSubmit)()
      }
    } else {
      // For creating, just go to next step
      await handleNext()
    }
  }

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1)
    } else {
      closeModal()
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <InformationStep form={form} isView={isView} />
      case 2:
        return (
          <EnrollmentStep
            form={form}
            isView={isView}
            academicGrades={academicGrades}
            sections={sections}
          />
        )
      default:
        return null
    }
  }

  // Calculate progress based on filled fields
  const values = form.watch()
  const getFilledFieldsCount = () => {
    const allFields = [...STEP_FIELDS[1], ...STEP_FIELDS[2]]
    const filledCount = allFields.filter((field) => {
      const value = values[field as keyof typeof values]
      return value !== undefined && value !== "" && value !== null
    }).length
    return filledCount
  }
  const progressPercentage = (getFilledFieldsCount() / TOTAL_FIELDS) * 100

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView
              ? "View Student"
              : currentId
                ? "Edit Student"
                : "Create Student"
          }
          description={
            isView
              ? "View student details"
              : currentId
                ? "Update student details"
                : "Add a new student to your school"
          }
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={2}
          stepLabel={STEPS[currentStep as keyof typeof STEPS]}
          isView={isView}
          isEdit={!!currentId}
          isSubmitting={isSubmitting}
          isDirty={form.formState.isDirty}
          progress={progressPercentage}
          onBack={handleBack}
          onNext={handleNext}
          onSaveStep={handleSaveCurrentStep}
        />
      </form>
    </Form>
  )
}

export default StudentCreateForm
