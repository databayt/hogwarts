"use client"

import { useRouter } from "next/navigation"
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

// Type for assignment detail - matches the select result from actions.ts
interface AssignmentDetailResult {
  id: string
  schoolId: string
  title: string
  description: string | null
  classId: string
  type: string
  totalPoints: number
  weight: number
  dueDate: Date
  instructions: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

interface AssignmentDetailContentProps {
  data: AssignmentDetailResult | null
  error?: string | null
  dictionary: Dictionary
  lang: Locale
}

export function AssignmentDetailContent({
  data,
  error,
  dictionary,
  lang,
}: AssignmentDetailContentProps) {
  const router = useRouter()
  const isRTL = lang === "ar"

  const t = dictionary?.school?.assignments?.detail || {}

  // Get type label
  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      HOMEWORK: t.types?.homework || "Homework",
      QUIZ: t.types?.quiz || "Quiz",
      EXAM: t.types?.exam || "Exam",
      PROJECT: t.types?.project || "Project",
    }
    return types[type] || type
  }

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default"
      case "GRADED":
        return "secondary"
      case "CLOSED":
        return "outline"
      case "DRAFT":
      default:
        return "outline"
    }
  }

  // Get status label
  const getStatusLabel = (status: string) => {
    const statuses: Record<string, string> = {
      DRAFT: t.statuses?.draft || "Draft",
      ACTIVE: t.statuses?.active || "Active",
      CLOSED: t.statuses?.closed || "Closed",
      GRADED: t.statuses?.graded || "Graded",
    }
    return statuses[status] || status
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back || "Back"}
        </Button>
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{t.errorTitle || "Error"}</AlertTitle>
          <AlertDescription>
            {error || t.notFound || "Assignment not found"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Check if due date is past
  const isPastDue = new Date(data.dueDate) < new Date()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{data.title}</h1>
            <p className="text-muted-foreground text-sm">
              {t.due || "Due:"}{" "}
              {new Date(data.dueDate).toLocaleDateString(
                isRTL ? "ar-SA" : "en-US",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getStatusVariant(data.status)}>
            {getStatusLabel(data.status)}
          </Badge>
          <Badge variant="outline">{getTypeLabel(data.type)}</Badge>
          {isPastDue && data.status !== "GRADED" && (
            <Badge variant="destructive">{t.pastDue || "Past Due"}</Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t.overview || "Overview"}</TabsTrigger>
          <TabsTrigger value="submissions">
            {t.submissions || "Submissions"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Description Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t.description || "Description"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {data.description ? (
                  <p className="whitespace-pre-wrap">{data.description}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t.noDescription || "No description"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Type Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {dictionary?.school?.assignments?.type || "Type"}
                </CardTitle>
                <ClipboardList className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Badge variant="secondary">{getTypeLabel(data.type)}</Badge>
              </CardContent>
            </Card>

            {/* Due Date Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {dictionary?.school?.assignments?.dueDate || "Due Date"}
                </CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {new Date(data.dueDate).toLocaleDateString(
                    isRTL ? "ar-SA" : "en-US"
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Total Points Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.totalPoints || "Total Points"}
                </CardTitle>
                <Target className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{data.totalPoints}</div>
              </CardContent>
            </Card>

            {/* Weight Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.weight || "Weight"}
                </CardTitle>
                <Percent className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{data.weight}%</div>
              </CardContent>
            </Card>

            {/* Created At Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.createdAt || "Created"}
                </CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {new Date(data.createdAt).toLocaleDateString(
                    isRTL ? "ar-SA" : "en-US"
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Updated At Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.updatedAt || "Last Updated"}
                </CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {new Date(data.updatedAt).toLocaleDateString(
                    isRTL ? "ar-SA" : "en-US"
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                {t.instructions || "Instructions"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {data.instructions ? (
                  <p className="whitespace-pre-wrap">{data.instructions}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t.noInstructions || "No instructions"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.submissions || "Submissions"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t.submissionsListPlaceholder ||
                  "Submissions list will be displayed here"}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
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
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-32" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-32" />
    </div>
  )
}
