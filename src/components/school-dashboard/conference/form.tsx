"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Live-class wizard — five compact steps (Basics → Schedule → Meeting →
// References → Access) inside the standard modal, following the house
// stepped-modal idiom (classes/events/invoice forms): local step state,
// per-step `form.trigger`, ModalFooter with step ratio. Kept deliberately
// light per step, like the school-onboarding and application wizards.
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import {
  NONE,
  STEP_FIELDS,
  StepAccess,
  StepBasics,
  StepMeeting,
  StepReferences,
  StepSchedule,
  TOTAL_STEPS,
  type WizardFormValues,
} from "./form-steps"
import {
  createLiveClass,
  getLiveClass,
  getLiveClassReferenceOptions,
  updateLiveClass,
} from "./list-actions"
import {
  createLiveClassSchema,
  type LiveClassFormData,
} from "./list-validation"
import {
  type LiveClassFormOptions,
  type LiveClassReferenceData,
} from "./queries"

const HTTP_URL = /^https?:\/\/.+/

interface LiveClassFormProps {
  onSuccess?: () => void
  lang?: Locale
  dictionary: Dictionary["school"]["liveClasses"]
  /**
   * Dropdown options resolved on the server and passed in as stable props.
   * The form deliberately does NOT fetch these on mount: a parent re-render
   * loop would turn an on-mount fetch into a request storm and flicker the
   * option-backed selects on every remount.
   */
  options: LiveClassFormOptions
  /** Whether the in-app (LiveKit) room back-end is provisioned. */
  liveKitAvailable?: boolean
}

export function LiveClassForm({
  onSuccess,
  lang = "en",
  dictionary,
  options,
  liveKitAvailable = false,
}: LiveClassFormProps) {
  const { modal, closeModal } = useModal()
  // `isPending` reflects ONLY an in-flight submit — it drives the "Saving…"
  // footer label and disables every field while saving.
  const [isPending, startTransition] = useTransition()
  const [currentStep, setCurrentStep] = useState(1)
  const itemId = modal.id
  const isEdit = !!itemId

  const t = dictionary
  const f = t.form

  const schema = useMemo(
    () => createLiveClassSchema(t.validation),
    [t.validation]
  )

  const form = useForm<WizardFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: "",
      teacherId: "",
      subjectId: "",
      sectionId: "",
      provider: liveKitAvailable ? "livekit" : "external",
      meetingUrl: "",
      meetingProvider: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      status: "scheduled",
      visibility: "section",
      description: "",
      recordingEnabled: true,
      maxParticipants: 50,
      catalogLessonId: "",
      resources: [],
      saveAsDefault: false,
      examRefId: "",
      assignmentRefId: "",
      linkUrl: "",
      linkTitle: "",
    },
  })

  // Reference-picker data, fetched once per chosen subject — on step entry,
  // never on mount (request-storm rule).
  const [refData, setRefData] = useState<LiveClassReferenceData | null>(null)
  const [refLoading, setRefLoading] = useState(false)
  const refLoadedFor = useRef<string | null>(null)

  const loadRefData = async (subjectId: string) => {
    if (!subjectId || refLoadedFor.current === subjectId) return
    refLoadedFor.current = subjectId
    setRefLoading(true)
    try {
      const res = await getLiveClassReferenceOptions({ subjectId })
      if (res.success && res.data) setRefData(res.data)
    } finally {
      setRefLoading(false)
    }
  }

  // Load existing data for edit mode. Plain async — prefilling values must not
  // flip the submit-pending UI ("Saving…" + disabled fields) on open.
  useEffect(() => {
    if (isEdit && itemId) {
      let active = true
      ;(async () => {
        const result = await getLiveClass({ id: itemId })
        if (active && result.success && result.data) {
          const d = result.data
          const start = new Date(d.scheduledStart)
          const end = new Date(d.scheduledEnd)
          const examRef = d.resources.find((r) => r.schoolExamId)
          const assignmentRef = d.resources.find((r) => r.schoolAssignmentId)
          const linkRef = d.resources.find((r) => r.url)
          form.reset({
            ...form.getValues(),
            title: d.title,
            teacherId: d.teacherId,
            subjectId: d.subjectId ?? "",
            sectionId: d.sectionId ?? "",
            provider: d.provider === "livekit" ? "livekit" : "external",
            meetingUrl: d.meetingUrl ?? "",
            meetingProvider: d.meetingProvider ?? "",
            startDate: start,
            endDate: end,
            startTime: toTimeString(start),
            endTime: toTimeString(end),
            status: d.status as LiveClassFormData["status"],
            visibility: d.visibility === "school" ? "school" : "section",
            description: d.description ?? "",
            recordingEnabled: d.recordingEnabled,
            maxParticipants: d.maxParticipants,
            catalogLessonId: d.catalogLessonId ?? "",
            examRefId: examRef?.schoolExamId ?? "",
            assignmentRefId: assignmentRef?.schoolAssignmentId ?? "",
            linkUrl: linkRef?.url ?? "",
            linkTitle: linkRef?.title ?? "",
          })
          // Pre-load picker labels so saved references display on step 4.
          if (d.subjectId) void loadRefData(d.subjectId)
        }
      })()
      return () => {
        active = false
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, itemId, form])

  /** Compose the resources array from the three UI pickers. */
  const composeResources = (): LiveClassFormData["resources"] => {
    const v = form.getValues()
    const rows: LiveClassFormData["resources"] = []
    if (v.examRefId && v.examRefId !== NONE) {
      rows.push({
        schoolExamId: v.examRefId,
        schoolAssignmentId: null,
        url: null,
        title: null,
      })
    }
    if (v.assignmentRefId && v.assignmentRefId !== NONE) {
      rows.push({
        schoolExamId: null,
        schoolAssignmentId: v.assignmentRefId,
        url: null,
        title: null,
      })
    }
    if (v.linkUrl) {
      rows.push({
        schoolExamId: null,
        schoolAssignmentId: null,
        url: v.linkUrl,
        title: v.linkTitle || null,
      })
    }
    return rows
  }

  const onSubmit = async (data: LiveClassFormData) => {
    startTransition(async () => {
      const catalogLessonId =
        data.catalogLessonId && data.catalogLessonId !== NONE
          ? data.catalogLessonId
          : null

      const result = isEdit
        ? await updateLiveClass({
            id: itemId!,
            title: data.title,
            teacherId: data.teacherId,
            subjectId: data.subjectId || null,
            sectionId: data.sectionId || null,
            // Provider is immutable; the URL only applies to external links.
            ...(data.provider === "external" && data.meetingUrl
              ? { meetingUrl: data.meetingUrl }
              : {}),
            meetingProvider: data.meetingProvider || null,
            startDate: data.startDate,
            endDate: data.endDate,
            startTime: data.startTime,
            endTime: data.endTime,
            status: data.status,
            visibility: data.visibility,
            recordingEnabled: data.recordingEnabled,
            maxParticipants: data.maxParticipants,
            catalogLessonId,
            resources: data.resources,
            description: data.description || null,
          })
        : await createLiveClass({
            ...data,
            subjectId: data.subjectId || null,
            sectionId: data.sectionId || null,
            meetingProvider: data.meetingProvider || null,
            description: data.description || null,
            catalogLessonId,
          })

      if (result.success) {
        SuccessToast(isEdit ? t.toasts.updated : t.toasts.created)
        closeModal()
        onSuccess?.()
      } else {
        ErrorToast(t.toasts.failed)
      }
    })
  }

  const handleNext = async () => {
    if (currentStep < TOTAL_STEPS) {
      // Step 3's URL requirement only applies to external sessions — the
      // full-schema resolver handles that via superRefine, and trigger()
      // surfaces just this step's fields.
      const fields = STEP_FIELDS[currentStep] ?? []
      const valid = fields.length ? await form.trigger(fields) : true
      if (!valid) return
      const next = currentStep + 1
      // Entering References: fetch pickers for the chosen subject once.
      if (next === 4) {
        const subjectId = form.getValues("subjectId")
        if (subjectId) void loadRefData(subjectId)
      }
      setCurrentStep(next)
      return
    }

    // Last step — inline-check the ad-hoc link, compose references, submit.
    const linkUrl = form.getValues("linkUrl")
    if (linkUrl && !HTTP_URL.test(linkUrl)) {
      form.setError("linkUrl", {
        type: "manual",
        message: t.validation?.resourceUrlInvalid,
      })
      setCurrentStep(4)
      return
    }
    form.setValue("resources", composeResources())
    await form.handleSubmit(onSubmit)()
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      closeModal()
    }
  }

  // Edit mode: save from any step without walking to the end.
  const handleSaveCurrentStep = async () => {
    if (!isEdit) {
      await handleNext()
      return
    }
    const fields = STEP_FIELDS[currentStep] ?? []
    const valid = fields.length ? await form.trigger(fields) : true
    if (!valid) return
    form.setValue("resources", composeResources())
    await form.handleSubmit(onSubmit)()
  }

  const stepLabels: Record<number, string> = {
    1: t.steps.basics,
    2: t.steps.schedule,
    3: t.steps.meeting,
    4: t.steps.references,
    5: t.steps.access,
  }

  const subjectId = form.watch("subjectId")

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <StepBasics f={f} options={options} isPending={isPending} />
      case 2:
        return <StepSchedule f={f} lang={lang} isPending={isPending} />
      case 3:
        return (
          <StepMeeting
            f={f}
            isPending={isPending}
            isEdit={isEdit}
            liveKitAvailable={liveKitAvailable}
          />
        )
      case 4:
        return (
          <StepReferences
            f={f}
            isPending={isPending}
            hasSubject={!!subjectId}
            refData={refData}
            refLoading={refLoading}
          />
        )
      case 5:
        return <StepAccess f={f} isPending={isPending} />
      default:
        return null
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <ModalFormLayout
          title={isEdit ? t.edit : t.create}
          description={isEdit ? t.editDescription : t.createDescription}
        >
          {renderCurrentStep()}
        </ModalFormLayout>
      </form>

      <ModalFooter
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        stepLabel={stepLabels[currentStep]}
        isEdit={isEdit}
        isSubmitting={isPending}
        isDirty={form.formState.isDirty}
        onBack={handleBack}
        onNext={handleNext}
        onSaveStep={handleSaveCurrentStep}
        labels={{
          cancel: t.cancel,
          back: t.back,
          next: t.next,
          create: t.create,
          save: t.save,
          saving: t.saving,
          stepOf: t.steps.stepOf,
        }}
      />
    </Form>
  )
}

function toTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

export default LiveClassForm
