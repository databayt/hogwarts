"use client"

import { useCallback, useMemo, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookOpen, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CatalogLessonItem {
  id: string
  name: string
  slug: string
  description: string | null
  durationMinutes: number | null
  imageUrl: string | null
}

interface CatalogChapterItem {
  id: string
  name: string
  slug: string
  description: string | null
  totalLessons: number
  imageUrl: string | null
  lessons: CatalogLessonItem[]
}

interface CatalogSubjectSummary {
  name: string
  slug: string
  description: string | null
  department: string
  color: string | null
  heroImageUrl: string | null
  levels: string[]
  totalChapters: number
  totalLessons: number
}

interface Props {
  subject: CatalogSubjectSummary
  chapters: CatalogChapterItem[]
  lang: Locale
}

// ---------------------------------------------------------------------------
// Level label map
// ---------------------------------------------------------------------------

const LEVEL_LABELS: Record<string, { en: string; ar: string }> = {
  ELEMENTARY: { en: "Elementary", ar: "ابتدائي" },
  MIDDLE: { en: "Middle", ar: "متوسط" },
  HIGH: { en: "High", ar: "ثانوي" },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CatalogDetailContent({ subject, chapters, lang }: Props) {
  const isRTL = lang === "ar"
  const scrollRef = useRef<HTMLDivElement>(null)

  const t = useMemo(
    () => ({
      topics: isRTL ? "المواضيع" : "Topics",
      lessons: isRTL ? "دروس" : "lessons",
      seeAll: isRTL ? "عرض الكل" : "See all",
      exploreAll: isRTL ? "استكشف كل المواضيع" : "Explore all topics",
      noTopics: isRTL ? "لا توجد مواضيع متاحة" : "No topics available",
      subjects: isRTL ? "المواد" : "Subjects",
      min: isRTL ? "د" : "min",
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

  // First level label for breadcrumb
  const firstLevel = subject.levels[0]
  const firstLevelLabel = firstLevel
    ? (LEVEL_LABELS[firstLevel]?.[isRTL ? "ar" : "en"] ?? firstLevel)
    : null

  return (
    <div className="space-y-5">
      {/* 1. Hero Banner -- full-width, no rounded corners */}
      <div
        className="relative h-36 overflow-hidden sm:h-40 md:h-48"
        style={{ backgroundColor: subject.color ?? "#1e40af" }}
      >
        {subject.heroImageUrl && (
          <Image
            src={subject.heroImageUrl}
            alt={subject.name}
            fill
            className="object-cover"
            priority
            quality={100}
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-start sm:p-6">
          <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
            {subject.name}
          </h1>
          <p className="mt-1 text-sm text-white/80">
            {subject.totalChapters} {t.topics} &bull; {subject.totalLessons}{" "}
            {t.lessons}
          </p>
        </div>
      </div>

      {/* 2. Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${lang}/subjects`}>{t.subjects}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {firstLevelLabel && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${lang}/subjects/${firstLevel?.toLowerCase()}`}>
                    {firstLevelLabel}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{subject.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 3. Level Badges */}
      {subject.levels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subject.levels.map((level) => (
            <Badge key={level} variant="secondary">
              {LEVEL_LABELS[level]?.[isRTL ? "ar" : "en"] ?? level}
            </Badge>
          ))}
        </div>
      )}

      {/* 4. Topics heading + See all */}
      {chapters.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t.topics}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="size-5 rtl:rotate-180" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="size-5 rtl:rotate-180" />
              </button>
              <a
                href="#all-chapters"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {t.seeAll}
              </a>
            </div>
          </div>

          {/* 5. Horizontal scrollable topic cards */}
          <div
            ref={scrollRef}
            className="scrollbar-none -mx-1 flex gap-4 overflow-x-auto px-1 pb-2"
          >
            {/* Explore all topics card */}
            <ExploreAllCard label={t.exploreAll} color={subject.color} />

            {chapters.map((ch) => (
              <TopicCard
                key={ch.id}
                chapter={ch}
                fallbackColor={subject.color}
              />
            ))}
          </div>
        </>
      )}

      {/* 6. Chapter sections */}
      <div id="all-chapters" className="scroll-mt-20 space-y-8">
        {chapters.length > 0 ? (
          chapters.map((chapter) => (
            <ChapterSection
              key={chapter.id}
              chapter={chapter}
              subjectColor={subject.color}
              t={t}
            />
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <BookOpen className="text-muted-foreground mx-auto h-12 w-12" />
              <p className="text-muted-foreground mt-4">{t.noTopics}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ExploreAllCard
// ---------------------------------------------------------------------------

function ExploreAllCard({
  label,
  color,
}: {
  label: string
  color: string | null
}) {
  return (
    <a
      href="#all-chapters"
      className="group flex w-40 shrink-0 flex-col items-center gap-3"
    >
      <div
        className="flex size-24 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        style={{ backgroundColor: color ?? "#6b7280" }}
      >
        <Grid3X3 className="size-8 text-white/80" />
      </div>
      <span className="text-muted-foreground group-hover:text-foreground line-clamp-2 text-center text-sm transition-colors">
        {label}
      </span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// TopicCard (chapter thumbnail card in horizontal row)
// ---------------------------------------------------------------------------

function TopicCard({
  chapter,
  fallbackColor,
}: {
  chapter: CatalogChapterItem
  fallbackColor: string | null
}) {
  return (
    <a
      href={`#chapter-${chapter.slug}`}
      className="group flex w-40 shrink-0 flex-col items-center gap-3"
    >
      <div
        className="relative size-24 overflow-hidden rounded-xl transition-transform group-hover:scale-105"
        style={
          !chapter.imageUrl
            ? { backgroundColor: fallbackColor ?? "#6b7280" }
            : undefined
        }
      >
        {chapter.imageUrl ? (
          <Image
            src={chapter.imageUrl}
            alt={chapter.name}
            fill
            className="object-cover"
            quality={100}
            sizes="96px"
          />
        ) : (
          <span className="flex size-full items-center justify-center text-xl font-bold text-white/60">
            {chapter.name.charAt(0)}
          </span>
        )}
      </div>
      <span className="text-muted-foreground group-hover:text-foreground line-clamp-2 text-center text-sm transition-colors">
        {chapter.name}
      </span>
    </a>
  )
}

// ---------------------------------------------------------------------------
// ChapterSection
// ---------------------------------------------------------------------------

function ChapterSection({
  chapter,
  subjectColor,
  t,
}: {
  chapter: CatalogChapterItem
  subjectColor: string | null
  t: { min: string }
}) {
  if (chapter.lessons.length === 0) return null

  return (
    <section id={`chapter-${chapter.slug}`} className="scroll-mt-24 space-y-4">
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
// LessonCard
// ---------------------------------------------------------------------------

function LessonCard({
  lesson,
  fallbackColor,
  t,
}: {
  lesson: CatalogLessonItem
  fallbackColor: string | null
  t: { min: string }
}) {
  return (
    <div className="group overflow-hidden rounded-lg border">
      <div
        className="bg-muted relative aspect-video overflow-hidden"
        style={
          !lesson.imageUrl
            ? { backgroundColor: fallbackColor ?? "#6b7280" }
            : undefined
        }
      >
        {lesson.imageUrl ? (
          <Image
            src={lesson.imageUrl}
            alt={lesson.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            quality={100}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white/60">
            {lesson.name.charAt(0)}
          </span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-3">
          <h4 className="line-clamp-2 text-sm font-medium text-white">
            {lesson.name}
          </h4>
          {(lesson.description || lesson.durationMinutes) && (
            <p className="mt-1 line-clamp-1 text-xs text-white/70">
              {lesson.durationMinutes
                ? `${lesson.durationMinutes} ${t.min}`
                : lesson.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
