"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CircleAlert,
  Eye,
  Megaphone,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// Type for announcement detail - matches the select result from actions.ts
interface AnnouncementDetailResult {
  id: string
  schoolId: string
  title: string | null
  body: string | null
  lang: string
  scope: string
  priority: string
  classId: string | null
  role: string | null
  published: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

interface AnnouncementDetailContentProps {
  data: AnnouncementDetailResult | null
  error?: string | null
  dictionary: Dictionary
  lang: Locale
}

export function AnnouncementDetailContent({
  data,
  error,
  dictionary,
  lang,
}: AnnouncementDetailContentProps) {
  const router = useRouter()
  const isRTL = lang === "ar"
  const d = dictionary?.school?.announcements

  const t = {
    back: d?.back || "Back",
    details: d?.details || "Announcement Details",
    title: d?.announcementTitle || "Title",
    content: d?.content || "Content",
    scope: d?.scope || "Scope",
    priority: d?.priority || "Priority",
    status: d?.status || "Status",
    published: d?.published || "Published",
    draft: d?.draft || "Draft",
    targetRole: d?.targetRole || "Target Role",
    createdAt: d?.createdAt || "Created",
    updatedAt: d?.updatedAt || "Last Updated",
    errorTitle: d?.error || "Error",
    notFound: d?.notFound || "Announcement not found",
    schoolWide: d?.schoolWide || "School-wide",
    classSpecific: d?.classSpecific || "Class-specific",
    roleSpecific: d?.roleSpecific || "Role-specific",
    high: d?.high || "High",
    medium: d?.medium || "Medium",
    low: d?.low || "Low",
    normal: d?.normal || "Normal",
    all: d?.all || "All",
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t.back}
        </Button>
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{t.errorTitle}</AlertTitle>
          <AlertDescription>{error || t.notFound}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Get title and body
  const title = data.title || ""
  const body = data.body || ""

  // Get scope label
  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case "school":
        return t.schoolWide
      case "class":
        return t.classSpecific
      case "role":
        return t.roleSpecific
      default:
        return scope
    }
  }

  // Get priority label and variant
  const getPriorityInfo = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return { label: t.high, variant: "destructive" as const }
      case "medium":
        return { label: t.medium, variant: "default" as const }
      case "low":
        return { label: t.low, variant: "secondary" as const }
      default:
        return { label: t.normal, variant: "outline" as const }
    }
  }

  const priorityInfo = getPriorityInfo(data.priority)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="text-muted-foreground text-sm">
              {new Date(data.createdAt).toLocaleDateString(
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
          <Badge variant={data.published ? "default" : "secondary"}>
            {data.published ? t.published : t.draft}
          </Badge>
          <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>
        </div>
      </div>

      {/* Content Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            {t.content}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {body ? (
              <p className="whitespace-pre-wrap">{body}</p>
            ) : (
              <p className="text-muted-foreground italic">
                {d?.noContent || "No content"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Scope Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.scope}</CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {getScopeLabel(data.scope)}
            </div>
            {data.role && (
              <p className="text-muted-foreground text-xs">
                {t.targetRole}: {data.role}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Priority Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.priority}</CardTitle>
            <Eye className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Badge variant={priorityInfo.variant} className="text-lg">
              {priorityInfo.label}
            </Badge>
          </CardContent>
        </Card>

        {/* Created At Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{t.createdAt}</CardTitle>
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
            <CardTitle className="text-sm font-medium">{t.updatedAt}</CardTitle>
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
    </div>
  )
}

export function AnnouncementDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-48" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
