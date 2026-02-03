"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Form } from "@/components/ui/form"
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import { type Dictionary } from "@/components/internationalization/dictionaries"
import {
  createResult,
  getResult,
  updateResult,
} from "@/components/school-dashboard/listings/grades/actions"
import { resultCreateSchema } from "@/components/school-dashboard/listings/grades/validation"

import { GradingStep } from "./grading"
import { StudentAssignmentStep } from "./student-assignment"

interface ResultCreateFormProps {
  dictionary: Dictionary["school"]["grades"]
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function ResultCreateForm({
  dictionary,
  onSuccess,
}: ResultCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const t = dictionary
  const form = useForm<z.infer<typeof resultCreateSchema>>({
    resolver: zodResolver(resultCreateSchema),
    defaultValues: {
      studentId: "",
      assignmentId: "",
      classId: "",
      score: 0,
      maxScore: 0,
      grade: "",
      feedback: "",
    },
  })

  const isView = !!(modal.id && modal.id.startsWith("view:"))
  const currentId = modal.id
    ? modal.id.startsWith("view:")
      ? modal.id.split(":")[1]
      : modal.id
    : undefined

  useEffect(() => {
    const load = async () => {
      if (!currentId) return
      const res = await getResult({ id: currentId })
      if (!res.success || !res.data) return
      const r = res.data
      form.reset({
        studentId: r.studentId ?? "",
        assignmentId: r.assignmentId ?? "",
        classId: r.classId ?? "",
        score: r.score ?? 0,
        maxScore: r.maxScore ?? 0,
        grade: r.grade ?? "",
        feedback: r.feedback ?? "",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: z.infer<typeof resultCreateSchema>) {
    const res = currentId
      ? await updateResult({ id: currentId, ...values })
      : await createResult(values)
    if (res?.success) {
      toast.success(currentId ? t.resultUpdated : t.resultCreated)
      closeModal()
      // Use callback for optimistic update, fallback to router.refresh()
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } else {
      toast.error(currentId ? t.failedToUpdate : t.failedToCreate)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ["studentId", "assignmentId", "classId"] as const
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
          ? (["studentId", "assignmentId", "classId"] as const)
          : (["score", "maxScore", "grade", "feedback"] as const)

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
        return (
          <StudentAssignmentStep form={form} isView={isView} dictionary={t} />
        )
      case 2:
        return <GradingStep form={form} isView={isView} dictionary={t} />
      default:
        return null
    }
  }

  const stepLabels: Record<number, string> = {
    1: t.studentAssignmentInfo || "Student & Assignment",
    2: t.gradingInfo || "Grading",
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView ? t.viewResult : currentId ? t.editResult : t.createResult
          }
          description={
            isView
              ? t.viewResultDetails
              : currentId
                ? t.updateResultDetails
                : t.recordNewResult
          }
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={2}
          stepLabel={stepLabels[currentStep]}
          isView={isView}
          isEdit={!!currentId}
          isDirty={form.formState.isDirty}
          onBack={handleBack}
          onNext={handleNext}
          onSaveStep={handleSaveCurrentStep}
          labels={{
            cancel: t.cancel,
            back: t.back,
            next: t.next,
            save: t.save,
            create: t.createResult,
          }}
        />
      </form>
    </Form>
  )
}

export default ResultCreateForm
