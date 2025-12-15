"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { Locale } from "@/components/internationalization/config"
import type { getDictionary } from "@/components/internationalization/dictionaries"
import { useLocale } from "@/components/internationalization/use-locale"
import { HostStepLayout } from "@/components/onboarding"
import { useHostValidation } from "@/components/onboarding/host-validation-context"

interface Props {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  lang: Locale
  id: string
}

const DiscountPage = (props: Props) => {
  const { dictionary, lang, id } = props
  const router = useRouter()
  const { isRTL } = useLocale()
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([
    "new-listing",
    "last-minute",
    "weekly",
  ])
  const { enableNext } = useHostValidation()

  // Enable next button since discounts are optional
  React.useEffect(() => {
    enableNext()
  }, [enableNext])

  const toggleDiscount = (discountId: string) => {
    setSelectedDiscounts((prev) =>
      prev.includes(discountId)
        ? prev.filter((id) => id !== discountId)
        : [...prev, discountId]
    )
  }

  const dict = (dictionary as any)?.school?.onboarding || {}

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
    <HostStepLayout
      title={dict.addDiscounts || "Add discounts"}
      subtitle={
        dict.addDiscountsSubtitle ||
        "Attract more families and fill your enrollment faster with these promotional offers."
      }
    >
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
              {/* Percentage Badge */}
              <div className="flex-shrink-0">
                <Badge
                  variant={
                    discount.id === "new-listing" ? "default" : "outline"
                  }
                  className={`text-foreground flex h-8 w-12 items-center justify-center bg-transparent ${
                    discount.id !== "new-listing"
                      ? "bg-background border-muted-foreground border"
                      : ""
                  }`}
                >
                  {discount.percentage}
                </Badge>
              </div>

              {/* Title and Description */}
              <div className="mx-4 flex-1">
                <h5 className="mb-1">{discount.title}</h5>
                <p>{discount.description}</p>
              </div>

              {/* Checkbox */}
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
    </HostStepLayout>
  )
}

export default DiscountPage
