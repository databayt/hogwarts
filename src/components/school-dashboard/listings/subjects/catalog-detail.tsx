"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { StarRating } from "@/components/ui/star-rating"
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
  const [activeChapter, setActiveChapter] = useState<string | null>(
    chapters[0]?.slug ?? null
  )
  const [heroFailed, setHeroFailed] = useState(false)
  const onHeroError = useCallback(() => setHeroFailed(true), [])

  const t = useMemo(
    () => ({
      topics: isRTL ? "المواضيع" : "Topics",
      lessons: isRTL ? "دروس" : "lessons",
      seeAll: isRTL ? "عرض الكل" : "See all",
      exploreAll: isRTL ? "استكشف كل المواضيع" : "Explore all topics",
      noTopics: isRTL ? "لا توجد مواضيع متاحة" : "No topics available",
      subjects: isRTL ? "المواد" : "Subjects",
      min: isRTL ? "د" : "min",
      videos: isRTL ? "فيديوهات" : "videos",
      resources: isRTL ? "موارد" : "resources",
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

  // Track active chapter on scroll for sidebar indicator
  useEffect(() => {
    if (chapters.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const slug = entry.target.id.replace("chapter-", "")
            setActiveChapter(slug)
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    for (const ch of chapters) {
      const el = document.getElementById(`chapter-${ch.slug}`)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [chapters])

  // First level label for breadcrumb
  const firstLevel = subject.levels[0]
  const firstLevelLabel = firstLevel
    ? (LEVEL_LABELS[firstLevel]?.[isRTL ? "ar" : "en"] ?? firstLevel)
    : null

  return (
    <div className="space-y-5">
      {/* 1. Hero Banner -- full-width, no rounded corners */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: subject.color ?? "#1e40af" }}
      >
        {subject.heroImageUrl && !heroFailed ? (
          <Image
            src={subject.heroImageUrl}
            alt={subject.name}
            width={2048}
            height={378}
            className="block h-auto w-full"
            priority
            quality={100}
            sizes="100vw"
            onError={onHeroError}
          />
        ) : (
          <div className="aspect-[5.4/1]" />
        )}
        <div className="absolute inset-x-0 bottom-0 p-4 text-start sm:p-6">
          <h1 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
            {subject.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/80">
            <span>
              {subject.totalChapters} {t.topics} &bull; {subject.totalLessons}{" "}
              {t.lessons}
            </span>
            {subject.averageRating > 0 && (
              <StarRating
                rating={subject.averageRating}
                size="sm"
                showCount
                count={subject.ratingCount}
                className="[&_button]:text-yellow-300 [&_span]:text-white/70"
              />
            )}
          </div>
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
          <div className="relative">
            <div
              ref={scrollRef}
              className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-2"
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
      )}

      {/* 6. Chapter sections with sidebar nav */}
      <div id="all-chapters" className="scroll-mt-20">
        {chapters.length > 0 ? (
          <div className="flex gap-8">
            {/* Main content */}
            <div className="min-w-0 flex-1 space-y-8">
              {chapters.map((chapter) => (
                <ChapterSection
                  key={chapter.id}
                  chapter={chapter}
                  subjectColor={subject.color}
                  t={t}
                />
              ))}
            </div>

            {/* Sidebar nav — lg+ only */}
            <aside className="hidden w-56 shrink-0 lg:block">
              <div className="sticky top-24">
                <p className="mb-3 font-semibold">{subject.name}</p>
                <nav className="border-border relative border-s">
                  {chapters.map((ch) => {
                    const isActive = activeChapter === ch.slug
                    return (
                      <a
                        key={ch.id}
                        href={`#chapter-${ch.slug}`}
                        className={`relative -ms-px flex items-center gap-2 border-s-2 px-4 py-2 text-sm transition-colors ${
                          isActive
                            ? "border-primary text-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground border-transparent"
                        }`}
                      >
                        <span
                          className={`size-2 shrink-0 rounded-full ${
                            isActive ? "bg-primary" : "bg-muted-foreground/30"
                          }`}
                        />
                        <span className="line-clamp-1">{ch.name}</span>
                      </a>
                    )
                  })}
                </nav>
              </div>
            </aside>
          </div>
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
// ExploreAllCard — horizontal pill card
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
      className="hover:bg-muted/50 flex w-52 shrink-0 items-center gap-3 overflow-hidden rounded-lg border transition-colors"
    >
      <div
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-s-lg"
        style={{ backgroundColor: color ?? "#6b7280" }}
      >
        <Grid3X3 className="size-6 text-white/80" />
      </div>
      <span className="text-muted-foreground line-clamp-2 pe-3 text-sm font-medium">
        {label}
      </span>
    </a>
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
// ChapterSection
// ---------------------------------------------------------------------------

function ChapterSection({
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
    <section id={`chapter-${chapter.slug}`} className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{chapter.name}</h2>
        <span className="text-muted-foreground text-sm">
          {chapter.lessons.length} {t.videos}
        </span>
      </div>
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
  t: { min: string }
}) {
  const [failed, setFailed] = useState(false)
  const onError = useCallback(() => setFailed(true), [])

  return (
    <div className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border p-2 transition-colors">
      {/* Thumbnail */}
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg"
        style={{ backgroundColor: fallbackColor ?? "#6b7280" }}
      >
        {lesson.imageUrl && !failed && (
          <Image
            src={lesson.imageUrl}
            alt={lesson.name}
            fill
            className="object-cover"
            quality={100}
            sizes="64px"
            onError={onError}
          />
        )}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm leading-snug font-medium">
          {lesson.name}
        </p>
        {(lesson.durationMinutes || lesson.description) && (
          <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
            {lesson.durationMinutes
              ? `${lesson.durationMinutes} ${t.min}`
              : lesson.description}
          </p>
        )}
      </div>
    </div>
  )
}
