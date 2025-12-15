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
  createSubject,
  getSubject,
  updateSubject,
} from "@/components/platform/subjects/actions"
import { subjectCreateSchema } from "@/components/platform/subjects/validation"

import { InformationStep } from "./information"

interface SubjectCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function SubjectCreateForm({ onSuccess }: SubjectCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const form = useForm<z.infer<typeof subjectCreateSchema>>({
    resolver: zodResolver(subjectCreateSchema),
    defaultValues: {
      subjectName: "",
      departmentId: "",
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
      const res = await getSubject({ id: currentId })
      if (!res.success || !res.data) return
      const s = res.data as any
      form.reset({
        subjectName: s.subjectName ?? "",
        departmentId: s.departmentId ?? "",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: z.infer<typeof subjectCreateSchema>) {
    try {
      const res = currentId
        ? await updateSubject({ id: currentId, ...values })
        : await createSubject(values)
      if (res?.success) {
        toast.success(currentId ? "Subject updated" : "Subject created")
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
            (currentId
              ? "Failed to update subject"
              : "Failed to create subject")
        )
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ["subjectName", "departmentId"] as const
      const step1Valid = await form.trigger(step1Fields)
      if (step1Valid) {
        await form.handleSubmit(onSubmit)()
      }
    }
  }

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields = ["subjectName", "departmentId"] as const
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
    closeModal()
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <InformationStep form={form} isView={isView} />
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView
              ? "View Subject"
              : currentId
                ? "Edit Subject"
                : "Create Subject"
          }
          description={
            isView
              ? "View subject details"
              : currentId
                ? "Update subject details"
                : "Add a new subject to your school"
          }
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={1}
          stepLabel="Subject Details"
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

export default SubjectCreateForm
