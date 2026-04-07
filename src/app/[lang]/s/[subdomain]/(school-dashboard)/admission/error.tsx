"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export default function AdmissionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const { dictionary } = useDictionary()
  const t = (dictionary as any)?.errors as Record<string, string> | undefined

  useEffect(() => {
    console.error("[Admission Error]", error)
  }, [error])

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <Icons.alertTriangle className="text-destructive h-12 w-12" />
      <h2 className="text-xl font-semibold">
        {t?.somethingWentWrong || "Something went wrong"}
      </h2>
      <p className="text-muted-foreground max-w-md text-center">
        {t?.admissionError ||
          "An error occurred while loading admission data. Please try again."}
      </p>
      {error.digest && (
        <p className="text-muted-foreground text-xs">
          {t?.errorId || "Error ID"}: {error.digest}
        </p>
      )}
      <Button onClick={reset}>{t?.tryAgain || "Try again"}</Button>
    </div>
  )
}
