"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { publishReportCards } from "./actions"

interface PublishButtonProps {
  reportCardIds: string[]
}

export function PublishButton({ reportCardIds }: PublishButtonProps) {
  const router = useRouter()
  const [isPublishing, setIsPublishing] = useState(false)

  const handlePublish = useCallback(async () => {
    setIsPublishing(true)

    const result = await publishReportCards({ reportCardIds })

    if (result.success) {
      toast.success(
        `Published ${reportCardIds.length} report card${reportCardIds.length !== 1 ? "s" : ""}`
      )
      router.refresh()
    } else if (!result.success) {
      toast.error(result.error)
    }

    setIsPublishing(false)
  }, [reportCardIds, router])

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
          Publishing...
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Publish All ({reportCardIds.length})
        </>
      )}
    </Button>
  )
}
