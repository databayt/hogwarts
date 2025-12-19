"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
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
 * SubjectHero - ClickView-style hero banner for subject detail page
 *
 * Features:
 * - Full-width colorful illustrated header
 * - Subject name overlay with gradient
 * - Stats display (topics, resources)
 * - Breadcrumb navigation
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
    subjects: isRTL ? "المواد" : "Subjects",
    topics: isRTL ? "موضوع" : "topics",
    resources: isRTL ? "مورد" : "resources",
  }

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList className={cn(isRTL && "flex-row-reverse")}>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${lang}/subjects`}>{t.subjects}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className={cn(isRTL && "rotate-180")} />
          <BreadcrumbItem>
            <BreadcrumbPage>{displayName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Hero Banner */}
      <div className="bg-muted relative h-48 overflow-hidden rounded-2xl sm:h-64 lg:h-80">
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-6",
            isRTL ? "text-right" : "text-left"
          )}
        >
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {displayName}
          </h1>

          {(topicsCount > 0 || resourcesCount > 0) && (
            <p className="mt-2 text-white/80">
              {topicsCount > 0 && `${topicsCount} ${t.topics}`}
              {topicsCount > 0 && resourcesCount > 0 && " • "}
              {resourcesCount > 0 && `${resourcesCount} ${t.resources}`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Loading skeleton for SubjectHero
 */
export function SubjectHeroSkeleton() {
  return (
    <div className="space-y-4">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Hero skeleton */}
      <Skeleton className="h-48 w-full rounded-2xl sm:h-64 lg:h-80" />
    </div>
  )
}
