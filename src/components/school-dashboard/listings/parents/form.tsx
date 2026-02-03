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
  createParent,
  getParent,
  updateParent,
} from "@/components/school-dashboard/listings/parents/actions"
import { parentCreateSchema } from "@/components/school-dashboard/listings/parents/validation"

import { ContactStep } from "./contact"
import { InformationStep } from "./information"

interface ParentCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function ParentCreateForm({ onSuccess }: ParentCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const form = useForm<z.infer<typeof parentCreateSchema>>({
    resolver: zodResolver(parentCreateSchema),
    defaultValues: {
      givenName: "",
      surname: "",
      emailAddress: "",
      userId: "",
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
      const res = await getParent({ id: currentId })
      if (!res.success || !res.data) return
      const p = res.data as any
      form.reset({
        givenName: p.givenName ?? "",
        surname: p.surname ?? "",
        emailAddress: p.emailAddress ?? "",
        userId: p.userId ?? "",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: z.infer<typeof parentCreateSchema>) {
    try {
      const res = currentId
        ? await updateParent({ id: currentId, ...values })
        : await createParent(values)
      if (res?.success) {
        toast.success(currentId ? "Parent updated" : "Parent created")
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
            (currentId ? "Failed to update parent" : "Failed to create parent")
        )
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ["givenName", "surname"] as const
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
          ? (["givenName", "surname"] as const)
          : (["emailAddress", "userId"] as const)

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
        return <ContactStep form={form} isView={isView} />
      default:
        return null
    }
  }

  const stepLabels: Record<number, string> = {
    1: "Basic Information",
    2: "Contact Details",
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView ? "View Parent" : currentId ? "Edit Parent" : "Create Parent"
          }
          description={
            isView
              ? "View parent details"
              : currentId
                ? "Update parent details"
                : "Add a new parent to your school"
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

export default ParentCreateForm
