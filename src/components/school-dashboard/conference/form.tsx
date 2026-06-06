"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ar, enUS } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { type DateRange } from "react-day-picker"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form } from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useModal } from "@/components/atom/modal/context"
import { ModalFooter } from "@/components/atom/modal/modal-footer"
import { ModalFormLayout } from "@/components/atom/modal/modal-form-layout"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import {
  CheckboxField,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/form"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createLiveClass, getLiveClass, updateLiveClass } from "./list-actions"
import { type LiveClassFormOptions } from "./queries"
import { createLiveClassSchema, type LiveClassFormData } from "./list-validation"

const FIELD_NAMES = [
  "title",
  "teacherId",
  "meetingUrl",
  "startDate",
  "endDate",
  "startTime",
  "endTime",
] as const

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
}

export function LiveClassForm({
  onSuccess,
  lang = "en",
  dictionary,
  options,
}: LiveClassFormProps) {
  const { modal, closeModal } = useModal()
  // `isPending` reflects ONLY an in-flight submit — it drives the "Saving…"
  // footer label and disables every field while saving.
  const [isPending, startTransition] = useTransition()
  const itemId = modal.id
  const isEdit = !!itemId

  const t = dictionary
  const f = t.form

  const { teachers, subjects, sections } = options

  const schema = useMemo(
    () => createLiveClassSchema(t.validation),
    [t.validation]
  )

  const form = useForm<LiveClassFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      title: "",
      teacherId: "",
      subjectId: "",
      sectionId: "",
      meetingUrl: "",
      meetingProvider: "",
      startDate: new Date(),
      endDate: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      status: "scheduled",
      description: "",
      saveAsDefault: false,
    },
  })

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
          form.reset({
            title: d.title,
            teacherId: d.teacherId,
            subjectId: d.subjectId ?? "",
            sectionId: d.sectionId ?? "",
            meetingUrl: d.meetingUrl ?? "",
            meetingProvider: d.meetingProvider ?? "",
            startDate: start,
            endDate: end,
            startTime: toTimeString(start),
            endTime: toTimeString(end),
            status: d.status as LiveClassFormData["status"],
            description: d.description ?? "",
          })
        }
      })()
      return () => {
        active = false
      }
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: LiveClassFormData) => {
    startTransition(async () => {
      const payload = {
        ...data,
        subjectId: data.subjectId || null,
        sectionId: data.sectionId || null,
        meetingProvider: data.meetingProvider || null,
        description: data.description || null,
      }
      const result = isEdit
        ? await updateLiveClass({ ...payload, id: itemId! })
        : await createLiveClass(payload)

      if (result.success) {
        SuccessToast(isEdit ? t.toasts.updated : t.toasts.created)
        closeModal()
        onSuccess?.()
      } else {
        ErrorToast(t.toasts.failed)
      }
    })
  }

  const watched = form.watch()
  const filledCount = FIELD_NAMES.filter((name) => {
    const value = watched[name]
    return value !== "" && value !== null && value !== undefined
  }).length
  const progress = (filledCount / FIELD_NAMES.length) * 100

  const noTeachers = teachers.length === 0

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ModalFormLayout
          title={isEdit ? t.edit : t.create}
          description={isEdit ? t.editDescription : t.createDescription}
        >
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
              options={teachers.map((teacher) => ({
                value: teacher.id,
                label: teacher.name,
              }))}
            />

            <div className="grid grid-cols-2 gap-4">
              <SelectField
                name="subjectId"
                label={f.subjectLabel}
                placeholder={f.subjectPlaceholder}
                disabled={isPending}
                options={subjects.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                }))}
              />
              <SelectField
                name="sectionId"
                label={f.sectionLabel}
                placeholder={f.sectionPlaceholder}
                disabled={isPending}
                options={sections.map((section) => ({
                  value: section.id,
                  label: section.name,
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label>{f.dateRangeLabel}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[calc(var(--cell-size,1.75rem)*14+1rem+1.5rem)] justify-start text-left font-normal",
                      !watched.startDate && "text-muted-foreground"
                    )}
                    disabled={isPending}
                  >
                    <CalendarIcon />
                    {watched.startDate ? (
                      watched.endDate ? (
                        <>
                          {watched.startDate.toLocaleDateString(
                            lang === "ar" ? "ar-SA" : "en-US",
                            { day: "numeric", month: "short", year: "2-digit" }
                          )}{" "}
                          -{" "}
                          {watched.endDate.toLocaleDateString(
                            lang === "ar" ? "ar-SA" : "en-US",
                            { day: "numeric", month: "short", year: "2-digit" }
                          )}
                        </>
                      ) : (
                        watched.startDate.toLocaleDateString(
                          lang === "ar" ? "ar-SA" : "en-US",
                          { day: "numeric", month: "short", year: "2-digit" }
                        )
                      )
                    ) : (
                      <span>{f.pickDateRange}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={watched.startDate}
                    locale={lang === "ar" ? ar : enUS}
                    selected={{
                      from: watched.startDate,
                      to: watched.endDate,
                    }}
                    onSelect={(range: DateRange | undefined) => {
                      if (range?.from)
                        form.setValue("startDate", range.from, {
                          shouldValidate: true,
                        })
                      if (range?.to)
                        form.setValue("endDate", range.to, {
                          shouldValidate: true,
                        })
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

            <TextareaField
              name="description"
              label={f.descriptionLabel}
              placeholder={f.descriptionPlaceholder}
              rows={3}
              disabled={isPending}
            />

            {/* "Set once & reuse": only meaningful when both subject and section
                are chosen, since the recurring link is keyed by section+subject
                for the active term. */}
            {watched.subjectId && watched.sectionId && (
              <CheckboxField
                name="saveAsDefault"
                checkboxLabel={f.saveAsDefaultLabel}
                description={f.saveAsDefaultHint}
                disabled={isPending}
              />
            )}
          </div>
        </ModalFormLayout>
      </form>

      <ModalFooter
        currentStep={1}
        totalSteps={1}
        isEdit={isEdit}
        isSubmitting={isPending}
        progress={progress}
        onBack={closeModal}
        onNext={() => form.handleSubmit(onSubmit)()}
        labels={{
          cancel: t.cancel,
          create: t.create,
          save: t.save,
          saving: t.saving,
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
