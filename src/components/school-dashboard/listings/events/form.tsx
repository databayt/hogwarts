"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import {
  createEvent,
  getEvent,
  updateEvent,
} from "@/components/school-dashboard/listings/events/actions"
import { eventCreateSchema } from "@/components/school-dashboard/listings/events/validation"

import { BasicInformationStep } from "./basic-information"
import { DetailsAttendeesStep } from "./details-attendees"
import { ScheduleLocationStep } from "./schedule-location"

interface EventCreateFormProps {
  /** Callback fired on successful create/update - use for optimistic refresh */
  onSuccess?: () => void
  lang?: Locale
  dictionary?: Dictionary["school"]["events"]
}

export function EventCreateForm({
  onSuccess,
  lang = "ar",
  dictionary,
}: EventCreateFormProps) {
  const { dictionary: fullDict } = useDictionary()
  const t = fullDict?.messages?.toast
  const { modal, closeModal } = useModal()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [originalLang, setOriginalLang] = useState<string | undefined>(
    undefined
  )

  const form = useForm<z.infer<typeof eventCreateSchema>>({
    resolver: zodResolver(eventCreateSchema),
    defaultValues: {
      title: "",
      description: "",
      eventType: "ACADEMIC",
      eventDate: new Date(),
      startTime: "",
      endTime: "",
      location: "",
      organizer: "",
      targetAudience: "",
      maxAttendees: undefined,
      isPublic: false,
      registrationRequired: false,
      notes: "",
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
      const res = await getEvent({ id: currentId, displayLang: lang })
      if (!res.success || !res.data) return
      const e = res.data as any

      // Preserve original lang for edits
      setOriginalLang(e.lang)

      form.reset({
        title: e.title ?? "",
        description: e.description ?? "",
        eventType: e.eventType ?? "ACADEMIC",
        eventDate: e.eventDate ? new Date(e.eventDate) : new Date(),
        startTime: e.startTime ?? "",
        endTime: e.endTime ?? "",
        location: e.location ?? "",
        organizer: e.organizer ?? "",
        targetAudience: e.targetAudience ?? "",
        maxAttendees: e.maxAttendees ?? undefined,
        isPublic: e.isPublic ?? false,
        registrationRequired: e.registrationRequired ?? false,
        notes: e.notes ?? "",
      })
    }
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  async function onSubmit(values: z.infer<typeof eventCreateSchema>) {
    try {
      // For new events, set lang to current locale
      // For edits, preserve the original stored lang
      const langValue = currentId ? originalLang || lang : lang

      const res = currentId
        ? await updateEvent({
            id: currentId,
            ...values,
            lang: langValue,
          } as any)
        : await createEvent({ ...values, lang: langValue } as any)

      if (res?.success) {
        toast.success(
          currentId
            ? t?.success?.updated || "Event updated"
            : t?.success?.created || "Event created"
        )
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
              ? t?.error?.updateFailed || "Failed to update event"
              : t?.error?.createFailed || "Failed to create event")
        )
      }
    } catch (error) {
      console.error("Form submission error:", error)
      toast.error(
        fullDict?.common?.unexpectedError || "An unexpected error occurred"
      )
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      const step1Fields = ["title", "eventType"] as const
      const step1Valid = await form.trigger(step1Fields)
      if (step1Valid) {
        setCurrentStep(2)
      }
    } else if (currentStep === 2) {
      const step2Fields = ["eventDate", "startTime", "endTime"] as const
      const step2Valid = await form.trigger(step2Fields)
      if (step2Valid) {
        setCurrentStep(3)
      }
    } else if (currentStep === 3) {
      await form.handleSubmit(onSubmit)()
    }
  }

  const handleSaveCurrentStep = async () => {
    if (currentId) {
      // For editing, save current step data
      const currentStepFields =
        currentStep === 1
          ? (["title", "eventType"] as const)
          : currentStep === 2
            ? (["eventDate", "startTime", "endTime", "location"] as const)
            : ([
                "organizer",
                "targetAudience",
                "maxAttendees",
                "isPublic",
                "registrationRequired",
                "notes",
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
    if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(1)
    } else {
      closeModal()
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <BasicInformationStep form={form} isView={isView} lang={lang} />
      case 2:
        return <ScheduleLocationStep form={form} isView={isView} />
      case 3:
        return <DetailsAttendeesStep form={form} isView={isView} />
      default:
        return null
    }
  }

  const stepLabels: Record<number, string> = {
    1: lang === "ar" ? "المعلومات الأساسية" : "Basic Information",
    2: lang === "ar" ? "الجدول والموقع" : "Schedule & Location",
    3: lang === "ar" ? "التفاصيل والحضور" : "Details & Attendees",
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={
            isView ? "View Event" : currentId ? "Edit Event" : "Create Event"
          }
          description={
            isView
              ? "View event details"
              : currentId
                ? "Update event details"
                : "Schedule a new school event"
          }
        >
          {renderCurrentStep()}
        </ModalFormLayout>

        <ModalFooter
          currentStep={currentStep}
          totalSteps={3}
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

export default EventCreateForm
