"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"

import { getSubjectImage } from "./image-map"

interface SubjectCardProps {
  /** Subject ID for linking */
  id: string
  /** Subject name (English) */
  name: string
  /** Subject name (Arabic) */
  nameAr?: string | null
  /** Current locale */
  lang: Locale
  /** Optional badge text (e.g., "new content") */
  badge?: string
  /** Additional class names */
  className?: string
}

/**
 * SubjectCard - ClickView-style image card for subjects grid
 *
 * Features:
 * - Square aspect ratio with rounded corners
 * - Colorful illustrated subject image
 * - Subject name below image (centered)
 * - Optional badge overlay
 * - Hover scale effect
 * - RTL support for Arabic names
 */
function SubjectCardInner({
  id,
  name,
  nameAr,
  lang,
  badge,
  className,
}: SubjectCardProps) {
  const isRTL = lang === "ar"
  const displayName = isRTL && nameAr ? nameAr : name
  const imageUrl = getSubjectImage(name)

  return (
    <Link
      href={`/${lang}/subjects/${id}`}
      className={cn("group block", className)}
    >
      {/* Image Container - Compact with rounded corners */}
      <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-xl">
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
        />

        {/* Badge overlay (optional) */}
        {badge && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="bg-background/90 text-xs">
              {badge}
            </Badge>
          </div>
        )}
      </div>

      {/* Subject Name - Below image, centered */}
      <div className={cn("mt-2 text-center", isRTL && "text-right")}>
        <h3 className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
          {displayName}
        </h3>
      </div>
    </Link>
  )
}

export const SubjectCard = React.memo(SubjectCardInner)

/**
 * Loading skeleton for SubjectCard
 */
export function SubjectCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      <div className="mt-2 flex justify-center">
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  )
}

/**
 * Grid of subject card skeletons for loading state
 */
export function SubjectGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SubjectCardSkeleton key={i} />
      ))}
    </>
  )
}
