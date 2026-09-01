"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// The five compact steps of the live-class wizard (form.tsx). Each step shows
// a handful of fields — the whole form never renders at once (mirrors the
// school-onboarding / application-wizard "less per step" pattern). All steps
// read the shared react-hook-form context; parent owns navigation + submit.
import { ar, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { useFormContext } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  CheckboxField,
  InputField,
  NumberField,
  RadioGroupField,
  SelectField,
  TextareaField,
} from "@/components/form"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { LiveClassFormData } from "./list-validation"
import type {
  LiveSlotOption,
  LiveClassFormOptions,
  LiveClassReferenceData,
} from "./queries"

// Schema fields + UI-only picker fields (composed into `resources` on submit;
// the zod resolver strips them from the validated payload).
export type WizardFormValues = LiveClassFormData & {
  examRefId: string
  assignmentRefId: string
  linkUrl: string
  linkTitle: string
}

/** Sunday-first, indexed by Timetable.dayOfWeek (0 = Sun … 6 = Sat). */
const DAY_FALLBACK_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

/**
 * "Mathematics · Grade 1-A · Sun 08:00" — the physical class, as a teacher
 * would recognize it on the timetable.
 */
export function slotLabel(
  slot: LiveSlotOption,
  dayNames?: string[]
): string {
  const day = dayNames?.[slot.dayOfWeek] ?? DAY_FALLBACK_EN[slot.dayOfWeek]
  const head = [slot.subjectName, slot.sectionName].filter(Boolean).join(" · ")
  return `${head} · ${day} ${slot.startTime}`
}

// Sentinel for "no selection" in optional pickers — Radix Select forbids an
// empty item value. Mapped back to null on submit.
export const NONE = "none"

type FormDict = Dictionary["school"]["liveClasses"]["form"]

/** Fields validated when leaving each step (1-indexed). */
export const STEP_FIELDS: Record<number, (keyof LiveClassFormData)[]> = {
  1: ["title", "teacherId"],
  2: ["startDate", "endDate", "startTime", "endTime"],
  3: ["meetingUrl", "maxParticipants"],
  4: [],
  5: ["description"],
}

export const TOTAL_STEPS = 5

// ---------------------------------------------------------------------------
// Step 1 — Basics: what & who
// ---------------------------------------------------------------------------

export function StepBasics({
  f,
  options,
  isPending,
  isEdit,
  slots,
  slotsLoading,
  slotsFailed,
  dayNames,
  onSlotChange,
}: {
  f: FormDict
  options: LiveClassFormOptions
  isPending: boolean
  isEdit: boolean
  /** The school's real class slots for the active term (lazy-loaded). */
  slots: LiveSlotOption[]
  slotsLoading: boolean
  /** The load failed — distinct from "this school has no slots". */
  slotsFailed: boolean
  dayNames?: string[]
  onSlotChange: (timetableId: string) => void
}) {
  const form = useFormContext<WizardFormValues>()
  const { teachers, subjects, sections } = options
  const noTeachers = teachers.length === 0
  const timetableId = form.watch("timetableId")
  const sectionId = form.watch("sectionId")

  // A slot-anchored session takes teacher/subject/section from the schedule —
  // the server derives them from the slot row regardless, so the selects are
  // shown filled-and-locked rather than pretending to be editable.
  const anchored = Boolean(timetableId && timetableId !== NONE)

  // Only offer subjects the chosen section's grade actually studies. Without a
  // section we can't narrow, so the school's whole catalog stays available.
  const gradeId = sections.find((s) => s.id === sectionId)?.gradeId
  const subjectOptions = (
    gradeId ? subjects.filter((s) => s.gradeIds.includes(gradeId)) : subjects
  ).map((s) => ({ value: s.id, label: s.name }))

  return (
    <div className="space-y-4">
      {/* Editing never re-anchors a session: the timetable link is what keys
          its attendance, so moving it would orphan already-written rows. */}
      <SelectField
        name="timetableId"
        label={f.slotLabel}
        placeholder={slotsLoading ? "…" : f.slotPlaceholder}
        description={f.slotHint}
        disabled={isPending || slotsLoading || isEdit}
        onValueChange={onSlotChange}
        options={[
          { value: NONE, label: f.slotNone },
          ...slots.map((s) => ({
            value: s.timetableId,
            label: slotLabel(s, dayNames),
          })),
        ]}
      />
      {/* An empty picker reads as "no timetable" — say when it's a failure
          instead, so the teacher retries rather than giving up. */}
      {slotsFailed && (
        <p className="text-destructive -mt-2 text-xs">{f.slotLoadError}</p>
      )}
      <InputField
        name="title"
        label={f.titleLabel}
        placeholder={f.titlePlaceholder}
        required
        disabled={isPending}
      />
      <SelectField
        name="teacherId"
        label={f.teacherLabel}
        placeholder={noTeachers ? f.noTeachers : f.teacherPlaceholder}
        required
        disabled={isPending || noTeachers || anchored}
        options={teachers.map((t) => ({ value: t.id, label: t.name }))}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          name="subjectId"
          label={f.subjectLabel}
          placeholder={f.subjectPlaceholder}
          disabled={isPending || anchored}
          options={subjectOptions}
        />
        <SelectField
          name="sectionId"
          label={f.sectionLabel}
          placeholder={f.sectionPlaceholder}
          disabled={isPending || anchored}
          options={sections.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — Schedule: when
// ---------------------------------------------------------------------------

export function StepSchedule({
  f,
  lang,
  isPending,
}: {
  f: FormDict
  lang: Locale
  isPending: boolean
}) {
  const form = useFormContext<WizardFormValues>()
  const startDate = form.watch("startDate")
  const endDate = form.watch("endDate")

  const fmt = (d: Date) =>
    d.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    })

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{f.dateRangeLabel}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-start font-normal",
                !startDate && "text-muted-foreground"
              )}
              disabled={isPending}
            >
              <CalendarIcon />
              {startDate ? (
                endDate ? (
                  <>
                    {fmt(startDate)} - {fmt(endDate)}
                  </>
                ) : (
                  fmt(startDate)
                )
              ) : (
                <span>{f.pickDateRange}</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              defaultMonth={startDate}
              locale={lang === "ar" ? ar : enUS}
              selected={{ from: startDate, to: endDate }}
              onSelect={(range: DateRange | undefined) => {
                if (range?.from)
                  form.setValue("startDate", range.from, {
                    shouldValidate: true,
                  })
                if (range?.to)
                  form.setValue("endDate", range.to, { shouldValidate: true })
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <InputField
          name="startTime"
          label={f.startTimeLabel}
          type="time"
          required
          disabled={isPending}
        />
        <InputField
          name="endTime"
          label={f.endTimeLabel}
          type="time"
          required
          disabled={isPending}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — Meeting: in-app room vs external link
// ---------------------------------------------------------------------------

export function StepMeeting({
  f,
  isPending,
  isEdit,
  liveKitAvailable,
  recordingAvailable,
}: {
  f: FormDict
  isPending: boolean
  isEdit: boolean
  liveKitAvailable: boolean
  recordingAvailable: boolean
}) {
  const form = useFormContext<WizardFormValues>()
  const provider = form.watch("provider")
  const subjectId = form.watch("subjectId")
  const sectionId = form.watch("sectionId")

  return (
    <div className="space-y-4">
      <RadioGroupField
        name="provider"
        label={f.providerLabel}
        // A session's back-end can't change after creation — the room name
        // and SFU lifecycle are already bound to it.
        disabled={isPending || isEdit}
        options={[
          {
            value: "livekit",
            label: f.providerLiveKit,
            description: liveKitAvailable
              ? f.providerLiveKitHint
              : f.providerUnavailableHint,
            disabled: !liveKitAvailable,
          },
          {
            value: "external",
            label: f.providerExternal,
            description: f.providerExternalHint,
          },
        ]}
      />

      {provider === "external" ? (
        <>
          <InputField
            name="meetingUrl"
            label={f.meetingUrlLabel}
            placeholder={f.meetingUrlPlaceholder}
            type="url"
            required
            disabled={isPending}
          />
          <SelectField
            name="meetingProvider"
            label={f.meetingProviderLabel}
            placeholder={f.meetingProviderPlaceholder}
            disabled={isPending}
            options={[
              { value: "Google Meet", label: f.providerGoogleMeet },
              { value: "Zoom", label: f.providerZoom },
              { value: "Microsoft Teams", label: f.providerTeams },
            ]}
          />
          {/* "Set once & reuse": only meaningful when both subject and section
              are chosen — the recurring link is keyed by section+subject. */}
          {subjectId && sectionId && (
            <CheckboxField
              name="saveAsDefault"
              checkboxLabel={f.saveAsDefaultLabel}
              description={f.saveAsDefaultHint}
              disabled={isPending}
            />
          )}
        </>
      ) : (
        <div className="grid grid-cols-2 items-end gap-4">
          <NumberField
            name="maxParticipants"
            label={f.maxParticipantsLabel}
            min={1}
            max={300}
            disabled={isPending}
          />
          <SelectField
            name="studentsJoinMuted"
            label={f.joinMutedLabel}
            disabled={isPending}
            options={[
              { value: "default", label: f.joinMutedDefault },
              { value: "muted", label: f.joinMutedMuted },
              { value: "open", label: f.joinMutedOpen },
            ]}
          />
          {recordingAvailable ? (
            <CheckboxField
              name="recordingEnabled"
              checkboxLabel={f.recordingLabel}
              disabled={isPending}
            />
          ) : (
            // No bucket → no egress. Say so instead of offering a checkbox
            // whose only effect is a "View recordings" page that stays empty.
            <p className="text-muted-foreground self-center text-xs">
              {f.recordingUnavailableHint}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — References: lesson, quiz/exam, assignment, ad-hoc link
// ---------------------------------------------------------------------------

export function StepReferences({
  f,
  isPending,
  hasSubject,
  refData,
  refLoading,
}: {
  f: FormDict
  isPending: boolean
  hasSubject: boolean
  refData: LiveClassReferenceData | null
  refLoading: boolean
}) {
  const withNone = (
    items: { value: string; label: string }[]
  ): { value: string; label: string }[] => [
    { value: NONE, label: f.noneOption },
    ...items,
  ]

  return (
    <div className="space-y-4">
      {hasSubject ? (
        <>
          <SelectField
            name="catalogLessonId"
            label={f.lessonLabel}
            placeholder={refLoading ? "…" : f.lessonPlaceholder}
            description={f.lessonHint}
            disabled={isPending || refLoading}
            options={withNone(
              (refData?.lessons ?? []).map((l) => ({
                value: l.id,
                label: l.name,
              }))
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              name="examRefId"
              label={f.examRefLabel}
              placeholder={refLoading ? "…" : f.examRefPlaceholder}
              disabled={isPending || refLoading}
              options={withNone(
                (refData?.exams ?? []).map((e) => ({
                  value: e.id,
                  label: e.title,
                }))
              )}
            />
            <SelectField
              name="assignmentRefId"
              label={f.assignmentRefLabel}
              placeholder={refLoading ? "…" : f.assignmentRefPlaceholder}
              disabled={isPending || refLoading}
              options={withNone(
                (refData?.assignments ?? []).map((a) => ({
                  value: a.id,
                  label: a.title,
                }))
              )}
            />
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">{f.pickSubjectFirst}</p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <InputField
          name="linkUrl"
          label={f.linkUrlLabel}
          placeholder={f.linkUrlPlaceholder}
          type="url"
          disabled={isPending}
        />
        <InputField
          name="linkTitle"
          label={f.linkTitleLabel}
          placeholder={f.linkTitlePlaceholder}
          disabled={isPending}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 5 — Access: who can join + closing notes
// ---------------------------------------------------------------------------

export function StepAccess({
  f,
  isPending,
}: {
  f: FormDict
  isPending: boolean
}) {
  return (
    <div className="space-y-4">
      <RadioGroupField
        name="visibility"
        label={f.visibilityLabel}
        disabled={isPending}
        options={[
          {
            value: "section",
            label: f.visibilitySection,
            description: f.visibilitySectionHint,
          },
          {
            value: "school",
            label: f.visibilitySchool,
            description: f.visibilitySchoolHint,
          },
        ]}
      />
      <TextareaField
        name="description"
        label={f.descriptionLabel}
        placeholder={f.descriptionPlaceholder}
        rows={3}
        disabled={isPending}
      />
    </div>
  )
}
