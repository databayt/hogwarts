// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <section>
      <Skeleton className="h-6 w-48" />
      <Separator className="my-3" />
      <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
        {Array.from({ length: rows * 2 }).map((_, i) => (
          <div key={i} className="space-y-1 py-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-36" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ApplicationDetailLoading() {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:gap-12">
      {/* Sidebar — 30% */}
      <div className="w-full space-y-4 md:w-[30%] md:shrink-0">
        {/* Avatar */}
        <Skeleton className="h-52 w-52 rounded-full" />
        {/* Name + Badge */}
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        {/* Contact info */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-36" />
        </div>
        <Separator className="!w-52" />
        {/* Action buttons */}
        <div className="space-y-2">
          <Skeleton className="h-9 w-52" />
          <Skeleton className="h-9 w-52" />
        </div>
      </div>

      {/* Main Content — 70% */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-72" />
          <Skeleton className="h-9 w-28" />
        </div>

        {/* Personal Information */}
        <SectionSkeleton rows={3} />
        {/* Guardian Information */}
        <SectionSkeleton rows={6} />
        {/* Academic Information */}
        <SectionSkeleton rows={4} />
        {/* Merit & Scores */}
        <SectionSkeleton rows={3} />
        {/* Admission & Payment */}
        <SectionSkeleton rows={4} />
        {/* Review */}
        <SectionSkeleton rows={3} />
        {/* Documents */}
        <section>
          <Skeleton className="h-6 w-48" />
          <Separator className="my-3" />
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-24 rounded-md" />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
