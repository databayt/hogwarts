"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  CircleAlert,
  ClipboardList,
  FileText,
  Hash,
  Percent,
  Target,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionaryFallback } from "@/components/internationalization/use-dictionary"

import {
  AssignmentAttachments,
  type AttachmentLink,
} from "./assignment-attachments"
import { formatAssignmentDate } from "./date"
import { statusLabel, statusVariant, typeLabel } from "./labels"
import { FamilySubmissionStatus } from "./family-submission"
import { StudentSubmissionCard } from "./submission-card"
import type { SubmissionReview } from "./submissions-core"
import { SubmissionsReview } from "./submissions-review"
import type { StudentSubmission } from "./submit-core"

// Type for assignment detail - matches the select result from actions.ts
interface AssignmentDetailResult {
  id: string
  schoolId: string
  title: string
  description: string | null
  type: string
  totalPoints: number
  weight: number
  dueDate: Date
  instructions: string | null
  attachmentLinks?: AttachmentLink[]
  className?: string
  subjectName?: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

interface AssignmentDetailContentProps {
  data: AssignmentDetailResult | null
  error?: string | null
  dictionary?: Dictionary
  lang: Locale
  /**
   * Present for a student (unlocks the hand-in card) or a guardian (the
   * child's submission, read-only). Absent for staff.
   */
  viewer?:
    | { role: "STUDENT"; submission: StudentSubmission | null }
    | {
        role: "GUARDIAN"
        submission: StudentSubmission | null
        childName?: string
      }
  /** Where "back" goes — a link, so a deep link or the app's Custom Tab works. */
  backHref: string
  /** Present for staff who may mark this assignment. */
  review?: SubmissionReview | null
}

export function AssignmentDetailContent({
  data,
  error,
  dictionary: dictionaryProp,
  lang,
  viewer,
  review,
  backHref,
}: AssignmentDetailContentProps) {
  const dictionary = useDictionaryFallback(dictionaryProp)
  const t = (dictionary?.school?.assignments?.detail || {}) as Record<
    string,
    any
  >
  const staffView = !viewer

  const backButton = (
    <Button
      variant="ghost"
      size="icon"
      asChild
      className="size-11 shrink-0"
      aria-label={t.back}
    >
      <Link href={backHref}>
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
      </Link>
    </Button>
  )

  // Error state — the action's error codes, in the reader's language.
  if (error || !data) {
    const codes = (t.errorCodes ?? {}) as Record<string, string>
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          {backButton}
          <span className="text-sm font-medium">{t.back}</span>
        </div>
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{t.errorTitle}</AlertTitle>
          <AlertDescription>
            {(error && codes[error]) ?? t.notFound}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if due date is past
  const isPastDue = new Date(data.dueDate) < new Date()
  const audience = [data.subjectName, data.className]
    .filter(Boolean)
    .join(" · ")

  const facts: Array<{
    key: string
    label: string
    icon: React.ReactNode
    value: React.ReactNode
    staffOnly?: boolean
  }> = [
    {
      key: "type",
      label: dictionary?.school?.assignments?.type ?? "",
      icon: <ClipboardList className="text-muted-foreground size-4" />,
      value: (
        <Badge variant="secondary">{typeLabel(t.types, data.type)}</Badge>
      ),
    },
    {
      key: "due",
      label: dictionary?.school?.assignments?.dueDate ?? "",
      icon: <Calendar className="text-muted-foreground size-4" />,
      value: formatAssignmentDate(data.dueDate, lang),
    },
    {
      key: "points",
      label: t.totalPoints,
      icon: <Target className="text-muted-foreground size-4" />,
      value: data.totalPoints,
    },
    {
      key: "weight",
      label: t.weight,
      icon: <Percent className="text-muted-foreground size-4" />,
      value: `${data.weight}%`,
    },
    {
      key: "created",
      label: t.createdAt,
      icon: <Calendar className="text-muted-foreground size-4" />,
      value: formatAssignmentDate(data.createdAt, lang),
      staffOnly: true,
    },
    {
      key: "updated",
      label: t.updatedAt,
      icon: <Calendar className="text-muted-foreground size-4" />,
      value: formatAssignmentDate(data.updatedAt, lang),
      staffOnly: true,
    },
  ]

  const overview = (
    <div className="space-y-4">
      {/* Facts: two across on a phone, four on a desktop */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {facts
          .filter((f) => staffView || !f.staffOnly)
          .map((f) => (
            <Card key={f.key} className="gap-2 py-4">
              <CardHeader className="flex flex-row items-center justify-between gap-2 px-4">
                <CardTitle className="text-muted-foreground text-xs font-medium sm:text-sm">
                  {f.label}
                </CardTitle>
                {f.icon}
              </CardHeader>
              <CardContent className="px-4">
                <div className="text-base font-semibold break-words tabular-nums sm:text-lg">
                  {f.value}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Description Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t.description}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.description ? (
            <p className="break-words whitespace-pre-wrap">
              {data.description}
            </p>
          ) : (
            <p className="text-muted-foreground italic">{t.noDescription}</p>
          )}
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t.instructions}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.instructions ? (
            <p className="break-words whitespace-pre-wrap">
              {data.instructions}
            </p>
          ) : (
            <p className="text-muted-foreground italic">{t.noInstructions}</p>
          )}
          <AssignmentAttachments
            links={data.attachmentLinks}
            label={t.attachments}
          />
        </CardContent>
      </Card>

      {viewer?.role === "STUDENT" && (
        <StudentSubmissionCard
          assignmentId={data.id}
          existing={viewer.submission}
          labels={t}
          locale={lang}
        />
      )}
      {viewer?.role === "GUARDIAN" && (
        <FamilySubmissionStatus
          submission={viewer.submission}
          labels={t}
          lang={lang}
          totalPoints={data.totalPoints}
        />
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header: title first, badges wrap under it on a phone */}
      <div className="flex items-start gap-2 sm:gap-4">
        {backButton}
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-xl font-semibold break-words sm:text-2xl">
            {data.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {[
              audience,
              viewer?.role === "GUARDIAN" ? viewer.childName : null,
              `${t.due} ${formatAssignmentDate(data.dueDate, lang, "long")}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>
              {statusLabel(t.statuses, data.status)}
            </Badge>
            <Badge variant="outline">{typeLabel(t.types, data.type)}</Badge>
            {isPastDue && data.status !== "GRADED" && (
              <Badge variant="destructive">{t.pastDue}</Badge>
            )}
          </div>
        </div>
      </div>

      {staffView ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="h-11 w-full sm:w-auto">
            <TabsTrigger value="overview" className="h-9 flex-1 sm:flex-none">
              {t.overview}
            </TabsTrigger>
            <TabsTrigger
              value="submissions"
              className="h-9 flex-1 sm:flex-none"
            >
              {t.submissions}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">{overview}</TabsContent>

          <TabsContent value="submissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t.submissions}</CardTitle>
              </CardHeader>
              <CardContent>
                {review ? (
                  <SubmissionsReview
                    review={review}
                    totalPoints={data.totalPoints}
                    labels={t}
                    locale={lang}
                  />
                ) : (
                  <p className="text-muted-foreground">{t.noReviewAccess}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        overview
      )}
    </div>
  )
}

export function AssignmentDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-11 w-full sm:w-64" />
      <Skeleton className="h-32" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-32" />
    </div>
  )
}
