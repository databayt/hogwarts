"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { tryCatch } from "@/hooks/try-catch"
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { enrollInSubject } from "./catalog-actions"

interface CatalogEnrollmentButtonProps {
  catalogSubjectId: string
  isEnrolled: boolean
  price?: number | null
  currency?: string | null
  subjectSlug: string
  lang: string
  firstLessonId?: string | null
}

export function CatalogEnrollmentButton({
  catalogSubjectId,
  isEnrolled,
  price,
  currency,
  subjectSlug,
  lang,
  firstLessonId,
}: CatalogEnrollmentButtonProps) {
  const [pending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const d = dictionary?.stream?.enrollmentButton

  const isPaid = price && price > 0
  const formattedPrice = isPaid
    ? new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US", {
        style: "currency",
        currency: currency || "USD",
      }).format(price)
    : null

  if (isEnrolled) {
    return (
      <Button
        variant="outline"
        className="h-9 w-auto px-6 text-sm font-medium"
        onClick={() => {
          window.location.href = firstLessonId
            ? `/${lang}/stream/courses/${subjectSlug}/${firstLessonId}`
            : `/${lang}/stream/courses/${subjectSlug}`
        }}
      >
        {d?.continueLearning ?? "Continue Learning"}
      </Button>
    )
  }

  function onSubmit() {
    startTransition(async () => {
      const { error } = await tryCatch(enrollInSubject(catalogSubjectId))

      if (error) {
        toast.error(
          error.message ||
            d?.enrollError ||
            "An unexpected error occurred. Please try again."
        )
      }
    })
  }

  return (
    <Button
      onClick={onSubmit}
      disabled={pending}
      className="h-9 w-auto px-6 text-sm font-medium"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {d?.processing ?? "Processing..."}
        </>
      ) : isPaid ? (
        d?.enrollPrice ? (
          d.enrollPrice.replace("{price}", formattedPrice ?? "")
        ) : (
          `Enroll - ${formattedPrice}`
        )
      ) : (
        (d?.enrollForFree ?? "Enroll for Free")
      )}
    </Button>
  )
}
