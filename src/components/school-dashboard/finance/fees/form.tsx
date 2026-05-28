"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { createFeeStructure, updateFeeStructure } from "./actions"

interface Props {
  lang: Locale
  initialData?: Record<string, unknown>
  currency?: string
}

export default function FeeStructureForm({
  lang,
  initialData,
  currency = "USD",
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const ff = (dictionary as any)?.finance?.feesForm as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined

  const [fees, setFees] = useState({
    tuitionFee: initialData?.tuitionFee ? Number(initialData.tuitionFee) : 0,
    admissionFee: initialData?.admissionFee
      ? Number(initialData.admissionFee)
      : 0,
    registrationFee: initialData?.registrationFee
      ? Number(initialData.registrationFee)
      : 0,
    examFee: initialData?.examFee ? Number(initialData.examFee) : 0,
    libraryFee: initialData?.libraryFee ? Number(initialData.libraryFee) : 0,
    laboratoryFee: initialData?.laboratoryFee
      ? Number(initialData.laboratoryFee)
      : 0,
    sportsFee: initialData?.sportsFee ? Number(initialData.sportsFee) : 0,
    transportFee: initialData?.transportFee
      ? Number(initialData.transportFee)
      : 0,
    hostelFee: initialData?.hostelFee ? Number(initialData.hostelFee) : 0,
  })

  // Sibling discount tiers
  const initPolicy = initialData?.discountPolicy as {
    siblingDiscount?: {
      type: string
      tiers: Array<{ siblingNumber: number; value: number }>
    }
  } | null
  const [siblingEnabled, setSiblingEnabled] = useState(
    !!initPolicy?.siblingDiscount
  )
  const [siblingType, setSiblingType] = useState<"PERCENTAGE" | "FIXED">(
    (initPolicy?.siblingDiscount?.type as "PERCENTAGE" | "FIXED") ||
      "PERCENTAGE"
  )
  const [siblingTiers, setSiblingTiers] = useState<
    Array<{ siblingNumber: number; value: number }>
  >(
    initPolicy?.siblingDiscount?.tiers || [
      { siblingNumber: 2, value: 10 },
      { siblingNumber: 3, value: 15 },
    ]
  )

  const totalAmount = useMemo(() => {
    return Object.values(fees).reduce((sum, val) => sum + (val || 0), 0)
  }, [fees])

  const handleFeeChange = useCallback((key: string, value: string) => {
    setFees((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }))
  }, [])

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      formData.set("totalAmount", String(totalAmount))

      // Serialize discount policy
      if (siblingEnabled && siblingTiers.length > 0) {
        formData.set(
          "discountPolicy",
          JSON.stringify({
            siblingDiscount: { type: siblingType, tiers: siblingTiers },
          })
        )
      }

      startTransition(async () => {
        const id = initialData?.id as string | undefined
        const result = id
          ? await updateFeeStructure(id, formData)
          : await createFeeStructure(formData)
        if (result.success) {
          SuccessToast(
            id
              ? ff?.feeStructureUpdated || "Fee structure updated"
              : ff?.feeStructureCreated || "Fee structure created"
          )
          router.push(`/${lang}/finance/fees/structures`)
        } else {
          ErrorToast(
            result.error ||
              ff?.failedCreateFeeStructure ||
              "Failed to save fee structure"
          )
        }
      })
    },
    [totalAmount, siblingEnabled, siblingType, siblingTiers, lang, router]
  )

  const currentYear = new Date().getFullYear()
  const academicYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ]

  const feeFields = useMemo(
    () => [
      {
        key: "tuitionFee",
        label: ff?.tuitionFee || "Tuition Fee",
        required: true,
      },
      { key: "admissionFee", label: ff?.admissionFee || "Admission Fee" },
      {
        key: "registrationFee",
        label: ff?.registrationFee || "Registration Fee",
      },
      { key: "examFee", label: ff?.examFee || "Exam Fee" },
      { key: "libraryFee", label: ff?.libraryFee || "Library Fee" },
      { key: "laboratoryFee", label: ff?.laboratoryFee || "Laboratory Fee" },
      { key: "sportsFee", label: ff?.sportsFee || "Sports Fee" },
      { key: "transportFee", label: ff?.transportFee || "Transport Fee" },
      { key: "hostelFee", label: ff?.hostelFee || "Hostel Fee" },
    ],
    [ff]
  )

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{ff?.basicInformation || "Basic Information"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{ff?.nameRequired || "Name *"}</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initialData?.name as string | undefined}
              placeholder={ff?.namePlaceholder || "e.g. Grade 10 Annual Fees"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academicYear">
              {ff?.academicYearRequired || "Academic Year *"}
            </Label>
            <Select
              name="academicYear"
              defaultValue={
                (initialData?.academicYear as string) || academicYears[1]
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={ff?.selectYear || "Select year"} />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="installments">
              {ff?.installments || "Installments"}
            </Label>
            <Input
              id="installments"
              name="installments"
              type="number"
              min={1}
              max={12}
              defaultValue={
                (initialData?.installments as number | undefined) || 4
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">
              {ff?.description || "Description"}
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description as string | undefined}
              placeholder={
                ff?.descriptionPlaceholder || "Optional description..."
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Fee Components */}
      <Card>
        <CardHeader>
          <CardTitle>{ff?.feeComponents || "Fee Components"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {feeFields.map(({ key, label, required }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key}>
                {label} {required && "*"}
              </Label>
              <Input
                id={key}
                name={key}
                type="number"
                step="0.01"
                min={0}
                required={required}
                value={fees[key as keyof typeof fees] || ""}
                onChange={(e) => handleFeeChange(key, e.target.value)}
                placeholder="0.00"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Sibling Discount */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{ff?.siblingDiscount || "Sibling Discount"}</CardTitle>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={siblingEnabled}
                onChange={(e) => setSiblingEnabled(e.target.checked)}
                className="h-4 w-4 rounded border"
              />
              <span className="text-sm">
                {ff?.enableSiblingDiscount || "Enable"}
              </span>
            </label>
          </div>
        </CardHeader>
        {siblingEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{ff?.discountType || "Discount Type"}</Label>
              <Select
                value={siblingType}
                onValueChange={(v) =>
                  setSiblingType(v as "PERCENTAGE" | "FIXED")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">
                    {ff?.percentage || "Percentage (%)"}
                  </SelectItem>
                  <SelectItem value="FIXED">
                    {ff?.fixedAmount || "Fixed Amount"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>{ff?.discountTiers || "Discount Tiers"}</Label>
              {siblingTiers.map((tier, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm whitespace-nowrap">
                      {ff?.childNumber || "Child"} #{tier.siblingNumber}
                    </span>
                  </div>
                  <Input
                    type="number"
                    min={0}
                    max={siblingType === "PERCENTAGE" ? 100 : undefined}
                    step={siblingType === "PERCENTAGE" ? 1 : 0.01}
                    value={tier.value}
                    onChange={(e) => {
                      const updated = [...siblingTiers]
                      updated[i] = {
                        ...tier,
                        value: parseFloat(e.target.value) || 0,
                      }
                      setSiblingTiers(updated)
                    }}
                    className="w-28"
                    placeholder="0"
                  />
                  <span className="text-muted-foreground text-sm">
                    {siblingType === "PERCENTAGE" ? "%" : ""}
                  </span>
                  {siblingTiers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setSiblingTiers(siblingTiers.filter((_, j) => j !== i))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextNum =
                    Math.max(...siblingTiers.map((t) => t.siblingNumber), 1) + 1
                  setSiblingTiers([
                    ...siblingTiers,
                    { siblingNumber: nextNum, value: 0 },
                  ])
                }}
              >
                <Plus className="me-1 h-4 w-4" />
                {ff?.addTier || "Add Tier"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Total + Submit */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-muted-foreground text-sm">
              {ff?.totalAmount || "Total Amount"}
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(totalAmount, lang, currency)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              {fc?.cancel || "Cancel"}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? fc?.saving || "Saving..."
                : initialData
                  ? fc?.update || "Update"
                  : fc?.create || "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
