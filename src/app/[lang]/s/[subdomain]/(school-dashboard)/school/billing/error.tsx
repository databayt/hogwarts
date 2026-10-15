"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function BillingError({ error, reset }: ErrorProps) {
  const { locale } = useLocale()
  const dictionary = useDictionaryFallback()
  const t = dictionary.schoolConsole.billing.error

  useEffect(() => {
    // Log error to monitoring service (Sentry)
    console.error("Billing page error:", error)
  }, [error])

  return (
    <div className="grid gap-8">
      <Alert variant="destructive">
        <Icons.alertCircle className="h-4 w-4" />
        <AlertTitle>{t.title}</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            {error.message === "User not found"
              ? t.userNotFound
              : error.message?.includes("Stripe")
                ? t.paymentService
                : t.unexpected}
          </p>
          {error.digest && (
            <p className="text-muted-foreground text-xs">
              {t.reference}: <bdi dir="ltr">{error.digest}</bdi>
            </p>
          )}
        </AlertDescription>
      </Alert>

      <div className="flex gap-4">
        <Button onClick={reset} variant="outline" className="gap-2">
          <Icons.refresh className="h-4 w-4" />
          {t.tryAgain}
        </Button>
        <Button variant="ghost" asChild>
          <a href={`/${locale}/support`}>{t.contactSupport}</a>
        </Button>
      </div>
    </div>
  )
}
