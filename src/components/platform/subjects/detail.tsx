"use client"

import { BookOpen, Calendar, CircleAlert, Layers } from "lucide-react"

import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SubjectHero, SubjectHeroSkeleton } from "./hero"

// Type for subject detail - matches the select result from actions.ts
interface SubjectDetailResult {
  id: string
  schoolId: string
  subjectName: string
  subjectNameAr?: string | null
  departmentId: string | null
  department?: {
    id: string
    departmentName: string
    departmentNameAr?: string | null
  } | null
  createdAt: Date
  updatedAt: Date
}

interface SubjectDetailContentProps {
  data: SubjectDetailResult | null
  error?: string | null
  dictionary: Dictionary
  lang: Locale
}

export function SubjectDetailContent({
  data,
  error,
  dictionary,
  lang,
}: SubjectDetailContentProps) {
  const isRTL = lang === "ar"

  const t = {
    details: isRTL ? "تفاصيل المادة" : "Subject Details",
    subjectName: isRTL ? "اسم المادة" : "Subject Name",
    department: isRTL ? "القسم" : "Department",
    createdAt: isRTL ? "تاريخ الإنشاء" : "Created",
    updatedAt: isRTL ? "آخر تحديث" : "Last Updated",
    errorTitle: isRTL ? "خطأ" : "Error",
    notFound: isRTL ? "المادة غير موجودة" : "Subject not found",
    noDepartment: isRTL ? "غير محدد" : "Not assigned",
    relatedTopics: isRTL ? "المواضيع المتعلقة" : "Related Topics",
    noTopics: isRTL ? "لا توجد مواضيع متاحة" : "No topics available",
  }

  // Error state
  if (error || !data) {
    return (
      <Alert variant="destructive">
        <CircleAlert className="h-4 w-4" />
        <AlertTitle>{t.errorTitle}</AlertTitle>
        <AlertDescription>{error || t.notFound}</AlertDescription>
      </Alert>
    )
  }

  // Get localized names
  const displayName =
    isRTL && data.subjectNameAr ? data.subjectNameAr : data.subjectName
  const displayDepartment = data.department
    ? isRTL && data.department.departmentNameAr
      ? data.department.departmentNameAr
      : data.department.departmentName
    : t.noDepartment

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <SubjectHero
        subjectName={data.subjectName}
        subjectNameAr={data.subjectNameAr}
        lang={lang}
      />

      {/* Content Section - Two column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t.details}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                {/* Subject Name */}
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-sm">
                    {t.subjectName}
                  </dt>
                  <dd className="font-medium">{displayName}</dd>
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-sm">
                    {t.department}
                  </dt>
                  <dd>
                    {data.department ? (
                      <Badge variant="outline" className="font-normal">
                        <Layers className="mr-1 h-3 w-3" />
                        {displayDepartment}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">
                        {t.noDepartment}
                      </span>
                    )}
                  </dd>
                </div>

                {/* Created At */}
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-sm">
                    {t.createdAt}
                  </dt>
                  <dd className="flex items-center gap-1 text-sm">
                    <Calendar className="text-muted-foreground h-3 w-3" />
                    {new Date(data.createdAt).toLocaleDateString(
                      isRTL ? "ar-SA" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </dd>
                </div>

                {/* Updated At */}
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-sm">
                    {t.updatedAt}
                  </dt>
                  <dd className="flex items-center gap-1 text-sm">
                    <Calendar className="text-muted-foreground h-3 w-3" />
                    {new Date(data.updatedAt).toLocaleDateString(
                      isRTL ? "ar-SA" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Related Topics placeholder */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t.relatedTopics}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">{t.noTopics}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export function SubjectDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <SubjectHeroSkeleton />

      {/* Content skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
        <div>
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
