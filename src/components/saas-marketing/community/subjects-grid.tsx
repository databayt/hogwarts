// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { BlurImage } from "@/components/atom/blur-image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import { gradeRangeLabel } from "@/lib/grade"
import type { Locale } from "@/components/internationalization/config"

import type { CommunitySubjectCard } from "./types"

interface Props {
  subjects: CommunitySubjectCard[]
  lang: Locale
}

/**
 * Server-rendered subject grid for /community.
 *
 * We fork the school-dashboard's `<SubjectsGrid>` here (rather than reuse it)
 * because the school version hardcodes `/${lang}/subjects/${slug}` hrefs and
 * needs to live in a client component for `useDictionary()`. The community
 * version routes to `/${lang}/community/${slug}` instead and renders fully on
 * the server (no client JS needed for a static grid).
 *
 * Layout mirrors the school grid (4 cols on lg, 64×64 thumb + name + level
 * badge + grade badge + star rating).
 */
export function CommunitySubjectsGrid({ subjects, lang }: Props) {
  if (subjects.length === 0) return null

  // Pre-sort: lowest grade first, then alphabetical within grade.
  const sorted = [...subjects].sort((a, b) => {
    const gradeA = a.grades[0] ?? 0
    const gradeB = b.grades[0] ?? 0
    if (gradeA !== gradeB) return gradeA - gradeB
    return a.name.localeCompare(b.name, lang === "ar" ? "ar" : "en")
  })

  return (
    <div className="@container">
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4">
        {sorted.map((subject) => (
          <Link
            key={subject.id}
            href={`/${lang}/community/${subject.slug}`}
            className="hover:bg-muted/50 flex items-center gap-3 overflow-hidden rounded-lg border transition-colors"
          >
            <div
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-s-lg"
              style={{ backgroundColor: subject.color ?? "#6b7280" }}
            >
              {subject.imageUrl ? (
                <BlurImage
                  src={subject.imageUrl}
                  alt={subject.name}
                  fill
                  className="object-cover"
                  sizes="192px"
                  quality={100}
                  unoptimized={subject.imageUrl.startsWith("https://")}
                />
              ) : null}
            </div>

            <div className="min-w-0 pe-3">
              <p className="line-clamp-2 text-sm leading-snug font-medium">
                {subject.name}
              </p>
              <div className="mt-0.5 flex items-center gap-1.5">
                {subject.level ? (
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {levelLabel(subject.level, lang)}
                  </Badge>
                ) : null}
                {subject.grades.length > 0 ? (
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {gradeLabel(subject.grades, lang)}
                  </Badge>
                ) : null}
              </div>
              {subject.averageRating > 0 ? (
                <StarRating
                  rating={subject.averageRating}
                  size="sm"
                  showCount
                  count={subject.ratingCount}
                  className="mt-0.5"
                />
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const LEVEL_LABELS: Record<string, Record<string, string>> = {
  ELEMENTARY: { en: "Elementary", ar: "ابتدائي" },
  MIDDLE: { en: "Middle", ar: "متوسط" },
  HIGH: { en: "High", ar: "ثانوي" },
}

function levelLabel(level: string, lang: Locale): string {
  return LEVEL_LABELS[level]?.[lang] ?? level
}

function gradeLabel(grades: number[], lang: Locale): string | null {
  if (grades.length === 0) return null
  return gradeRangeLabel(grades, { lang })
}
