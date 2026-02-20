"use client"

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"

import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import type { Locale } from "@/components/internationalization/config"

import type { CatalogSubjectSummary } from "./catalog-detail"

// ---------------------------------------------------------------------------
// Grade label helpers
// ---------------------------------------------------------------------------

function gradeLabel(g: number, lang: "en" | "ar"): string {
  if (lang === "ar")
    return `\u0627\u0644\u0635\u0641 ${g.toLocaleString("ar-EG")}`
  return `Grade ${g}`
}

function levelsToGrades(levels: string[]): number[] {
  const result = new Set<number>()
  for (const level of levels) {
    switch (level) {
      case "ELEMENTARY":
        for (let i = 1; i <= 6; i++) result.add(i)
        break
      case "MIDDLE":
        for (let i = 7; i <= 9; i++) result.add(i)
        break
      case "HIGH":
        for (let i = 10; i <= 12; i++) result.add(i)
        break
    }
  }
  return Array.from(result).sort((a, b) => a - b)
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  subject: CatalogSubjectSummary
  lang: Locale
}

export function CatalogHero({ subject, lang }: Props) {
  const isRTL = lang === "ar"
  const [heroFailed, setHeroFailed] = useState(false)
  const onHeroError = useCallback(() => setHeroFailed(true), [])

  const t = useMemo(
    () => ({
      topics: isRTL
        ? "\u0627\u0644\u0645\u0648\u0627\u0636\u064a\u0639"
        : "Topics",
      lessons: isRTL ? "\u062f\u0631\u0648\u0633" : "lessons",
    }),
    [isRTL]
  )

  const grades =
    subject.grades.length > 0 ? subject.grades : levelsToGrades(subject.levels)

  return (
    <>
      {/* Hero Banner */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: subject.color ?? "#1e40af" }}
      >
        {subject.heroImageUrl && !heroFailed ? (
          <Image
            src={subject.heroImageUrl}
            alt={subject.name}
            width={2048}
            height={378}
            className="block h-auto w-full"
            priority
            quality={100}
            sizes="100vw"
            onError={onHeroError}
            unoptimized
          />
        ) : (
          <div className="aspect-[5.4/1]" />
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 text-start sm:p-6">
          <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
            {subject.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span>
              {subject.totalChapters} {t.topics} &bull; {subject.totalLessons}{" "}
              {t.lessons}
            </span>
            {subject.averageRating > 0 && (
              <StarRating
                rating={subject.averageRating}
                size="sm"
                showCount
                count={subject.ratingCount}
                className="[&_button]:text-yellow-300 [&_span]:text-white/70"
              />
            )}
          </div>
        </div>
      </div>

      {/* Grade Badges */}
      {grades.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {grades.map((g) => (
            <Badge key={g} variant="secondary">
              {gradeLabel(g, isRTL ? "ar" : "en")}
            </Badge>
          ))}
        </div>
      )}

      <hr className="border-border" />
    </>
  )
}
