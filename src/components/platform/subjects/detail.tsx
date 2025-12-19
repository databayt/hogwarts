"use client"

import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  CircleAlert,
  Layers,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

// Type for subject detail - matches the select result from actions.ts
interface SubjectDetailResult {
  id: string
  schoolId: string
  subjectName: string
  departmentId: string | null
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
  const router = useRouter()
  const isRTL = lang === "ar"

  const t = {
    back: isRTL ? "رجوع" : "Back",
    details: isRTL ? "تفاصيل المادة" : "Subject Details",
    subjectName: isRTL ? "اسم المادة" : "Subject Name",
    department: isRTL ? "القسم" : "Department",
    createdAt: isRTL ? "تاريخ الإنشاء" : "Created",
    updatedAt: isRTL ? "آخر تحديث" : "Last Updated",
    errorTitle: isRTL ? "خطأ" : "Error",
    notFound: isRTL ? "المادة غير موجودة" : "Subject not found",
    noDepartment: isRTL ? "غير محدد" : "Not assigned",
  }

  // Error state
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{data.subjectName}</h1>
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
        <Badge variant="secondary">
          <BookOpen className="mr-1 h-3 w-3" />
          {isRTL ? "مادة" : "Subject"}
        </Badge>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Subject Name Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t.subjectName}
            </CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{data.subjectName}</div>
          </CardContent>
        </Card>

        {/* Department Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {t.department}
            </CardTitle>
            <Layers className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {data.departmentId ? (
                <Badge variant="outline">{data.departmentId}</Badge>
              ) : (
                <span className="text-muted-foreground">{t.noDepartment}</span>
              )}
            </div>
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

export function SubjectDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  )
}
