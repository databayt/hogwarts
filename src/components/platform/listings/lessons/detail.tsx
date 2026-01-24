"use client"

import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Calendar,
  CircleAlert,
  ClipboardCheck,
  Clock,
  FileText,
  Package,
  StickyNote,
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

// Type for lesson detail - matches the select result from actions.ts
interface LessonDetailResult {
  id: string
  schoolId: string
  classId: string
  title: string
  description: string | null
  lessonDate: Date
  startTime: string
  endTime: string
  objectives: string | null
  materials: string | null
  activities: string | null
  assessment: string | null
  notes: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

interface LessonDetailContentProps {
  data: LessonDetailResult | null
  error?: string | null
  dictionary: Dictionary
  lang: Locale
}

export function LessonDetailContent({
  data,
  error,
  dictionary,
  lang,
}: LessonDetailContentProps) {
  const router = useRouter()
  const isRTL = lang === "ar"

  const t = dictionary?.school?.lessons?.detail || {}

  // Get status badge variant
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default"
      case "IN_PROGRESS":
        return "secondary"
      case "CANCELLED":
        return "destructive"
      case "PLANNED":
      default:
        return "outline"
    }
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
            {error || t.notFound || "Lesson not found"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

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
              {new Date(data.lessonDate).toLocaleDateString(
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
        <Badge variant={getStatusVariant(data.status)}>{data.status}</Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t.overview || "Overview"}</TabsTrigger>
          <TabsTrigger value="materials">
            {t.materials || "Materials"}
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
            {/* Date Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.date || "Date"}
                </CardTitle>
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {new Date(data.lessonDate).toLocaleDateString(
                    isRTL ? "ar-SA" : "en-US"
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Time Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.time || "Time"}
                </CardTitle>
                <Clock className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {data.startTime} - {data.endTime}
                </div>
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

          {/* Objectives Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                {t.objectives || "Objectives"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {data.objectives ? (
                  <p className="whitespace-pre-wrap">{data.objectives}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t.noObjectives || "No objectives defined"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {data.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  {t.notes || "Notes"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{data.notes}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="materials" className="space-y-4">
          {/* Materials Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.materialsLabel || "Learning Materials"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {data.materials ? (
                  <p className="whitespace-pre-wrap">{data.materials}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t.noMaterials || "No materials defined"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activities Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {t.activities || "Activities"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {data.activities ? (
                  <p className="whitespace-pre-wrap">{data.activities}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t.noActivities || "No activities defined"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assessment Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5" />
                {t.assessment || "Assessment"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {data.assessment ? (
                  <p className="whitespace-pre-wrap">{data.assessment}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    {t.noAssessment || "No assessment defined"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function LessonDetailLoading() {
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
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-32" />
    </div>
  )
}
