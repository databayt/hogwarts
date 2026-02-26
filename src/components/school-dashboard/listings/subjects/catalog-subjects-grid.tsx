"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { StarRating } from "@/components/ui/star-rating"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

export interface CatalogSubjectItem {
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

interface Props {
  subjects: CatalogSubjectItem[]
  lang: Locale
}

export function CatalogSubjectsGrid({ subjects, lang }: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined

  const noResults = cat?.noSubjectsFound || "No subjects found"

  const sorted = useMemo(() => {
    return [...subjects].sort((a, b) =>
      a.name.localeCompare(b.name, lang === "ar" ? "ar" : "en")
    )
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
      <div className="grid grid-cols-1 gap-3 @sm:grid-cols-2 @2xl:grid-cols-3 @5xl:grid-cols-4">
        {sorted.map((subject) => {
          return (
            <Link
              key={subject.id}
              href={`/${lang}/subjects/${subject.slug}`}
              className="hover:bg-muted/50 flex items-center gap-3 overflow-hidden rounded-lg border transition-colors"
            >
              <SubjectThumb
                imageUrl={subject.imageUrl}
                name={subject.name}
                color={subject.color}
              />

              {/* Name + Level + Rating */}
              <div className="min-w-0 pe-3">
                <p className="line-clamp-2 text-sm leading-snug font-medium">
                  {subject.name}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <Badge
                    variant="secondary"
                    className="px-1.5 py-0 text-[10px]"
                  >
                    {levelLabel(subject.level, lang)}
                  </Badge>
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
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-s-lg"
      style={{ backgroundColor: color ?? "#6b7280" }}
    >
      {showImage && (
        <Image
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
