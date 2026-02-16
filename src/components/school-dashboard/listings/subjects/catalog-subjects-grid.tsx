"use client"

import { useMemo } from "react"
import Image from "next/image"
import Link from "next/link"

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
            {/* Thumbnail - flush to card edge, rounded outer, sharp inner */}
            <div
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-s-lg"
              style={{ backgroundColor: subject.color ?? "#6b7280" }}
            >
              {subject.imageUrl ? (
                <Image
                  src={subject.imageUrl}
                  alt={subject.name}
                  fill
                  className="object-cover"
                  sizes="192px"
                  quality={100}
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                  {subject.name.charAt(0)}
                </span>
              )}
            </div>

            {/* Name */}
            <p className="line-clamp-2 pe-3 leading-snug font-medium">
              {subject.name}
            </p>
          </Link>
        )
      })}
    </div>
  )
}
