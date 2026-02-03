"use client"

import React from "react"
import { Clock, FileText, User } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export interface DraftApplication {
  sessionToken: string
  campaignId: string | null
  campaignName: string | null
  currentStep: number
  totalSteps: number
  studentName: string | null
  updatedAt: Date
  expiresAt: Date
}

interface ApplicationCardProps {
  application: DraftApplication
  onClick?: (sessionToken: string) => void
  isRTL?: boolean
  dictionary?: {
    draft?: string
    step?: string
    lastUpdated?: string
    expiresIn?: string
  }
}

function formatRelativeTime(date: Date, isRTL: boolean): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return isRTL ? "اليوم" : "Today"
  } else if (diffDays === 1) {
    return isRTL ? "غدا" : "Tomorrow"
  } else if (diffDays <= 7) {
    return isRTL ? `${diffDays} أيام` : `${diffDays} days`
  } else {
    return date.toLocaleDateString(isRTL ? "ar" : "en", {
      month: "short",
      day: "numeric",
    })
  }
}

function formatLastUpdated(date: Date, isRTL: boolean): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) {
    return isRTL ? "منذ قليل" : "Just now"
  } else if (diffHours < 24) {
    return isRTL ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`
  } else if (diffDays === 1) {
    return isRTL ? "أمس" : "Yesterday"
  } else if (diffDays <= 7) {
    return isRTL ? `منذ ${diffDays} أيام` : `${diffDays}d ago`
  } else {
    return date.toLocaleDateString(isRTL ? "ar" : "en", {
      month: "short",
      day: "numeric",
    })
  }
}

export function ApplicationCard({
  application,
  onClick,
  isRTL = false,
  dictionary,
}: ApplicationCardProps) {
  const dict = dictionary || {}

  const handleClick = () => {
    onClick?.(application.sessionToken)
  }

  return (
    <Card
      className="hover:border-foreground/50 bg-card hover:bg-accent min-h-[50px] cursor-pointer rounded-lg border py-3 shadow-none transition-all hover:shadow-none sm:min-h-[60px] sm:py-4"
      onClick={handleClick}
    >
      <CardContent className="flex items-center px-2 py-0 sm:px-3">
        <div className="flex flex-1 items-center space-x-2">
          <div className="bg-muted flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md sm:h-10 sm:w-10">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h5 className="truncate text-xs font-medium sm:text-sm">
                {application.campaignName ||
                  (isRTL ? "طلب القبول" : "Application")}
              </h5>
              <Badge
                variant="secondary"
                className="bg-blue-100 text-xs text-blue-800"
              >
                {dict.draft || (isRTL ? "مسودة" : "Draft")}
              </Badge>
            </div>
            <div className="mt-0.5 flex flex-col sm:flex-row sm:items-center sm:gap-2 rtl:flex-row-reverse">
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                {application.studentName && (
                  <>
                    <User className="h-3 w-3" />
                    <span>{application.studentName}</span>
                    <span className="hidden sm:inline">•</span>
                  </>
                )}
                <span>
                  {dict.step || (isRTL ? "الخطوة" : "Step")}{" "}
                  {application.currentStep}/{application.totalSteps}
                </span>
              </p>
              <p className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                <span>{formatLastUpdated(application.updatedAt, isRTL)}</span>
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ApplicationCard
