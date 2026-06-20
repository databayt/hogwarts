"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useTransition } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ErrorToast, SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { syncDefaultClassrooms } from "./actions"

const ERROR_KEY_BY_CODE: Record<string, string> = {
  NO_GRADES_FOUND: "syncNoGrades",
  MISSING_SCHOOL: "syncMissingSchool",
  NOT_AUTHENTICATED: "syncNotAuthenticated",
  UNAUTHORIZED: "syncUnauthorized",
  CREATE_FAILED: "syncFailed",
}

export function SyncClassroomsButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classrooms as Record<string, string> | undefined

  const run = useCallback(() => {
    startTransition(async () => {
      const result = await syncDefaultClassrooms()
      if (!result.success || !result.data) {
        const code = result.error ?? "CREATE_FAILED"
        const dictKey = ERROR_KEY_BY_CODE[code] ?? "syncFailed"
        ErrorToast(d?.[dictKey] ?? "Sync failed")
        return
      }
      const { classrooms, sections, grades } = result.data
      const template =
        d?.syncSuccess ??
        "Synced {classrooms} rooms and {sections} sections across {grades} grades"
      SuccessToast(
        template
          .replace("{classrooms}", String(classrooms))
          .replace("{sections}", String(sections))
          .replace("{grades}", String(grades))
      )
      router.refresh()
    })
  }, [router, d])

  const label = isPending
    ? (d?.syncing ?? "Syncing…")
    : (d?.syncDefaults ?? "Sync defaults")

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={run}
      disabled={isPending}
      type="button"
      aria-label={label}
      title={label}
    >
      <RefreshCw
        className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
        aria-hidden="true"
      />
    </Button>
  )
}
