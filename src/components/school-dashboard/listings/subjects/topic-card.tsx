"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"

import { getSubjectImage } from "./image-map"

interface TopicCardProps {
  /** Lesson ID for linking */
  id: string
  /** Lesson title */
  title: string
  /** Lesson description (optional) */
  description?: string | null
  /** Current locale */
  lang: Locale
  /** Subject name for image mapping */
  subjectName: string
  /** Additional class names */
  className?: string
}

/**
 * TopicCard - ClickView-style topic card with image overlay
 *
 * Features:
 * - Aspect-video ratio with rounded corners
 * - Subject image as background
 * - Title overlay with gradient
 * - Hover scale effect
 * - RTL support
 */
function TopicCardInner({
  id,
  title,
  description,
  lang,
  subjectName,
  className,
}: TopicCardProps) {
  const imageUrl = getSubjectImage(subjectName)

  return (
    <Link
      href={`/${lang}/lessons/${id}`}
      className={cn("group block", className)}
    >
      <div className="bg-muted relative aspect-video overflow-hidden rounded-lg">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          quality={100}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h4 className="line-clamp-2 text-sm font-medium text-white">
            {title}
          </h4>
          {description && (
            <p className="mt-1 line-clamp-1 text-xs text-white/70">
              {description}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

export const TopicCard = React.memo(TopicCardInner)

/**
 * Loading skeleton for TopicCard
 */
export function TopicCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-video w-full rounded-lg" />
    </div>
  )
}

/**
 * Grid of topic card skeletons for loading state
 */
export function TopicGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <TopicCardSkeleton key={i} />
      ))}
    </>
  )
}
