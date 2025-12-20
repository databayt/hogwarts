"use client"

import { useMemo } from "react"
import { BookOpen, CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { SubjectHero, SubjectHeroSkeleton } from "./hero"
import { YearSection, YearSectionSkeleton } from "./year-section"

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
  classes?: {
    id: string
    yearLevel: {
      id: string
      levelName: string
      levelNameAr: string | null
      levelOrder: number
    } | null
    lessons: {
      id: string
      title: string
      description: string | null
      status: string
    }[]
  }[]
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
    errorTitle: isRTL ? "خطأ" : "Error",
    notFound: isRTL ? "المادة غير موجودة" : "Subject not found",
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

  // Group lessons by year level
  const lessonsByYear = useMemo(() => {
    const grouped = new Map<
      string,
      {
        level: {
          id: string
          levelName: string
          levelNameAr: string | null
          levelOrder: number
        }
        lessons: {
          id: string
          title: string
          description: string | null
          status: string
        }[]
      }
    >()

    data.classes?.forEach((cls) => {
      if (cls.yearLevel && cls.lessons?.length) {
        const key = cls.yearLevel.id
        if (!grouped.has(key)) {
          grouped.set(key, { level: cls.yearLevel, lessons: [] })
        }
        grouped.get(key)!.lessons.push(...cls.lessons)
      }
    })

    return Array.from(grouped.values()).sort(
      (a, b) => a.level.levelOrder - b.level.levelOrder
    )
  }, [data.classes])

  // Count total topics for hero
  const totalTopics = lessonsByYear.reduce(
    (sum, { lessons }) => sum + lessons.length,
    0
  )

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <SubjectHero
        subjectName={data.subjectName}
        subjectNameAr={data.subjectNameAr}
        topicsCount={totalTopics}
        lang={lang}
      />

      {/* Year Sections with Topics */}
      {lessonsByYear.length > 0 ? (
        <div className="space-y-8">
          {lessonsByYear.map(({ level, lessons }) => (
            <YearSection
              key={level.id}
              levelName={level.levelName}
              levelNameAr={level.levelNameAr}
              lessons={lessons}
              lang={lang}
              subjectName={data.subjectName}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="text-muted-foreground mx-auto h-12 w-12" />
            <p className="text-muted-foreground mt-4">{t.noTopics}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function SubjectDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Hero skeleton */}
      <SubjectHeroSkeleton />

      {/* Year sections skeleton */}
      <div className="space-y-8">
        <YearSectionSkeleton />
        <YearSectionSkeleton />
      </div>
    </div>
  )
}
