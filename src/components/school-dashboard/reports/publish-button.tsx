"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { actionErrorMessage } from "@/lib/resolve-action-error"
import { Button } from "@/components/ui/button"
import { SuccessToast } from "@/components/atom/toast"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { publishReportCards } from "./actions"

interface PublishButtonProps {
  reportCardIds: string[]
}

export function PublishButton({ reportCardIds }: PublishButtonProps) {
  const router = useRouter()
  const { dictionary } = useDictionary()
  const copy = dictionary?.results?.reportCards?.actions
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)

    const result = await publishReportCards({ reportCardIds })

    if (result.success) {
      SuccessToast(
        (copy?.published ?? "").replace("{count}", String(reportCardIds.length))
      )
      router.refresh()
    } else if (!result.success) {
      toast.error(
        actionErrorMessage(result.error, dictionary, copy?.publishFailed ?? "")
      )
    }

    setIsPublishing(false)
  }, [reportCardIds, router, copy, dictionary])

  return (
    <Button
      variant="outline"
      onClick={handlePublish}
      disabled={isPublishing || reportCardIds.length === 0}
      className="gap-2"
    >
      {isPublishing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {copy?.publishing}
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          {(copy?.publishAll ?? "").replace(
            "{count}",
            String(reportCardIds.length)
          )}
        </>
      )}
    </Button>
  )
}
