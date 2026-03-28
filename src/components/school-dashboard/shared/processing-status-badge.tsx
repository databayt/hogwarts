"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import * as React from "react"
import { Check, Clock, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"

interface ProcessingStatusBadgeProps {
  status: ProcessingStatus
  dictionary: Record<string, any>
  className?: string
}

const statusConfig: Record<
  ProcessingStatus,
  {
    icon: React.ElementType
    badgeClass: string
    dictionaryKey: string
    animate?: boolean
  }
> = {
  PENDING: {
    icon: Clock,
    badgeClass:
      "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    dictionaryKey: "pending",
  },
  PROCESSING: {
    icon: Loader2,
    badgeClass:
      "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    dictionaryKey: "processing",
    animate: true,
  },
  COMPLETED: {
    icon: Check,
    badgeClass:
      "border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    dictionaryKey: "completed",
  },
  FAILED: {
    icon: X,
    badgeClass:
      "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
    dictionaryKey: "failed",
  },
}

export const ProcessingStatusBadge = React.memo(function ProcessingStatusBadge({
  status,
  dictionary,
  className,
}: ProcessingStatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const label =
    dictionary?.documentProcessing?.status?.[config.dictionaryKey] ??
    config.dictionaryKey

  return (
    <Badge className={cn(config.badgeClass, className)}>
      <Icon
        className={cn("h-3 w-3", config.animate && "animate-spin")}
        aria-hidden="true"
      />
      {label}
    </Badge>
  )
})

export type { ProcessingStatus, ProcessingStatusBadgeProps }
