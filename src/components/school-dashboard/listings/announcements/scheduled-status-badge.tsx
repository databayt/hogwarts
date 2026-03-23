"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { Calendar, CircleCheck, CircleX, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useDictionary } from "@/components/internationalization/use-dictionary"

interface ScheduledStatusBadgeProps {
  published: boolean
  scheduledFor?: Date | string | null
  expiresAt?: Date | string | null
  className?: string
}

export function ScheduledStatusBadge({
  published,
  scheduledFor,
  expiresAt,
  className,
}: ScheduledStatusBadgeProps) {
  const { dictionary } = useDictionary()
  const ss = (dictionary?.school?.announcements as any)?.scheduledStatus as
    | Record<string, string>
    | undefined

  const now = new Date()
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null
  const expiresDate = expiresAt ? new Date(expiresAt) : null

  // Determine status
  let status: "published" | "scheduled" | "draft" | "expired"
  let icon: React.ReactNode
  let label: string
  let variant: "default" | "secondary" | "destructive" | "outline"
  let tooltipText: string

  if (expiresDate && expiresDate < now && published) {
    // Expired
    status = "expired"
    icon = <CircleX className="h-3 w-3" />
    label = ss?.expired || "Expired"
    variant = "destructive"
    tooltipText = `${ss?.expiredOn || "Expired on"} ${expiresDate.toLocaleString()}`
  } else if (published) {
    // Published
    status = "published"
    icon = <CircleCheck className="h-3 w-3" />
    label = ss?.published || "Published"
    variant = "default"
    tooltipText = ss?.currentlyPublished || "Currently published"
  } else if (scheduledDate && scheduledDate > now) {
    // Scheduled for future
    status = "scheduled"
    icon = <Calendar className="h-3 w-3" />
    label = ss?.scheduled || "Scheduled"
    variant = "secondary"
    tooltipText = `${ss?.scheduledFor || "Scheduled for"} ${scheduledDate.toLocaleString()}`
  } else {
    // Draft
    status = "draft"
    icon = <Clock className="h-3 w-3" />
    label = ss?.draft || "Draft"
    variant = "outline"
    tooltipText = ss?.notYetPublished || "Not yet published"
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(
              "gap-1",
              status === "scheduled" && "bg-blue-100 text-blue-700",
              status === "expired" && "bg-red-100 text-red-700",
              className
            )}
          >
            {icon}
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{tooltipText}</p>
          {expiresDate && status !== "expired" && (
            <p className="text-muted-foreground mt-1 text-xs">
              {ss?.expires || "Expires"}: {expiresDate.toLocaleString()}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
