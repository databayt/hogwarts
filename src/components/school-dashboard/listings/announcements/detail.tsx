"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
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

import { formatDate } from "@/lib/i18n-format"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { InfoRows } from "@/components/school-dashboard/shared"

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
  const d = dictionary?.school?.announcements

  const t = {
    back: d?.back || "Back",
    details: d?.details || "Announcement Details",
    title: d?.announcementTitle || "Title",
    content: d?.content || "Content",
    scope: d?.scope || "Scope",
    priority: d?.priority?.label || "Priority",
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
    urgent: d?.priority?.urgent?.label || "Urgent",
    all: d?.all || "All",
  }

  // Target roles are stored as the enum; the dictionary has a label for each.
  const roleLabels: Record<string, string | undefined> = {
    ADMIN: d?.roleAdmin,
    TEACHER: d?.roleTeacher,
    STUDENT: d?.roleStudent,
    GUARDIAN: d?.roleGuardian,
    STAFF: d?.roleStaff,
    ACCOUNTANT: d?.roleAccountant,
  }
  const roleLabel = (role: string) => roleLabels[role] || role

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" />
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
      case "urgent":
        return { label: t.urgent, variant: "destructive" as const }
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
  const longDate = (date: Date) =>
    formatDate(date, lang, { year: "numeric", month: "long", day: "numeric" })
  const isNotablePriority = ["high", "urgent"].includes(
    data.priority.toLowerCase()
  )

  return (
    <>
      {/* Phone: read like the library's book page — the meta line small over a
          large title, the body at reading size, the facts as label/value rows
          instead of four stacked stat cards. */}
      <article className="space-y-8 md:hidden">
        <header>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-muted-foreground -ms-3 mb-3 h-9 rounded-full px-3"
          >
            <ArrowLeft className="me-1 h-4 w-4 rtl:rotate-180" />
            {t.back}
          </Button>
          <p className="text-muted-foreground text-sm">
            {getScopeLabel(data.scope)} · {longDate(data.createdAt)}
          </p>
          <h1 className="mt-1 text-[28px] leading-tight font-bold text-balance">
            {title}
          </h1>
          {!data.published || isNotablePriority ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {!data.published ? (
                <Badge variant="outline">{t.draft}</Badge>
              ) : null}
              {isNotablePriority ? (
                <Badge variant={priorityInfo.variant}>
                  {priorityInfo.label}
                </Badge>
              ) : null}
            </div>
          ) : null}
        </header>

        {body ? (
          <p className="text-[17px] leading-8 whitespace-pre-wrap">{body}</p>
        ) : (
          <p className="text-muted-foreground italic">
            {d?.noContent || t.content}
          </p>
        )}

        <InfoRows
          heading={t.details}
          rows={[
            { key: "scope", label: t.scope, value: getScopeLabel(data.scope) },
            {
              key: "role",
              label: t.targetRole,
              value: data.role ? roleLabel(data.role) : null,
            },
            { key: "priority", label: t.priority, value: priorityInfo.label },
            {
              key: "status",
              label: t.status,
              value: data.published ? t.published : t.draft,
            },
            {
              key: "created",
              label: t.createdAt,
              value: formatDate(data.createdAt, lang),
            },
            {
              key: "updated",
              label: t.updatedAt,
              value: formatDate(data.updatedAt, lang),
            },
          ]}
        />
      </article>

      <div className="hidden space-y-6 md:block">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">{title}</h1>
              <p className="text-muted-foreground text-sm">
                {longDate(data.createdAt)}
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
                  {d?.noContent || t.content}
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
                  {t.targetRole}: {roleLabel(data.role)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Priority Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t.priority}
              </CardTitle>
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
              <CardTitle className="text-sm font-medium">
                {t.createdAt}
              </CardTitle>
              <Calendar className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {formatDate(data.createdAt, lang)}
              </div>
            </CardContent>
          </Card>

          {/* Updated At Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {t.updatedAt}
              </CardTitle>
              <Calendar className="text-muted-foreground h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold">
                {formatDate(data.updatedAt, lang)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
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
