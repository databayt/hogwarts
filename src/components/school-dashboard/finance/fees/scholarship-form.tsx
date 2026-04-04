// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

"use client"

import { useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { createScholarship, updateScholarship } from "./actions"

const getCoverageTypes = (sf?: Record<string, string>) =>
  [
    { value: "PERCENTAGE", label: sf?.percentage || "Percentage" },
    { value: "FIXED_AMOUNT", label: sf?.fixedAmount || "Fixed Amount" },
    { value: "FULL", label: sf?.full || "Full Coverage" },
  ] as const

interface ScholarshipFormProps {
  lang: Locale
  initialData?: {
    id: string
    name: string
    description: string | null
    coverageType: string
    coverageAmount: number
    academicYear: string
    startDate: string
    endDate: string
    maxBeneficiaries: number | null
    minPercentage: number | null
    maxFamilyIncome: number | null
    isActive: boolean
  }
}

export function ScholarshipForm({ lang, initialData }: ScholarshipFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const sf = (dictionary as any)?.finance?.scholarshipForm as
    | Record<string, string>
    | undefined
  const fc = (dictionary as any)?.finance?.common as
    | Record<string, string>
    | undefined

  const currentYear = new Date().getFullYear()
  const academicYears = useMemo(
    () => [
      `${currentYear - 1}-${currentYear}`,
      `${currentYear}-${currentYear + 1}`,
      `${currentYear + 1}-${currentYear + 2}`,
    ],
    [currentYear]
  )

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = initialData
        ? await updateScholarship(initialData.id, formData)
        : await createScholarship(formData)

      if (result.success) {
        toast.success(
          initialData
            ? sf?.scholarshipUpdated || "Scholarship updated"
            : sf?.scholarshipCreated || "Scholarship created"
        )
        router.push(`/${lang}/finance/fees/scholarships`)
      } else {
        toast.error(
          result.error || sf?.failedSave || "Failed to save scholarship"
        )
      }
    })
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>{sf?.basicInformation || "Basic Information"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{sf?.name || "Scholarship Name"} *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initialData?.name}
              placeholder={sf?.namePlaceholder || "e.g. Merit Scholarship"}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academicYear">
              {sf?.academicYear || "Academic Year"} *
            </Label>
            <Select
              name="academicYear"
              defaultValue={initialData?.academicYear || academicYears[1]}
            >
              <SelectTrigger>
                <SelectValue placeholder={sf?.selectYear || "Select year"} />
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
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">
              {sf?.description || "Description"}
            </Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description || ""}
              placeholder={
                sf?.descriptionPlaceholder ||
                "Describe the scholarship criteria and benefits..."
              }
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Coverage */}
      <Card>
        <CardHeader>
          <CardTitle>{sf?.coverageDetails || "Coverage Details"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="coverageType">
              {sf?.coverageType || "Coverage Type"} *
            </Label>
            <Select
              name="coverageType"
              defaultValue={initialData?.coverageType || "PERCENTAGE"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCoverageTypes(sf).map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverageAmount">
              {sf?.coverageAmount || "Coverage Amount"} *
            </Label>
            <Input
              id="coverageAmount"
              name="coverageAmount"
              type="number"
              step="0.01"
              min={0}
              required
              defaultValue={initialData?.coverageAmount}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxBeneficiaries">
              {sf?.maxBeneficiaries || "Max Beneficiaries"}
            </Label>
            <Input
              id="maxBeneficiaries"
              name="maxBeneficiaries"
              type="number"
              min={1}
              defaultValue={initialData?.maxBeneficiaries ?? ""}
              placeholder={sf?.unlimited || "Unlimited"}
            />
          </div>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card>
        <CardHeader>
          <CardTitle>
            {sf?.eligibilityCriteria || "Eligibility Criteria"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="minPercentage">
              {sf?.minPercentage || "Minimum Academic Percentage"}
            </Label>
            <Input
              id="minPercentage"
              name="minPercentage"
              type="number"
              step="0.01"
              min={0}
              max={100}
              defaultValue={initialData?.minPercentage ?? ""}
              placeholder="e.g. 85"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxFamilyIncome">
              {sf?.maxFamilyIncome || "Max Family Income"}
            </Label>
            <Input
              id="maxFamilyIncome"
              name="maxFamilyIncome"
              type="number"
              step="0.01"
              min={0}
              defaultValue={initialData?.maxFamilyIncome ?? ""}
              placeholder="0.00"
            />
          </div>
        </CardContent>
      </Card>

      {/* Validity Period */}
      <Card>
        <CardHeader>
          <CardTitle>{sf?.validityPeriod || "Validity Period"}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="startDate">{sf?.startDate || "Start Date"} *</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={
                initialData?.startDate
                  ? new Date(initialData.startDate).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">{sf?.endDate || "End Date"} *</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              required
              defaultValue={
                initialData?.endDate
                  ? new Date(initialData.endDate).toISOString().split("T")[0]
                  : ""
              }
            />
          </div>
          {initialData && (
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                name="isActive"
                defaultChecked={initialData.isActive}
                value="true"
              />
              <Label htmlFor="isActive">{sf?.active || "Active"}</Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
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
    </form>
  )
}
