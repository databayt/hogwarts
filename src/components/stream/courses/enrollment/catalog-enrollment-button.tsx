"use client"

import { useTransition } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { tryCatch } from "@/hooks/try-catch"
import { Button } from "@/components/ui/button"

import { enrollInCatalogSubject } from "./catalog-actions"

interface CatalogEnrollmentButtonProps {
  catalogSubjectId: string
  isEnrolled: boolean
  price?: number | null
  currency?: string | null
  subjectSlug: string
  lang: string
}

export function CatalogEnrollmentButton({
  catalogSubjectId,
  isEnrolled,
  price,
  currency,
  subjectSlug,
  lang,
}: CatalogEnrollmentButtonProps) {
  const [pending, startTransition] = useTransition()

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
        className="h-12 w-auto px-8 text-base font-medium"
        onClick={() => {
          window.location.href = `/${lang}/stream/dashboard/${subjectSlug}`
        }}
      >
        Continue Learning
      </Button>
    )
  }

  function onSubmit() {
    startTransition(async () => {
      const { error } = await tryCatch(enrollInCatalogSubject(catalogSubjectId))

      if (error) {
        toast.error(
          error.message || "An unexpected error occurred. Please try again."
        )
      }
    })
  }

  return (
    <Button
      onClick={onSubmit}
      disabled={pending}
      className="h-12 w-auto px-8 text-base font-medium"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Processing...
        </>
      ) : isPaid ? (
        `Enroll - ${formattedPrice}`
      ) : (
        "Enroll for Free"
      )}
    </Button>
  )
}
