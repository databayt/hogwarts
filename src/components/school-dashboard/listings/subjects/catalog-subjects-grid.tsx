"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState } from "react"
import Link from "next/link"

import { BlurImage } from "@/components/atom/blur-image"
import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { gradeRangeLabel } from "@/lib/grade"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export interface SubjectItem {
  id: string
  slug: string
  name: string
  department: string
  level: string
  levels: string[]
  grades: number[]
  color: string | null
  imageUrl: string | null
  totalChapters: number
  totalLessons: number
  averageRating: number
  usageCount: number
  ratingCount: number
}

function levelLabel(level: string, lang: Locale): string {
  const labels: Record<string, Record<string, string>> = {
    ELEMENTARY: { en: "Elementary", ar: "ابتدائي" },
    MIDDLE: { en: "Middle", ar: "متوسط" },
    HIGH: { en: "High", ar: "ثانوي" },
  }
  return labels[level]?.[lang] ?? level
}

function gradesText(
  grades: number[],
  lang: Locale,
  country?: string | null
): string | null {
  if (grades.length === 0) return null
  return gradeRangeLabel(grades, { lang, country })
}

interface Props {
  subjects: SubjectItem[]
  lang: Locale
  subdomain?: string
  /** School country for grade naming (`@/lib/grade`). */
  gradeCountry?: string | null
}

export function SubjectsGrid({
  subjects,
  lang,
  subdomain,
  gradeCountry,
}: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined

  const noResults = cat?.noSubjectsFound || "No subjects found"

  const sorted = useMemo(() => {
    return [...subjects].sort((a, b) => {
      // Sort by lowest grade first, then by name
      const gradeA = a.grades[0] ?? 0
      const gradeB = b.grades[0] ?? 0
      if (gradeA !== gradeB) return gradeA - gradeB
      return a.name.localeCompare(b.name, lang === "ar" ? "ar" : "en")
    })
  }, [subjects, lang])

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        {noResults}
      </p>
    )
  }

  return (
    <div className="@container">
      <div className="grid grid-cols-2 gap-2 @sm:gap-3 @2xl:grid-cols-3 @5xl:grid-cols-4">
        {sorted.map((subject) => {
          return (
            <Link
              key={subject.id}
              href={`/${lang}/subjects/${subject.slug}`}
              className="hover:bg-muted/50 flex items-center gap-2 overflow-hidden rounded-lg border transition-colors @sm:gap-3"
            >
              <SubjectThumb
                imageUrl={subject.imageUrl}
                name={subject.name}
                color={subject.color}
              />

              {/* Name + Level + Rating */}
              <div className="min-w-0 pe-2 @sm:pe-3">
                <p className="line-clamp-2 text-sm leading-snug font-medium">
                  {subject.name}
                </p>
                <div className="mt-0.5 flex flex-wrap items-center gap-1">
                  {/* Stage badge is desktop-only — the phone card is too
                      narrow to carry both it and the grade. */}
                  <Badge
                    variant="secondary"
                    className="hidden px-1.5 py-0 text-[10px] sm:inline-flex"
                  >
                    {levelLabel(subject.level, lang)}
                  </Badge>
                  {subject.grades.length > 0 && (
                    <Badge
                      variant="outline"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {gradesText(subject.grades, lang, gradeCountry)}
                    </Badge>
                  )}
                </div>
                {subject.averageRating > 0 && (
                  <StarRating
                    rating={subject.averageRating}
                    size="sm"
                    showCount
                    count={subject.ratingCount}
                    className="mt-0.5"
                  />
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function SubjectThumb({
  imageUrl,
  name,
  color,
}: {
  imageUrl: string | null
  name: string
  color: string | null
}) {
  const [failed, setFailed] = useState(false)
  const onError = useCallback(() => setFailed(true), [])
  const showImage = imageUrl && !failed

  return (
    <div
      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-s-lg @sm:h-16 @sm:w-16"
      style={{ backgroundColor: color ?? "#6b7280" }}
    >
      {showImage && (
        <BlurImage
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="192px"
          quality={100}
          onError={onError}
          unoptimized={imageUrl.startsWith("https://")}
        />
      )}
    </div>
  )
}
