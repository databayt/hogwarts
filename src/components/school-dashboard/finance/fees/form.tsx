"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

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

import { createFeeStructure } from "./actions"

interface Props {
  lang: Locale
  initialData?: Record<string, unknown>
}

export default function FeeStructureForm({ lang, initialData }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

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

  const totalAmount = useMemo(() => {
    return Object.values(fees).reduce((sum, val) => sum + (val || 0), 0)
  }, [fees])

  const handleFeeChange = useCallback((key: string, value: string) => {
    setFees((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }))
  }, [])

  const handleSubmit = useCallback(
    async (formData: FormData) => {
      formData.set("totalAmount", String(totalAmount))

      startTransition(async () => {
        const result = await createFeeStructure(formData)
        if (result.success) {
          SuccessToast("Fee structure created")
          router.push(`/${lang}/finance/fees/structures`)
        } else {
          ErrorToast(result.error || "Failed to create fee structure")
        }
      })
    },
    [totalAmount, lang, router]
  )

  const currentYear = new Date().getFullYear()
  const academicYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`,
  ]

  const feeFields = useMemo(
    () => [
      { key: "tuitionFee", label: "Tuition Fee", required: true },
      { key: "admissionFee", label: "Admission Fee" },
      { key: "registrationFee", label: "Registration Fee" },
      { key: "examFee", label: "Exam Fee" },
      { key: "libraryFee", label: "Library Fee" },
      { key: "laboratoryFee", label: "Laboratory Fee" },
      { key: "sportsFee", label: "Sports Fee" },
      { key: "transportFee", label: "Transport Fee" },
      { key: "hostelFee", label: "Hostel Fee" },
    ],
    []
  )

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initialData?.name as string | undefined}
              placeholder="e.g. Grade 10 Annual Fees"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="academicYear">Academic Year *</Label>
            <Select
              name="academicYear"
              defaultValue={
                (initialData?.academicYear as string) || academicYears[1]
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
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
            <Label htmlFor="installments">Installments</Label>
            <Input
              id="installments"
              name="installments"
              type="number"
              min={1}
              max={12}
              defaultValue={
                (initialData?.installments as number | undefined) || 1
              }
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialData?.description as string | undefined}
              placeholder="Optional description..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Fee Components */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Components</CardTitle>
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

      {/* Total + Submit */}
      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-muted-foreground text-sm">Total Amount</p>
            <p className="text-2xl font-bold">
              $
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : initialData ? "Update" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
