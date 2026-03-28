"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
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
import { NumberStepper } from "@/components/atom/number-stepper"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { InputField, SelectField, TextareaField } from "@/components/form"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { createCampaign, getCampaign, updateCampaign } from "./actions"
import {
  CAMPAIGN_STATUS_VALUES,
  campaignSchemaWithValidation,
  type CampaignFormData,
} from "./validation"

const FIELD_NAMES = [
  "name",
  "academicYear",
  "startDate",
  "endDate",
  "status",
  "totalSeats",
  "description",
] as const

function getAcademicYearOptions() {
  const currentYear = new Date().getFullYear()
  const options: { label: string; value: string }[] = []
  for (let y = currentYear - 1; y <= currentYear + 2; y++) {
    const label = `${y}-${y + 1}`
    options.push({ label, value: label })
  }
  return options
}

const academicYearOptions = getAcademicYearOptions()

interface CampaignFormProps {
  onSuccess?: () => void
  lang?: Locale
  dictionary?: Dictionary["school"]["admission"]
}

export function CampaignForm({
  onSuccess,
  lang = "en",
  dictionary,
}: CampaignFormProps) {
  const { modal, closeModal } = useModal()
  const [isPending, startTransition] = useTransition()
  const itemId = modal.id
  const isEdit = !!itemId

  const t = dictionary?.campaigns
  const col = dictionary?.columns

  const labels = {
    title: isEdit
      ? t?.editCampaign || "Edit Campaign"
      : t?.createCampaign || "Create Campaign",
    subtitle: t?.enterDetails || "Enter the details for the admission campaign",
    name: t?.campaignName || "Campaign Name",
    namePlaceholder: t?.namePlaceholder || "e.g., Admissions 2024-2025",
    academicYear: t?.academicYear || "Academic Year",
    dateRange: t?.campaignPeriod || "Campaign Period",
    status: col?.status || "Status",
    description: t?.description || "Description",
    descriptionPlaceholder:
      t?.descriptionPlaceholder || "Optional campaign description...",
    totalSeats: t?.totalSeats || "Total Seats",
    cancel: "Cancel",
    create: "Create",
    update: "Update",
    pickDateRange: t?.pickDateRange || "Pick a date range",
    createSuccess: t?.campaignCreated || "Campaign created successfully",
    updateSuccess: t?.campaignUpdated || "Campaign updated successfully",
  }

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchemaWithValidation) as any,
    defaultValues: {
      name: "",
      academicYear: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
      status: "DRAFT",
      description: "",
      totalSeats: 100,
    },
  })

  // Load existing data for edit mode
  useEffect(() => {
    if (isEdit) {
      startTransition(async () => {
        const result = await getCampaign({ id: itemId })
        if (result.success && result.data) {
          const d = result.data
          form.reset({
            name: d.name,
            academicYear: d.academicYear,
            startDate: new Date(d.startDate),
            endDate: new Date(d.endDate),
            status: d.status as CampaignFormData["status"],
            description: d.description ?? "",
            totalSeats: d.totalSeats,
            applicationFee: d.applicationFee
              ? parseFloat(d.applicationFee)
              : undefined,
          })
        }
      })
    }
  }, [isEdit, itemId, form])

  const onSubmit = async (data: CampaignFormData) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateCampaign({ ...data, id: itemId })
        : await createCampaign(data)

      if (result.success) {
        SuccessToast(isEdit ? labels.updateSuccess : labels.createSuccess)
        closeModal()
        onSuccess?.()
      } else {
        ErrorToast(result.error ?? "An error occurred")
      }
    })
  }

  const watched = form.watch()
  const filledCount = FIELD_NAMES.filter((f) => {
    const v = watched[f]
    return v !== "" && v !== null && v !== undefined
  }).length
  const progress = (filledCount / FIELD_NAMES.length) * 100

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <ModalFormLayout title={labels.title} description={labels.subtitle}>
          <div className="space-y-4">
            <InputField
              name="name"
              label={labels.name}
              placeholder={labels.namePlaceholder}
              disabled={isPending}
            />

            <div className="grid grid-cols-3 gap-4">
              <SelectField
                name="academicYear"
                label={labels.academicYear}
                options={academicYearOptions}
                disabled={isPending}
              />
              <SelectField
                name="status"
                label={labels.status}
                options={CAMPAIGN_STATUS_VALUES.map((v) => ({
                  value: v,
                  label: dictionary?.status?.[v] || v,
                }))}
                disabled={isPending}
              />
              <div className="space-y-2">
                <Label>{labels.totalSeats}</Label>
                <NumberStepper
                  value={watched.totalSeats ?? 100}
                  onChange={(v) =>
                    form.setValue("totalSeats", v, { shouldValidate: true })
                  }
                  min={1}
                  max={9999}
                  className="[&_button]:size-9 [&_input]:h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{labels.dateRange}</Label>
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
                          {format(watched.startDate, "LLL dd, y")} -{" "}
                          {format(watched.endDate, "LLL dd, y")}
                        </>
                      ) : (
                        format(watched.startDate, "LLL dd, y")
                      )
                    ) : (
                      <span>{labels.pickDateRange}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    defaultMonth={watched.startDate}
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

            <TextareaField
              name="description"
              label={labels.description}
              placeholder={labels.descriptionPlaceholder}
              rows={3}
              disabled={isPending}
            />
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
          cancel: labels.cancel,
          create: labels.create,
          save: labels.update,
          saving: isEdit ? labels.update : labels.create,
        }}
      />
    </Form>
  )
}

export default CampaignForm
