"use client"

import * as React from "react"
import Image from "next/image"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"

import { getSubjectImage } from "./image-map"

interface SubjectHeroProps {
  /** Subject name (English) */
  subjectName: string
  /** Subject name (Arabic) */
  subjectNameAr?: string | null
  /** Number of topics/lessons (optional) */
  topicsCount?: number
  /** Number of resources (optional) */
  resourcesCount?: number
  /** Current locale */
  lang: Locale
}

/**
 * SubjectHero - Compact hero banner for subject detail page
 *
 * Features:
 * - Compact illustrated header
 * - Subject name overlay with gradient
 * - Stats display (topics, resources)
 * - RTL support for Arabic
 */
export function SubjectHero({
  subjectName,
  subjectNameAr,
  topicsCount = 0,
  resourcesCount = 0,
  lang,
}: SubjectHeroProps) {
  const isRTL = lang === "ar"
  const displayName = isRTL && subjectNameAr ? subjectNameAr : subjectName
  const imageUrl = getSubjectImage(subjectName)

  const t = {
    topics: isRTL ? "موضوع" : "topics",
    resources: isRTL ? "مورد" : "resources",
  }

  return (
    <div className="bg-muted relative h-48 overflow-hidden rounded-xl sm:h-56 md:h-64">
      <Image
        src={imageUrl}
        alt={displayName}
        fill
        className="object-cover"
        priority
        quality={90}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 p-4",
          isRTL ? "text-right" : "text-left"
        )}
      >
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          {displayName}
        </h1>

        {(topicsCount > 0 || resourcesCount > 0) && (
          <p className="mt-1 text-sm text-white/80">
            {topicsCount > 0 && `${topicsCount} ${t.topics}`}
            {topicsCount > 0 && resourcesCount > 0 && " • "}
            {resourcesCount > 0 && `${resourcesCount} ${t.resources}`}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * Loading skeleton for SubjectHero
 */
export function SubjectHeroSkeleton() {
  return <Skeleton className="h-48 w-full rounded-xl sm:h-56 md:h-64" />
}
