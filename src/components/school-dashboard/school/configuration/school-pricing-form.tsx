"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Pencil } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"

import { updateSchoolPricing } from "./actions"

const pricingSchema = z.object({
  tuitionFee: z.number().min(0).optional().nullable(),
  registrationFee: z.number().min(0).optional().nullable(),
  applicationFee: z.number().min(0).optional().nullable(),
  currency: z.string(),
  paymentSchedule: z.enum(["monthly", "quarterly", "semester", "annual"]),
})

type PricingFormData = z.infer<typeof pricingSchema>

const CURRENCIES = [
  { value: "USD", label: "USD ($)" },
  { value: "SAR", label: "SAR (ر.س)" },
  { value: "SDG", label: "SDG (ج.س)" },
  { value: "EGP", label: "EGP (ج.م)" },
  { value: "AED", label: "AED (د.إ)" },
  { value: "KWD", label: "KWD (د.ك)" },
  { value: "QAR", label: "QAR (ر.ق)" },
  { value: "BHD", label: "BHD (د.ب)" },
  { value: "OMR", label: "OMR (ر.ع)" },
  { value: "JOD", label: "JOD (د.أ)" },
  { value: "GBP", label: "GBP (£)" },
  { value: "EUR", label: "EUR (€)" },
]

const SCHEDULES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semester", label: "Per Semester" },
  { value: "annual", label: "Annual" },
]

interface Props {
  schoolId: string
  initialData: PricingFormData
  lang: Locale
}

function formatFee(value: number | null | undefined, currency: string): string {
  if (value == null) return "Not set"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

export function SchoolPricingForm({ schoolId, initialData, lang }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")

  const form = useForm<PricingFormData>({
    resolver: zodResolver(pricingSchema),
    defaultValues: initialData,
  })

  const handleSave = () => {
    const data = form.getValues()

    startTransition(async () => {
      try {
        setError("")
        const result = await updateSchoolPricing(schoolId, data)

        if (result.success) {
          setIsEditing(false)
        } else {
          setError(result.error || "Failed to update pricing")
        }
      } catch {
        setError("An unexpected error occurred")
      }
    })
  }

  const handleCancel = () => {
    form.reset(initialData)
    setIsEditing(false)
    setError("")
  }

  const currency = initialData.currency || "USD"

  if (!isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-4">
            {/* Currency & Schedule */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground text-xs">
                  Currency
                </Label>
                <p className="font-medium">
                  {CURRENCIES.find((c) => c.value === currency)?.label ||
                    currency}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">
                  Payment Schedule
                </Label>
                <Badge variant="secondary" className="capitalize">
                  {SCHEDULES.find(
                    (s) => s.value === initialData.paymentSchedule
                  )?.label || initialData.paymentSchedule}
                </Badge>
              </div>
            </div>

            {/* Fee Amounts */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <Label className="text-muted-foreground text-xs">
                  Tuition Fee
                </Label>
                <p className="font-semibold">
                  {formatFee(initialData.tuitionFee, currency)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <Label className="text-muted-foreground text-xs">
                  Registration Fee
                </Label>
                <p className="font-semibold">
                  {formatFee(initialData.registrationFee, currency)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <Label className="text-muted-foreground text-xs">
                  Application Fee
                </Label>
                <p className="font-semibold">
                  {formatFee(initialData.applicationFee, currency)}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="gap-1"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Currency & Schedule */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch("currency")}
            onValueChange={(value) => form.setValue("currency", value)}
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentSchedule">Payment Schedule</Label>
          <Select
            value={form.watch("paymentSchedule")}
            onValueChange={(value) =>
              form.setValue(
                "paymentSchedule",
                value as "monthly" | "quarterly" | "semester" | "annual"
              )
            }
            disabled={isPending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select schedule" />
            </SelectTrigger>
            <SelectContent>
              {SCHEDULES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Fee Amounts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="tuitionFee">Tuition Fee</Label>
          <Input
            id="tuitionFee"
            type="number"
            step="0.01"
            min="0"
            {...form.register("tuitionFee", { valueAsNumber: true })}
            placeholder="0.00"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="registrationFee">Registration Fee</Label>
          <Input
            id="registrationFee"
            type="number"
            step="0.01"
            min="0"
            {...form.register("registrationFee", { valueAsNumber: true })}
            placeholder="0.00"
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="applicationFee">Application Fee</Label>
          <Input
            id="applicationFee"
            type="number"
            step="0.01"
            min="0"
            {...form.register("applicationFee", { valueAsNumber: true })}
            placeholder="0.00"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={isPending} size="sm">
          {isPending ? (
            <>
              <Icons.loader2 className="me-1 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Icons.check className="me-1 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={isPending}
          size="sm"
        >
          <Icons.x className="me-1 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
