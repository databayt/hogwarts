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
  lang?: string
  departmentId: string | null
  department?: {
    id: string
    departmentName: string
    lang?: string
  } | null
  classes?: {
    id: string
    name: string
    lang?: string
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

  // Group lessons by class
  const lessonsByClass = useMemo(() => {
    return (
      data.classes
        ?.filter((cls) => cls.lessons?.length > 0)
        .map((cls) => ({
          id: cls.id,
          name: cls.name,
          lessons: cls.lessons,
        })) ?? []
    )
  }, [data.classes])

  // Count total topics for hero
  const totalTopics = lessonsByClass.reduce(
    (sum, cls) => sum + cls.lessons.length,
    0
  )

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <SubjectHero
        subjectName={data.subjectName}
        topicsCount={totalTopics}
        lang={lang}
      />

      {/* Class Sections with Topics */}
      {lessonsByClass.length > 0 ? (
        <div className="space-y-8">
          {lessonsByClass.map((cls) => (
            <YearSection
              key={cls.id}
              levelName={cls.name}
              lessons={cls.lessons}
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

      {/* Class sections skeleton */}
      <div className="space-y-8">
        <YearSectionSkeleton />
        <YearSectionSkeleton />
      </div>
    </div>
  )
}
