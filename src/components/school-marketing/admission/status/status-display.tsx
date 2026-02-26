"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  CreditCard,
  FileText,
  Users,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type {
  ApplicationStatus,
  ChecklistItem,
  StatusTimelineEntry,
} from "../types"

interface Props {
  status: ApplicationStatus
  lang: Locale
  dictionary?: Dictionary
  onBack: () => void
}

const STATUS_COLORS = {
  PENDING:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  UNDER_REVIEW:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  INTERVIEW_SCHEDULED:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  DOCUMENTS_REQUESTED:
    "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  WAITLISTED:
    "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
  APPROVED:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  ENROLLED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
}

const getChecklistIcon = (type: ChecklistItem["type"]) => {
  switch (type) {
    case "document":
      return FileText
    case "payment":
      return CreditCard
    case "interview":
      return Users
    case "tour":
      return Calendar
    default:
      return Circle
  }
}

export default function StatusDisplay({
  status,
  lang,
  dictionary,
  onBack,
}: Props) {
  const isRTL = lang === "ar"

  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { statusDisplay?: Record<string, string> } }
      }
    )?.school?.admission?.statusDisplay ?? {}

  const progress = (status.currentStep.current / status.currentStep.total) * 100

  const getStatusLabel = (statusValue: string) => {
    const dictKeys: Record<string, string> = {
      PENDING: "pendingReview",
      UNDER_REVIEW: "underReview",
      INTERVIEW_SCHEDULED: "interviewScheduled",
      DOCUMENTS_REQUESTED: "documentsRequested",
      WAITLISTED: "waitlisted",
      APPROVED: "approved",
      REJECTED: "rejected",
      ENROLLED: "enrolled",
    }
    const fallbacks: Record<string, string> = {
      PENDING: "Pending Review",
      UNDER_REVIEW: "Under Review",
      INTERVIEW_SCHEDULED: "Interview Scheduled",
      DOCUMENTS_REQUESTED: "Documents Requested",
      WAITLISTED: "Waitlisted",
      APPROVED: "Approved",
      REJECTED: "Rejected",
      ENROLLED: "Enrolled",
    }
    const key = dictKeys[statusValue]
    return (
      (key ? dict[key] : undefined) || fallbacks[statusValue] || statusValue
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {dict.back || "Back"}
        </Button>
      </div>

      {/* Application Info */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription>
                {dict.applicationNumber || "Application Number"}
              </CardDescription>
              <CardTitle className="font-mono text-xl">
                {status.applicationNumber}
              </CardTitle>
            </div>
            <Badge
              className={
                STATUS_COLORS[status.status as keyof typeof STATUS_COLORS]
              }
            >
              {getStatusLabel(status.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {dict.progress || "Progress"}
              </span>
              <span className="font-medium">
                {status.currentStep.current} / {status.currentStep.total}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-muted-foreground text-sm">
              {dict.currentStep || "Current Step:"} {status.currentStep.label}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {dict.applicationTimeline || "Application Timeline"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {status.timeline.map((entry, index) => (
              <TimelineItem
                key={index}
                entry={entry}
                isLast={index === status.timeline.length - 1}
                isRTL={isRTL}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {dict.requirementsChecklist || "Requirements Checklist"}
          </CardTitle>
          <CardDescription>
            {dict.checklistDesc ||
              "Complete all requirements to finalize your application"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.checklist.map((item) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                isRTL={isRTL}
                requiredLabel={dict.required || "Required"}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      {status.nextSteps && status.nextSteps.length > 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="text-primary h-5 w-5" />
              {dict.nextSteps || "Next Steps"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {status.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary font-medium">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Help */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center text-sm">
            {dict.helpText ||
              "Have questions about your application? Contact the admissions office"}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface TimelineItemProps {
  entry: StatusTimelineEntry
  isLast: boolean
  isRTL: boolean
}

function TimelineItem({ entry, isLast, isRTL }: TimelineItemProps) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        {entry.completed ? (
          <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-green-500" />
        ) : entry.current ? (
          <Clock className="text-primary h-6 w-6 flex-shrink-0 animate-pulse" />
        ) : (
          <Circle className="text-muted-foreground/30 h-6 w-6 flex-shrink-0" />
        )}
        {!isLast && (
          <div
            className={`mt-2 w-0.5 flex-1 ${
              entry.completed ? "bg-green-500" : "bg-muted-foreground/20"
            }`}
          />
        )}
      </div>
      <div className="pb-4">
        <p
          className={`font-medium ${
            entry.current
              ? "text-primary"
              : entry.completed
                ? "text-foreground"
                : "text-muted-foreground"
          }`}
        >
          {entry.label}
        </p>
        {entry.date && (
          <p className="text-muted-foreground text-sm">
            {new Date(entry.date).toLocaleDateString(
              isRTL ? "ar-SA" : "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
          </p>
        )}
      </div>
    </div>
  )
}

interface ChecklistItemRowProps {
  item: ChecklistItem
  isRTL: boolean
  requiredLabel: string
}

function ChecklistItemRow({
  item,
  isRTL,
  requiredLabel,
}: ChecklistItemRowProps) {
  const Icon = getChecklistIcon(item.type)

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        item.completed
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10"
          : "bg-muted/50"
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon
          className={`h-5 w-5 ${
            item.completed ? "text-green-500" : "text-muted-foreground"
          }`}
        />
        <div>
          <span
            className={
              item.completed ? "text-muted-foreground line-through" : ""
            }
          >
            {item.label}
          </span>
          {item.required && !item.completed && (
            <Badge variant="destructive" className="ms-2 text-xs">
              {requiredLabel}
            </Badge>
          )}
        </div>
      </div>
      {item.completed && <CheckCircle2 className="h-5 w-5 text-green-500" />}
    </div>
  )
}
