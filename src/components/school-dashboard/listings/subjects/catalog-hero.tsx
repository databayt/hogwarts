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

import type { CatalogSubjectSummary } from "./catalog-detail"

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
  subject: CatalogSubjectSummary
  gradeSiblings?: { grade: number; slug: string }[]
  lang: Locale
}

export function CatalogHero({ subject, gradeSiblings = [], lang }: Props) {
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
              {subject.totalChapters} {t.chapters} &bull; {subject.totalLessons}{" "}
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
              <Link key={grade} href={`/${lang}/subjects/${siblingSlug}`}>
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
