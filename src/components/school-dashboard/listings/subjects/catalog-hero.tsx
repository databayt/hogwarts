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

import type { SubjectSummary } from "./catalog-detail"

// ---------------------------------------------------------------------------
// Grade label helper
// ---------------------------------------------------------------------------

function gradeLabel(g: number, lang: "en" | "ar"): string {
  if (lang === "ar") return `\u0627\u0644\u0635\u0641 ${g.toLocaleString(lang)}`
  return `Grade ${g}`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  subject: SubjectSummary
  gradeSiblings?: { grade: number; slug: string }[]
  lang: Locale
  /**
   * Base path for grade-sibling pill links; the sibling slug is appended.
   * Defaults to the school-dashboard subjects route; the public /community
   * surface passes `/${lang}/community` so grade switching stays public. Must
   * be a plain string — this is a client component, so a function prop can't
   * cross the server/client boundary.
   */
  gradeBasePath?: string
}

export function CatalogHero({
  subject,
  gradeSiblings = [],
  lang,
  gradeBasePath = `/${lang}/subjects`,
}: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined
  const [heroFailed, setHeroFailed] = useState(false)
  const onHeroError = useCallback(() => setHeroFailed(true), [])

  const t = useMemo(
    () => ({
      chapters: cat?.chapters || "Chapters",
      lessons: cat?.lessons || "lessons",
    }),
    [cat]
  )

  const langCode = lang === "ar" ? "ar" : "en"

  return (
    <>
      {/* Hero Banner */}
      {/* min-h keeps the 5.4:1 strip readable on narrow screens: below ~864px
          the min-height wins and the art crops, above it the ratio takes over. */}
      <div
        className="relative aspect-[5.4/1] min-h-40 overflow-hidden"
        style={{ backgroundColor: subject.color ?? "#1e40af" }}
      >
        {subject.heroImageUrl && !heroFailed && (
          <Image
            src={subject.heroImageUrl}
            alt={subject.name}
            fill
            className="object-cover rtl:[transform:scaleX(-1)]"
            priority
            quality={100}
            sizes="100vw"
            onError={onHeroError}
            unoptimized
          />
        )}
        {/* Scrim — the art is bright, white text needs a floor to sit on */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-start drop-shadow-md sm:p-6">
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            {subject.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/90">
            <span>
              {subject.totalChapters} {t.chapters} &bull; {subject.totalLessons}{" "}
              {t.lessons}
            </span>
            {subject.averageRating > 0 && (
              <StarRating
                rating={subject.averageRating}
                size="sm"
                showCount
                count={subject.ratingCount}
                className="[&_button]:text-yellow-300 [&_span]:text-white/90"
              />
            )}
          </div>
        </div>
      </div>

      {/* Grade Toggle */}
      {gradeSiblings.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {gradeSiblings.map(({ grade, slug: siblingSlug }) => {
            const isActive = siblingSlug === subject.slug
            return isActive ? (
              <Badge key={grade} variant="default">
                {gradeLabel(grade, langCode)}
              </Badge>
            ) : (
              <Link key={grade} href={`${gradeBasePath}/${siblingSlug}`}>
                <Badge
                  variant="secondary"
                  className="hover:bg-muted cursor-pointer"
                >
                  {gradeLabel(grade, langCode)}
                </Badge>
              </Link>
            )
          })}
        </div>
      )}

      <hr className="border-border" />
    </>
  )
}
