"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookOpen, ChevronRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

// ---------------------------------------------------------------------------
// Types (exported for catalog-hero.tsx and catalog-chapters.tsx)
// ---------------------------------------------------------------------------

export interface CatalogLessonItem {
  id: string
  name: string
  slug: string
  description: string | null
  durationMinutes: number | null
  videoCount: number
  resourceCount: number
  imageUrl: string | null
}

export interface CatalogChapterItem {
  id: string
  name: string
  slug: string
  description: string | null
  totalLessons: number
  imageUrl: string | null
  lessons: CatalogLessonItem[]
}

export interface CatalogSubjectSummary {
  name: string
  slug: string
  description: string | null
  department: string
  color: string | null
  heroImageUrl: string | null
  imageUrl: string | null
  levels: string[]
  grades: number[]
  totalChapters: number
  totalLessons: number
  averageRating: number
  usageCount: number
  ratingCount: number
}

interface Props {
  subject: CatalogSubjectSummary
  chapters: CatalogChapterItem[]
  lang: Locale
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogDetailContent({ subject, chapters, lang }: Props) {
  const isRTL = lang === "ar"
  const scrollRef = useRef<HTMLDivElement>(null)

  const t = useMemo(
    () => ({
      topics: isRTL
        ? "\u0627\u0644\u0645\u0648\u0627\u0636\u064a\u0639"
        : "Topics",
      seeAll: isRTL ? "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" : "See all",
      exploreAll: isRTL
        ? "\u0627\u0633\u062a\u0643\u0634\u0641 \u0643\u0644 \u0627\u0644\u0645\u0648\u0627\u0636\u064a\u0639"
        : "Explore all topics",
      noTopics: isRTL
        ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0648\u0627\u0636\u064a\u0639 \u0645\u062a\u0627\u062d\u0629"
        : "No topics available",
    }),
    [isRTL]
  )

  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = 280
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }, [])

  return chapters.length > 0 ? (
    <>
      {/* Topics heading + See all */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{t.topics}</h2>
        <Link
          href={`${subject.slug}/chapters`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors hover:underline"
        >
          {t.seeAll}
        </Link>
      </div>

      {/* Horizontal scrollable topic cards */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1"
        >
          <ExploreAllCard
            label={t.exploreAll}
            color={subject.color}
            imageUrl={subject.imageUrl}
            href={`${subject.slug}/chapters`}
          />

          {chapters.map((ch) => (
            <TopicCard key={ch.id} chapter={ch} fallbackColor={subject.color} />
          ))}
        </div>

        {/* Far-right scroll arrow */}
        <button
          onClick={() => scroll("right")}
          className="bg-background/80 hover:bg-background border-border absolute end-0 top-1/2 z-10 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </button>
      </div>
    </>
  ) : (
    <Card>
      <CardContent className="py-8 text-center">
        <BookOpen className="text-muted-foreground mx-auto h-12 w-12" />
        <p className="text-muted-foreground mt-4">{t.noTopics}</p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ExploreAllCard — horizontal pill card (now a Link)
// ---------------------------------------------------------------------------

function ExploreAllCard({
  label,
  color,
  imageUrl,
  href,
}: {
  label: string
  color: string | null
  imageUrl: string | null
  href: string
}) {
  const [failed, setFailed] = useState(false)
  const onError = useCallback(() => setFailed(true), [])

  return (
    <Link
      href={href}
      className="hover:bg-muted/50 flex w-52 shrink-0 items-center gap-3 overflow-hidden rounded-lg border text-start transition-colors"
    >
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-s-lg"
        style={{ backgroundColor: color ?? "#6b7280" }}
      >
        {imageUrl && !failed && (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            quality={100}
            sizes="56px"
            onError={onError}
            unoptimized
          />
        )}
      </div>
      <span className="text-muted-foreground line-clamp-2 pe-3 text-sm font-medium">
        {label}
      </span>
    </Link>
  )
}

// ---------------------------------------------------------------------------
// TopicCard — horizontal pill card (chapter thumbnail in scroll row)
// ---------------------------------------------------------------------------

function TopicCard({
  chapter,
  fallbackColor,
}: {
  chapter: CatalogChapterItem
  fallbackColor: string | null
}) {
  const [failed, setFailed] = useState(false)
  const onError = useCallback(() => setFailed(true), [])

  return (
    <a
      href={`#chapter-${chapter.slug}`}
      className="hover:bg-muted/50 flex w-52 shrink-0 items-center gap-3 overflow-hidden rounded-lg border transition-colors"
    >
      <div
        className="relative h-14 w-14 shrink-0 overflow-hidden rounded-s-lg"
        style={{ backgroundColor: fallbackColor ?? "#6b7280" }}
      >
        {chapter.imageUrl && !failed && (
          <Image
            src={chapter.imageUrl}
            alt={chapter.name}
            fill
            className="object-cover"
            quality={100}
            sizes="56px"
            onError={onError}
            unoptimized
          />
        )}
      </div>
      <span className="line-clamp-2 pe-3 text-sm font-medium">
        {chapter.name}
      </span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// ChapterSection (exported for catalog-chapters.tsx)
// ---------------------------------------------------------------------------

export function ChapterSection({
  chapter,
  subjectColor,
  t,
}: {
  chapter: CatalogChapterItem
  subjectColor: string | null
  t: { min: string; videos: string; resources: string }
}) {
  if (chapter.lessons.length === 0) return null

  return (
    <section id={`chapter-${chapter.slug}`} className="scroll-mt-24 space-y-2">
      <h2 className="text-lg font-semibold">{chapter.name}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {chapter.lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            fallbackColor={subjectColor}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// LessonCard — horizontal row: thumbnail + name + stats
// ---------------------------------------------------------------------------

function LessonCard({
  lesson,
  fallbackColor,
  t,
}: {
  lesson: CatalogLessonItem
  fallbackColor: string | null
  t: { min: string; videos: string; resources: string }
}) {
  const [failed, setFailed] = useState(false)
  const onError = useCallback(() => setFailed(true), [])

  return (
    <div className="group hover:bg-muted/50 flex items-start gap-3 rounded-md transition-colors">
      {/* Thumbnail */}
      <div
        className="relative h-18 w-18 shrink-0 overflow-hidden rounded-sm transition-[border-radius] group-hover:rounded-e-none"
        style={{ backgroundColor: fallbackColor ?? "#6b7280" }}
      >
        {lesson.imageUrl && !failed && (
          <Image
            src={lesson.imageUrl}
            alt={lesson.name}
            fill
            className="object-cover"
            quality={100}
            sizes="72px"
            onError={onError}
            unoptimized
          />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 pt-1">
        <p className="line-clamp-2 text-sm leading-snug font-medium">
          {lesson.name}
        </p>
        {(lesson.videoCount > 0 || lesson.resourceCount > 0) && (
          <p className="text-muted-foreground mt-1 text-[10px]">
            {lesson.videoCount > 0 && `${lesson.videoCount} ${t.videos}`}
            {lesson.videoCount > 0 && lesson.resourceCount > 0 && " \u00b7 "}
            {lesson.resourceCount > 0 &&
              `${lesson.resourceCount} ${t.resources}`}
          </p>
        )}
        {lesson.durationMinutes && (
          <p className="text-muted-foreground mt-0.5 text-xs">
            {lesson.durationMinutes} {t.min}
          </p>
        )}
      </div>
    </div>
  )
}
