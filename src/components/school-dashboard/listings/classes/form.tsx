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
import {
  createClass,
  getClass,
  updateClass,
} from "@/components/school-dashboard/listings/classes/actions"
import { classCreateSchema } from "@/components/school-dashboard/listings/classes/validation"

import { InformationStep } from "./information"
import { ScheduleStep } from "./schedule"

interface ClassCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function ClassCreateForm({ onSuccess }: ClassCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const form = useForm<z.infer<typeof classCreateSchema>>({
    resolver: zodResolver(classCreateSchema) as any,
    defaultValues: {
      name: "",
      subjectId: "",
      teacherId: "",
      termId: "",
      startPeriodId: "",
      endPeriodId: "",
      classroomId: "",
      evaluationType: "NORMAL",
      courseCode: undefined,
      credits: undefined,
      minCapacity: undefined,
      maxCapacity: undefined,
      duration: undefined,
      prerequisiteId: undefined,
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
      const res = await getClass({ id: currentId })
      if (!res.success || !res.data) return
      const c = res.data as any
      form.reset({
        name: c.name ?? "",
        subjectId: c.subjectId ?? "",
        teacherId: c.teacherId ?? "",
        termId: c.termId ?? "",
        startPeriodId: c.startPeriodId ?? "",
        endPeriodId: c.endPeriodId ?? "",
        classroomId: c.classroomId ?? "",
        gradeId: c.gradeId ?? undefined,
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: z.infer<typeof classCreateSchema>) {
    try {
      const res = currentId
        ? await updateClass({ id: currentId, ...values })
        : await createClass(values)
      if (res?.success) {
        toast.success(currentId ? "Class updated" : "Class created")
        if (res.warning) {
          toast.warning(res.warning)
        }
        closeModal()
        // Use callback for optimistic update, fallback to router.refresh()
        if (onSuccess) {
          onSuccess()
        } else {
          router.refresh()
        }
      } else {
        toast.error(
          res?.error ||
            (currentId ? "Failed to update class" : "Failed to create class")
        )
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ["name", "subjectId", "teacherId"] as const
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
          ? (["name", "subjectId", "teacherId"] as const)
          : (["termId", "startPeriodId", "endPeriodId", "classroomId"] as const)

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
        return <ScheduleStep form={form} isView={isView} />
      default:
        return null
    }
  }

  const stepLabels: Record<number, string> = {
    1: "Basic Information",
    2: "Schedule Details",
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView ? "View Class" : currentId ? "Edit Class" : "Create Class"
          }
          description={
            isView
              ? "View class details"
              : currentId
                ? "Update class details"
                : "Create a new class for your school"
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
        />
      </form>
    </Form>
  )
}

export default ClassCreateForm
