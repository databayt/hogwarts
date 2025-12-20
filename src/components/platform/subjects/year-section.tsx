"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"

import { TopicCard, TopicCardSkeleton } from "./topic-card"

interface Lesson {
  id: string
  title: string
  description: string | null
  status: string
}

interface YearSectionProps {
  /** Year level name (English) */
  levelName: string
  /** Year level name (Arabic) */
  levelNameAr?: string | null
  /** Lessons in this year level */
  lessons: Lesson[]
  /** Current locale */
  lang: Locale
  /** Subject name for image mapping */
  subjectName: string
  /** Additional class names */
  className?: string
}

/**
 * YearSection - Groups lessons by year level
 *
 * Features:
 * - Year level heading
 * - Grid of topic cards
 * - RTL support for Arabic names
 * - Responsive grid layout
 */
export function YearSection({
  levelName,
  levelNameAr,
  lessons,
  lang,
  subjectName,
  className,
}: YearSectionProps) {
  const isRTL = lang === "ar"
  const displayLevel = isRTL && levelNameAr ? levelNameAr : levelName

  if (lessons.length === 0) {
    return null
  }

  return (
    <section className={cn("space-y-4", className)}>
      <h2 className="text-lg font-semibold">{displayLevel}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lessons.map((lesson) => (
          <TopicCard
            key={lesson.id}
            id={lesson.id}
            title={lesson.title}
            description={lesson.description}
            lang={lang}
            subjectName={subjectName}
          />
        ))}
      </div>
    </section>
  )
}

/**
 * Loading skeleton for YearSection
 */
export function YearSectionSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TopicCardSkeleton />
        <TopicCardSkeleton />
        <TopicCardSkeleton />
      </div>
    </div>
  )
}
