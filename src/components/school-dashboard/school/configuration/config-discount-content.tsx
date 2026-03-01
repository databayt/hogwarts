"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface Props {
  dictionary?: any
}

export function ConfigDiscountContent({ dictionary }: Props) {
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([
    "new-listing",
    "last-minute",
    "weekly",
  ])
  const dict = (dictionary as any)?.school?.onboarding || {}

  const toggleDiscount = (discountId: string) => {
    setSelectedDiscounts((prev) =>
      prev.includes(discountId)
        ? prev.filter((id) => id !== discountId)
        : [...prev, discountId]
    )
  }

  const discounts = [
    {
      id: "new-listing",
      percentage: "20%",
      title: dict.newFamilyPromotion || "New family promotion",
      description:
        dict.newFamilyPromotionDescription ||
        "Offer 20% off first semester for new student enrollments",
    },
    {
      id: "last-minute",
      percentage: "25%",
      title: dict.siblingDiscount || "Sibling discount",
      description:
        dict.siblingDiscountDescription ||
        "For families enrolling multiple children",
    },
    {
      id: "weekly",
      percentage: "10%",
      title: dict.earlyEnrollmentDiscount || "Early enrollment discount",
      description:
        dict.earlyEnrollmentDiscountDescription ||
        "enroll 30 days before term starts",
    },
  ]

  return (
    <div className="space-y-4">
      {discounts.map((discount) => (
        <Card
          key={discount.id}
          className={`cursor-pointer border p-4 transition-all duration-200 ${
            selectedDiscounts.includes(discount.id)
              ? "border-foreground/50 bg-accent"
              : "hover:border-foreground/50"
          }`}
          onClick={() => toggleDiscount(discount.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-shrink-0">
              <Badge
                variant={discount.id === "new-listing" ? "default" : "outline"}
                className={`text-foreground flex h-8 w-12 items-center justify-center bg-transparent ${
                  discount.id !== "new-listing"
                    ? "bg-background border-muted-foreground border"
                    : ""
                }`}
              >
                {discount.percentage}
              </Badge>
            </div>
            <div className="mx-4 flex-1">
              <h5 className="mb-1">{discount.title}</h5>
              <p>{discount.description}</p>
            </div>
            <div className="flex-shrink-0">
              <Checkbox
                checked={selectedDiscounts.includes(discount.id)}
                onCheckedChange={() => toggleDiscount(discount.id)}
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
