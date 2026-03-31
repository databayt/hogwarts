"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Image from "next/image"
import Link from "next/link"
import { Play } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import type { ContinueWatchingItem } from "@/components/stream/data/catalog/get-continue-watching"

interface Props {
  items: ContinueWatchingItem[]
  lang: string
  dictionary?: Record<string, any>
}

function formatRemaining(watchedSeconds: number, totalSeconds: number): string {
  const remainSec = Math.max(0, totalSeconds - watchedSeconds)
  const remainMin = Math.ceil(remainSec / 60)
  if (remainMin >= 60)
    return `${Math.floor(remainMin / 60)}h ${remainMin % 60}m left`
  return `${remainMin}m left`
}

export function ContinueWatchingSection({ items, lang, dictionary }: Props) {
  if (items.length === 0) return null

  const d = dictionary?.continueWatching

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">
        {d?.title || "Continue Watching"}
      </h2>
      <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
        {items.map((item) => (
          <Link
            key={item.lessonId}
            href={`/${lang}/stream/courses/${item.courseSlug}/${item.lessonId}`}
            className="group relative w-64 shrink-0 overflow-hidden rounded-lg"
          >
            {/* Thumbnail */}
            <div
              className="relative aspect-video"
              style={{ backgroundColor: item.color || "#1a1a1a" }}
            >
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.lessonTitle}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="256px"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="size-8 text-white/60" />
                </div>
              )}

              {/* Play overlay on hover */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                <Play className="size-10 fill-white text-white opacity-0 transition-opacity group-hover:opacity-100" />
              </div>

              {/* Progress bar at bottom */}
              <div className="absolute inset-x-0 bottom-0">
                <Progress
                  value={item.progressPercent}
                  className="h-1 rounded-none bg-white/20"
                />
              </div>
            </div>

            {/* Info */}
            <div className="bg-card p-2.5">
              <p className="line-clamp-1 text-sm font-medium">
                {item.lessonTitle}
              </p>
              <div className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs">
                <span>
                  C{item.chapterPosition} L{item.lessonPosition}
                </span>
                <span>&middot;</span>
                <span className="line-clamp-1">{item.courseTitle}</span>
              </div>
              <p className="text-muted-foreground mt-1 text-xs">
                {formatRemaining(item.watchedSeconds, item.totalSeconds)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
