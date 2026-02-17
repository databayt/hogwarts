"use client"

import { useCallback, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { StarRating } from "@/components/ui/star-rating"
import type { Locale } from "@/components/internationalization/config"

export interface CatalogSubjectItem {
  id: string
  slug: string
  name: string
  department: string
  levels: string[]
  color: string | null
  imageUrl: string | null
  totalChapters: number
  totalLessons: number
  averageRating: number
  usageCount: number
  ratingCount: number
}

interface Props {
  subjects: CatalogSubjectItem[]
  lang: Locale
}

export function CatalogSubjectsGrid({ subjects, lang }: Props) {
  const isRTL = lang === "ar"

  const noResults = isRTL ? "لا توجد مواد" : "No subjects found"

  const sorted = useMemo(() => {
    return [...subjects].sort((a, b) =>
      a.name.localeCompare(b.name, isRTL ? "ar" : "en")
    )
  }, [subjects, isRTL])

  if (sorted.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        {noResults}
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

            {/* Name + Rating */}
            <div className="min-w-0 pe-3">
              <p className="line-clamp-2 leading-snug font-medium">
                {subject.name}
              </p>
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
        />
      )}
    </div>
  )
}
