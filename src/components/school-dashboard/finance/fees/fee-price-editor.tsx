"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"

import { formatCurrency } from "@/lib/i18n-format"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import type { Locale } from "@/components/internationalization/config"

import {
  setFeeAssignmentOverride,
  updateFeeAssignmentDiscount,
} from "./actions"

interface Props {
  assignmentId: string
  lang: Locale
  currency: string
  /** The grade (structure) fee the student inherits. */
  gradeFee: number
  /** The student's own price, when the admin set one. */
  customAmount: number | null
  /** The ADMIN_OVERRIDE discount currently on the fee. */
  adminDiscount: number
  adminDiscountReason: string
  dictionary?: Record<string, string>
}

/**
 * The student end of the fee cascade: a student pays their grade's fee until
 * the admin gives them their own price here; a discount applies on top.
 */
export function FeePriceEditor({
  assignmentId,
  lang,
  currency,
  gradeFee,
  customAmount,
  adminDiscount,
  adminDiscountReason,
  dictionary: t,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [price, setPrice] = useState(String(customAmount ?? gradeFee))
  const [discount, setDiscount] = useState(String(adminDiscount || ""))
  const [reason, setReason] = useState(adminDiscountReason)
  const hasOwnPrice = customAmount != null

  const run = (fn: () => Promise<{ success: boolean }>, done: string) =>
    startTransition(async () => {
      const result = await fn()
      if (result.success) {
        SuccessToast(done)
        router.refresh()
      } else {
        ErrorToast(t?.failed || "Couldn't update the fee")
      }
    })

  const savePrice = () => {
    const value = parseFloat(price)
    if (!Number.isFinite(value) || value < 0) {
      ErrorToast(t?.invalidAmount || "Enter a valid amount")
      return
    }
    run(
      () => setFeeAssignmentOverride(assignmentId, value),
      t?.priceSaved || "Student price saved"
    )
  }

  const resetPrice = () =>
    run(
      () => setFeeAssignmentOverride(assignmentId, null),
      t?.priceReset || "Student is back on the grade fee"
    )

  const saveDiscount = () => {
    const value = parseFloat(discount || "0")
    if (!Number.isFinite(value) || value < 0) {
      ErrorToast(t?.invalidAmount || "Enter a valid amount")
      return
    }
    run(
      () => updateFeeAssignmentDiscount(assignmentId, value, reason),
      t?.discountSaved || "Discount saved"
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t?.title || "Student price"}</CardTitle>
        <CardDescription>
          <Badge variant={hasOwnPrice ? "default" : "secondary"}>
            {hasOwnPrice
              ? t?.ownPrice || "Own price"
              : t?.usesGradeFee || "Uses the grade fee"}
          </Badge>{" "}
          {t?.gradeFee || "Grade fee"}:{" "}
          {formatCurrency(gradeFee, lang, currency)}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fee-own-price">{t?.price || "Price"}</Label>
          <Input
            id="fee-own-price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <p className="text-muted-foreground text-sm">
            {t?.priceHint ||
              "A student with their own price keeps it when the school or grade fee changes."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={savePrice} disabled={isPending}>
              {t?.savePrice || "Save price"}
            </Button>
            {hasOwnPrice && (
              <Button
                type="button"
                variant="outline"
                onClick={resetPrice}
                disabled={isPending}
              >
                <RotateCcw className="me-2 h-4 w-4" />
                {t?.resetToGradeFee || "Reset to grade fee"}
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee-discount">{t?.discount || "Discount"}</Label>
          <Input
            id="fee-discount"
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
          <Label htmlFor="fee-discount-reason">
            {t?.discountReason || "Reason"}
          </Label>
          <Input
            id="fee-discount-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={saveDiscount}
            disabled={isPending}
          >
            {t?.saveDiscount || "Save discount"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
