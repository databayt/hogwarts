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
  getConferenceSlots,
  getLiveClass,
  getLiveClassReferenceOptions,
  updateLiveClass,
} from "./list-actions"
import {
  createLiveClassSchema,
  type LiveClassFormData,
} from "./list-validation"
import {
  type ConferenceSlotOption,
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
   * These deliberately are NOT fetched on mount: a parent re-render loop would
   * turn an on-mount fetch into a request storm and flicker the option-backed
   * selects on every remount. (The timetable-slot list is the one exception —
   * it is far too big to ship on every page load, so it is fetched once when
   * the wizard mounts, inside the modal that only opens on demand.)
   */
  options: LiveClassFormOptions
  /** Whether the in-app (LiveKit) room back-end is provisioned. */
  liveKitAvailable?: boolean
  /** Localized day names, Sunday-first — labels the timetable slot picker. */
  dayNames?: string[]
}

export function LiveClassForm({
  onSuccess,
  lang = "en",
  dictionary,
  options,
  liveKitAvailable = false,
  dayNames,
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
      timetableId: NONE,
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

  /** The grade of the currently chosen section — narrows catalog lessons. */
  const gradeNumberForSection = (sectionId: string | null | undefined) =>
    options.sections.find((s) => s.id === sectionId)?.gradeNumber

  const loadRefData = async (subjectId: string, gradeNumber?: number) => {
    const key = `${subjectId}:${gradeNumber ?? ""}`
    if (!subjectId || refLoadedFor.current === key) return
    refLoadedFor.current = key
    setRefLoading(true)
    try {
      const res = await getLiveClassReferenceOptions({ subjectId, gradeNumber })
      if (res.success && res.data) setRefData(res.data)
    } finally {
      setRefLoading(false)
    }
  }

  // The school's real class slots. Fetched once when the wizard opens (a term's
  // timetable is far too big to ship as page props), not per step.
  const [slots, setSlots] = useState<ConferenceSlotOption[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  useEffect(() => {
    let active = true
    setSlotsLoading(true)
    ;(async () => {
      const res = await getConferenceSlots()
      if (!active) return
      if (res.success && res.data) setSlots(res.data)
      setSlotsLoading(false)
    })()
    return () => {
      active = false
    }
  }, [])

  /**
   * Anchoring to a real class fills the whole "who/what/when" block from the
   * schedule: teacher, subject, section, the period's time window, and the
   * next date that weekday falls on. The server re-derives the first three
   * from the slot row, so these values are a preview of what will be saved,
   * not the source of truth.
   */
  const handleSlotChange = (timetableId: string) => {
    if (!timetableId || timetableId === NONE) return
    const slot = slots.find((s) => s.timetableId === timetableId)
    if (!slot) return
    form.setValue("teacherId", slot.teacherId, { shouldValidate: true })
    form.setValue("subjectId", slot.subjectId ?? "")
    form.setValue("sectionId", slot.sectionId)
    form.setValue("startTime", slot.startTime, { shouldValidate: true })
    form.setValue("endTime", slot.endTime, { shouldValidate: true })
    const nextDate = nextDateForWeekday(slot.dayOfWeek)
    form.setValue("startDate", nextDate)
    form.setValue("endDate", nextDate)
    // Name the session after the class unless the teacher already typed one.
    if (!form.getValues("title")) {
      form.setValue("title", `${slot.subjectName} · ${slot.sectionName}`.trim())
    }
    // Refresh the reference pickers for the slot's subject + grade.
    refLoadedFor.current = null
    if (slot.subjectId) void loadRefData(slot.subjectId, slot.gradeNumber)
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
            // Anchored sessions show (and lock) their class; the server also
            // refuses to move who/what on one, so the lock isn't the only gate.
            timetableId: d.timetableId ?? NONE,
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
          if (d.subjectId) {
            void loadRefData(d.subjectId, gradeNumberForSection(d.sectionId))
          }
        }
      })()
      return () => {
        active = false
      }
    }
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

  const onSubmit = async (data: WizardFormValues) => {
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
            visibility: data.visibility,
            recordingEnabled: data.recordingEnabled,
            maxParticipants: data.maxParticipants,
            catalogLessonId,
            resources: data.resources,
            description: data.description || null,
            // `status` and `timetableId` are deliberately not sent: the wizard
            // has no status field (transitions belong to the guarded paths),
            // and a session's timetable anchor is immutable — re-anchoring
            // would re-key its attendance.
          })
        : await createLiveClass({
            ...data,
            timetableId:
              data.timetableId && data.timetableId !== NONE
                ? data.timetableId
                : null,
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
      // Entering References: fetch pickers for the chosen subject once,
      // narrowed to the section's grade.
      if (next === 4) {
        const subjectId = form.getValues("subjectId")
        if (subjectId) {
          void loadRefData(
            subjectId,
            gradeNumberForSection(form.getValues("sectionId"))
          )
        }
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
        return (
          <StepBasics
            f={f}
            options={options}
            isPending={isPending}
            isEdit={isEdit}
            slots={slots}
            slotsLoading={slotsLoading}
            dayNames={dayNames}
            onSlotChange={handleSlotChange}
          />
        )
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

/**
 * The next calendar date falling on `dayOfWeek` (0 = Sun … 6 = Sat), today
 * included. A timetable slot is a weekly pattern; the session needs one
 * concrete date. Browser-local, like every other date the picker produces —
 * the server re-reads the day in the school's timezone on submit.
 */
function nextDateForWeekday(dayOfWeek: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + ((dayOfWeek - d.getDay() + 7) % 7))
  return d
}

export default LiveClassForm
