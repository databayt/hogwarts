"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Form } from "@/components/ui/form"
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from "@/components/school-dashboard/listings/announcements/actions"
import {
  announcementCreateSchema,
  type AnnouncementFormValues,
} from "@/components/school-dashboard/listings/announcements/validation"

import { InformationStep } from "./information"
import { ScopeStep } from "./scope"

interface AnnouncementCreateFormProps {
  dictionary: Dictionary["school"]["announcements"]
  lang: Locale
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
}

export function AnnouncementCreateForm({
  dictionary,
  lang,
  onSuccess,
}: AnnouncementCreateFormProps) {
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const t = dictionary
  // Two steps only: 1 = Content, 2 = Scope
  const [currentStep, setCurrentStep] = useState(1)

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementCreateSchema) as any,
    defaultValues: {
      title: "",
      body: "",
      lang: lang === "ar" ? "ar" : "en",
      scope: "school",
      classId: "",
      role: "",
      published: false,
      priority: "normal",
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
      const res = await getAnnouncement({ id: currentId })
      if (!res.success || !res.data) return
      const a = res.data
      form.reset({
        title: a.title ?? "",
        body: a.body ?? "",
        lang: (a.lang as "ar" | "en") ?? "ar",
        scope: (a.scope as "school" | "class" | "role") ?? "school",
        classId: a.classId ?? "",
        role: a.role ?? "",
        published: a.published ?? false,
        priority:
          (a.priority as "low" | "normal" | "high" | "urgent") ?? "normal",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: AnnouncementFormValues) {
    // Set language from app locale
    values.lang = lang === "ar" ? "ar" : "en"

    const res = currentId
      ? await updateAnnouncement({ id: currentId, ...values })
      : await createAnnouncement(values)

    if (res?.success) {
      toast.success(currentId ? t.announcementUpdated : t.announcementCreated)
      closeModal()
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
      // Content step - validate title and body
      const contentFields = ["title", "body"] as const
      const contentValid = await form.trigger(contentFields)
      if (contentValid) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      // Scope step - submit
      await form.handleSubmit(onSubmit)()
    }
  }

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const contentFields: (keyof AnnouncementFormValues)[] = ["title", "body"]
      const scopeFields: (keyof AnnouncementFormValues)[] = [
        "scope",
        "classId",
        "role",
        "published",
        "priority",
      ]
      const currentStepFields = currentStep === 1 ? contentFields : scopeFields

      const stepValid = await form.trigger(
        currentStepFields as readonly (keyof AnnouncementFormValues)[]
      )
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
          <InformationStep
            form={form}
            isView={isView}
            dictionary={dictionary}
            lang={lang}
          />
        )
      case 2:
        return (
          <ScopeStep
            form={form}
            isView={isView}
            dictionary={dictionary}
            lang={lang}
          />
        )
      default:
        return null
    }
  }

  const stepLabels: Record<number, string> = {
    1: t.basicInformation,
    2: t.scopeAndPublishing,
  }

  // Always 2 steps: Content → Scope
  const totalSteps = 2

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView
              ? t.viewAnnouncement
              : currentId
                ? t.editAnnouncement
                : t.createAnnouncement
          }
          description={
            isView
              ? t.viewAnnouncementDetails
              : currentId
                ? t.updateAnnouncementDetails
                : t.createNewAnnouncement
          }
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabel={stepLabels[currentStep]}
          isView={isView}
          isEdit={!!currentId}
          isDirty={form.formState.isDirty}
          isSubmitting={false}
          onBack={handleBack}
          onNext={handleNext}
          onSaveStep={handleSaveCurrentStep}
          labels={{
            cancel: t.cancel,
            back: t.back,
            next: t.next,
            save: t.save,
            create: t.create,
          }}
        />
      </form>
    </Form>
  )
}

export default AnnouncementCreateForm
