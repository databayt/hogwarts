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
  /** Subject name */
  name: string
  /** Current locale */
  lang: Locale
  /** Optional badge text (e.g., "new content") */
  badge?: string
  /** Additional class names */
  className?: string
}

/**
 * SubjectCard - Compact horizontal card for subjects grid
 *
 * Features:
 * - Small image with text in a row
 * - Rounded corners
 * - Optional badge overlay
 * - Hover effects
 * - RTL support for Arabic names
 */
function SubjectCardInner({
  id,
  name,
  lang,
  badge,
  className,
}: SubjectCardProps) {
  const displayName = name
  const imageUrl = getSubjectImage(name)

  return (
    <Link
      href={`/${lang}/subjects/${id}`}
      className={cn(
        "group hover:bg-muted/50 flex items-center gap-3 rounded-lg border transition-colors rtl:flex-row-reverse",
        className
      )}
    >
      {/* Image - rounded on outer edge, sharp on text side */}
      <div
        className={cn(
          "bg-muted relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-s-lg"
        )}
      >
        <Image
          src={imageUrl}
          alt={displayName}
          fill
          className="object-cover"
          sizes="56px"
        />

        {/* Badge overlay (optional) */}
        {badge && (
          <div className="absolute -top-1 -right-1">
            <Badge
              variant="secondary"
              className="bg-background/90 h-4 px-1 text-[10px]"
            >
              {badge}
            </Badge>
          </div>
        )}
      </div>

      {/* Subject Name - Beside image */}
      <h3 className="text-foreground group-hover:text-primary text-sm font-medium transition-colors">
        {displayName}
      </h3>
    </Link>
  )
}

export const SubjectCard = React.memo(SubjectCardInner)

/**
 * Loading skeleton for SubjectCard
 */
export function SubjectCardSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border">
      <Skeleton className="h-14 w-14 flex-shrink-0 rounded-s-lg" />
      <Skeleton className="h-4 w-24" />
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
