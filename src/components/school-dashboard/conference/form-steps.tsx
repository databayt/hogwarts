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
import type { LiveClassFormOptions, LiveClassReferenceData } from "./queries"

// Schema fields + UI-only picker fields (composed into `resources` on submit;
// the zod resolver strips them from the validated payload).
export type WizardFormValues = LiveClassFormData & {
  examRefId: string
  assignmentRefId: string
  linkUrl: string
  linkTitle: string
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
}: {
  f: FormDict
  options: LiveClassFormOptions
  isPending: boolean
}) {
  const { teachers, subjects, sections } = options
  const noTeachers = teachers.length === 0

  return (
    <div className="space-y-4">
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
        disabled={isPending || noTeachers}
        options={teachers.map((t) => ({ value: t.id, label: t.name }))}
      />
      <div className="grid grid-cols-2 gap-4">
        <SelectField
          name="subjectId"
          label={f.subjectLabel}
          placeholder={f.subjectPlaceholder}
          disabled={isPending}
          options={subjects.map((s) => ({ value: s.id, label: s.name }))}
        />
        <SelectField
          name="sectionId"
          label={f.sectionLabel}
          placeholder={f.sectionPlaceholder}
          disabled={isPending}
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
}: {
  f: FormDict
  isPending: boolean
  isEdit: boolean
  liveKitAvailable: boolean
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
          <CheckboxField
            name="recordingEnabled"
            checkboxLabel={f.recordingLabel}
            disabled={isPending}
          />
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
