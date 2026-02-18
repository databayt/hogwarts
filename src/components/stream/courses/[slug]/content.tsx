"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Star,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { CatalogEnrollmentButton } from "@/components/stream/courses/enrollment/catalog-enrollment-button"
import type { CatalogIndividualCourseType } from "@/components/stream/data/catalog/get-course"

// Skilljar color palette
const colors = {
  background: "#faf9f5",
  card: "#f0eee6",
  text: "#141413",
  muted: "#5e5b4e",
  border: "#e5e2d9",
  accentBlue: "#b4c6d4",
  accentPurple: "#c5bfd9",
  accentSage: "#b5c5c0",
}

const accentColors = [colors.accentBlue, colors.accentPurple, colors.accentSage]

// Social icons as inline SVGs
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

interface Props {
  dictionary: any
  lang: string
  schoolId: string | null
  course: CatalogIndividualCourseType
  isEnrolled: boolean
}

export function StreamCourseDetailContent({
  dictionary,
  lang,
  schoolId,
  course,
  isEnrolled,
}: Props) {
  const { dictionary: dict } = useDictionary()
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null)
  const [activeChapter, setActiveChapter] = useState<string | null>(
    course.chapters[0]?.id ?? null
  )
  const scrollRef = useRef<HTMLDivElement>(null)

  const totalLessons = course.chapters.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0
  )

  const totalDuration = course.chapters.reduce(
    (total, chapter) =>
      total +
      chapter.lessons.reduce((sum, lesson) => sum + (lesson.duration || 0), 0),
    0
  )

  const totalHours = Math.floor(totalDuration / 60)
  const totalMinutes = totalDuration % 60

  const toggleChapter = (chapterId: string) => {
    setExpandedChapter(expandedChapter === chapterId ? null : chapterId)
  }

  const isRTL = lang === "ar"
  const catalogColor = course._catalog?.color

  // Scroll horizontal topic cards
  const scroll = useCallback((direction: "left" | "right") => {
    if (!scrollRef.current) return
    const amount = 280
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }, [])

  // Track active chapter via IntersectionObserver for sidebar
  useEffect(() => {
    if (course.chapters.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveChapter(entry.target.id.replace("chapter-", ""))
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    for (const ch of course.chapters) {
      const el = document.getElementById(`chapter-${ch.id}`)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [course.chapters])

  // Share URLs
  const shareUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.href)
      : ""
  const shareText = encodeURIComponent(course.title)

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 rtl:lg:grid-flow-dense">
          {/* Left Column: Content */}
          <div className="space-y-6 rtl:lg:col-start-2">
            {/* Category Badge */}
            {course.category?.name && (
              <span
                className="text-sm font-medium"
                style={{ color: colors.muted }}
              >
                {course.category.name}
              </span>
            )}

            {/* Title */}
            <h1
              className="text-start text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
              style={{ color: colors.text }}
            >
              {course.title}
            </h1>

            {/* Description */}
            {course.description && (
              <p
                className="text-start text-lg leading-relaxed"
                style={{ color: colors.muted }}
              >
                {course.description}
              </p>
            )}

            {/* Rating + Enrollment Count */}
            {(course._catalog?.averageRating ?? 0) > 0 && (
              <div className="flex items-center gap-2">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  {course._catalog?.averageRating?.toFixed(1)}
                </span>
                <span className="text-sm" style={{ color: colors.muted }}>
                  ({course._count.enrollments} {isRTL ? "مسجل" : "enrolled"})
                </span>
              </div>
            )}

            {/* CTA Row */}
            <div className="flex flex-wrap items-center gap-4 rtl:flex-row-reverse">
              <CatalogEnrollmentButton
                catalogSubjectId={course.id}
                isEnrolled={isEnrolled}
                price={course.price}
                subjectSlug={course.slug}
                lang={lang}
              />
              {(!course.price || course.price === 0) && (
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  {dict?.stream?.courseDetail?.free ?? "FREE"}
                </span>
              )}
            </div>

            {/* Already registered */}
            {!isEnrolled && (
              <p className="text-sm" style={{ color: colors.muted }}>
                {dict?.stream?.courseDetail?.alreadyRegistered ??
                  "Already registered?"}{" "}
                <Link
                  href={`/${lang}/auth/login`}
                  className="underline hover:no-underline"
                  style={{ color: colors.text }}
                >
                  {dict?.stream?.courseDetail?.signIn ?? "Sign In"}
                </Link>
              </p>
            )}

            {/* Share Buttons */}
            <div className="flex items-center gap-4 pt-2 rtl:flex-row-reverse">
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline rtl:flex-row-reverse"
                style={{ color: colors.text }}
              >
                <XIcon className="size-4" />
                <span>
                  {dict?.stream?.courseDetail?.shareOnX ?? "Share on X"}
                </span>
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm hover:underline rtl:flex-row-reverse"
                style={{ color: colors.text }}
              >
                <LinkedInIcon className="size-4" />
                <span>
                  {dict?.stream?.courseDetail?.shareOnLinkedIn ??
                    "Share on LinkedIn"}
                </span>
              </a>
            </div>
          </div>

          {/* Right Column: Image + Stats */}
          <div className="space-y-4 rtl:lg:col-start-1">
            {/* Course Image / Hero */}
            <div
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl"
              style={{
                backgroundColor: catalogColor || colors.card,
              }}
            >
              {course.imageUrl ? (
                <>
                  <Image
                    src={course.imageUrl}
                    alt={course.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                    <PlayCircle
                      className="size-16 text-white"
                      strokeWidth={1.5}
                    />
                  </div>
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <BookOpen
                    className="size-16"
                    style={{ color: colors.muted }}
                  />
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div
              className="flex flex-wrap items-center justify-center gap-6 rounded-lg p-4 rtl:flex-row-reverse"
              style={{ backgroundColor: colors.card }}
            >
              <div className="text-center">
                <span
                  className="block text-2xl font-semibold"
                  style={{ color: colors.text }}
                >
                  {totalLessons}
                </span>
                <span className="text-sm" style={{ color: colors.muted }}>
                  {dict?.stream?.courseDetail?.lectures ?? "lectures"}
                </span>
              </div>
              <div className="text-center">
                <span
                  className="block text-2xl font-semibold"
                  style={{ color: colors.text }}
                >
                  {totalHours > 0
                    ? totalHours
                    : totalMinutes > 0
                      ? totalMinutes
                      : 0}
                </span>
                <span className="text-sm" style={{ color: colors.muted }}>
                  {totalHours > 0
                    ? totalHours !== 1
                      ? (dict?.stream?.courseDetail?.hoursOfVideo ??
                        "hours of video")
                      : (dict?.stream?.courseDetail?.hourOfVideo ??
                        "hour of video")
                    : (dict?.stream?.courseDetail?.minOfVideo ??
                      "min of video")}
                </span>
              </div>
              <div className="text-center">
                <span
                  className="block text-2xl font-semibold"
                  style={{ color: colors.text }}
                >
                  <Award className="mx-auto size-6" />
                </span>
                <span className="text-sm" style={{ color: colors.muted }}>
                  {dict?.stream?.courseDetail?.certificate ?? "Certificate"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Horizontal Scrollable Topic Cards */}
      {course.chapters.length > 3 && (
        <section className="mx-auto max-w-6xl px-4 pb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-xl font-semibold"
              style={{ color: colors.text }}
            >
              {dict?.stream?.courseDetail?.topics ?? "Topics"}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <ChevronLeft
                  className="size-5"
                  style={{ color: colors.muted }}
                />
              </button>
              <button
                onClick={() => scroll("right")}
                className="rounded-full p-1 transition-colors hover:bg-gray-100"
              >
                <ChevronRight
                  className="size-5"
                  style={{ color: colors.muted }}
                />
              </button>
            </div>
          </div>
          <div
            ref={scrollRef}
            className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-2"
          >
            {course.chapters.map((chapter) => (
              <a
                key={chapter.id}
                href={`#chapter-${chapter.id}`}
                className="flex w-60 shrink-0 flex-col overflow-hidden rounded-lg border transition-shadow hover:shadow-md"
                style={{ borderColor: colors.border }}
              >
                <div
                  className="relative h-28 overflow-hidden"
                  style={{
                    backgroundColor: chapter.color || catalogColor || "#e5e7eb",
                  }}
                >
                  {chapter.imageUrl && (
                    <Image
                      src={chapter.imageUrl}
                      alt={chapter.title}
                      fill
                      className="object-cover"
                      sizes="240px"
                    />
                  )}
                </div>
                <div className="p-3">
                  <p
                    className="line-clamp-2 text-sm font-medium"
                    style={{ color: colors.text }}
                  >
                    {chapter.title}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: colors.muted }}>
                    {chapter.lessons.length}{" "}
                    {chapter.lessons.length === 1
                      ? (dict?.stream?.courseDetail?.lesson ?? "lesson")
                      : (dict?.stream?.courseDetail?.lessons ?? "lessons")}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div
          className="rounded-xl p-6 sm:p-8"
          style={{ backgroundColor: colors.card }}
        >
          <h2
            className="text-start text-2xl font-semibold sm:text-3xl"
            style={{ color: colors.text }}
          >
            {dict?.stream?.courseDetail?.aboutThisCourse ?? "About this course"}
          </h2>
          <p
            className="mt-4 text-start leading-relaxed"
            style={{ color: colors.text }}
          >
            {course.description ||
              (dict?.stream?.courseDetail?.thisCourseDescription ??
                "This comprehensive course is designed to take you from beginner to advanced level.")}
          </p>
        </div>
      </section>

      {/* Course Sections with Sidebar */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2
          className="text-start text-2xl font-semibold sm:text-3xl"
          style={{ color: colors.text }}
        >
          {dict?.stream?.courseDetail?.courseSections ?? "Course sections"}
        </h2>

        <div className="mt-6 flex gap-8">
          {/* Main content */}
          <div className="min-w-0 flex-1 space-y-4">
            {course.chapters.map((chapter, index) => {
              const isExpanded = expandedChapter === chapter.id
              const accentColor =
                chapter.color || accentColors[index % accentColors.length]

              return (
                <div
                  key={chapter.id}
                  id={`chapter-${chapter.id}`}
                  className="scroll-mt-20 overflow-hidden rounded-xl bg-white"
                  style={{ borderTop: `3px solid ${accentColor}` }}
                >
                  {/* Chapter Header with Image */}
                  <button
                    onClick={() => toggleChapter(chapter.id)}
                    className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 rtl:flex-row-reverse"
                  >
                    <div className="flex items-center gap-4 rtl:flex-row-reverse">
                      {/* Chapter Thumbnail */}
                      {chapter.imageUrl && (
                        <div
                          className="relative size-12 shrink-0 overflow-hidden rounded-lg"
                          style={{ backgroundColor: accentColor }}
                        >
                          <Image
                            src={chapter.imageUrl}
                            alt={chapter.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-3 rtl:flex-row-reverse">
                        {isExpanded ? (
                          <ChevronDown
                            className="size-5"
                            style={{ color: colors.muted }}
                          />
                        ) : isRTL ? (
                          <ChevronRight
                            className="size-5 rotate-180"
                            style={{ color: colors.muted }}
                          />
                        ) : (
                          <ChevronRight
                            className="size-5"
                            style={{ color: colors.muted }}
                          />
                        )}
                        <div className="text-start">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: colors.text }}
                          >
                            {chapter.title}
                          </h3>
                          <p
                            className="text-sm"
                            style={{ color: colors.muted }}
                          >
                            {chapter.lessons.length}{" "}
                            {chapter.lessons.length === 1
                              ? (dict?.stream?.courseDetail?.lesson ?? "lesson")
                              : (dict?.stream?.courseDetail?.lessons ??
                                "lessons")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Chapter Description */}
                  {chapter.description && !isExpanded && (
                    <div
                      className="px-6 pb-6 text-start"
                      style={{ color: colors.muted }}
                    >
                      <p className="text-sm">{chapter.description}</p>
                    </div>
                  )}

                  {/* Expanded Lessons with Thumbnails */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div
                          className="border-t px-6 pb-6"
                          style={{ borderColor: colors.border }}
                        >
                          {chapter.description && (
                            <p
                              className="py-4 text-start text-sm"
                              style={{ color: colors.muted }}
                            >
                              {chapter.description}
                            </p>
                          )}
                          <div className="space-y-2">
                            {chapter.lessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50 rtl:flex-row-reverse"
                              >
                                <div className="flex items-center gap-3 rtl:flex-row-reverse">
                                  {/* Lesson Thumbnail */}
                                  {lesson.imageUrl ? (
                                    <div className="relative size-10 shrink-0 overflow-hidden rounded">
                                      <Image
                                        src={lesson.imageUrl}
                                        alt={lesson.title}
                                        fill
                                        className="object-cover"
                                        sizes="40px"
                                      />
                                    </div>
                                  ) : (
                                    <PlayCircle
                                      className="size-4 shrink-0"
                                      style={{ color: colors.muted }}
                                    />
                                  )}
                                  <span
                                    className="text-sm"
                                    style={{ color: colors.text }}
                                  >
                                    {lesson.title}
                                  </span>
                                  {lesson.isFree && (
                                    <span
                                      className="text-xs underline"
                                      style={{ color: colors.muted }}
                                    >
                                      {dict?.stream?.courseDetail?.preview ??
                                        "Preview"}
                                    </span>
                                  )}
                                </div>
                                {lesson.duration && (
                                  <span
                                    className="text-sm"
                                    style={{ color: colors.muted }}
                                  >
                                    {Math.floor(lesson.duration / 60) > 0 &&
                                      `${Math.floor(lesson.duration / 60)}:`}
                                    {String(lesson.duration % 60).padStart(
                                      2,
                                      "0"
                                    )}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>

          {/* Sidebar Nav — lg+ only */}
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <p className="mb-3 font-semibold" style={{ color: colors.text }}>
                {course.title}
              </p>
              <nav
                className="relative border-s"
                style={{ borderColor: colors.border }}
              >
                {course.chapters.map((ch) => {
                  const isActive = activeChapter === ch.id
                  return (
                    <a
                      key={ch.id}
                      href={`#chapter-${ch.id}`}
                      className={cn(
                        "relative -ms-px flex items-center gap-2 border-s-2 px-4 py-2 text-sm transition-colors",
                        isActive
                          ? "border-primary text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground border-transparent"
                      )}
                    >
                      <span
                        className={cn(
                          "size-2 shrink-0 rounded-full",
                          isActive ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                      />
                      <span className="line-clamp-1">{ch.title}</span>
                    </a>
                  )
                })}
              </nav>
            </div>
          </aside>
        </div>
      </section>

      {/* Bottom CTA for mobile */}
      <section
        className="sticky bottom-0 border-t p-4 lg:hidden"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.border,
        }}
      >
        <div className="flex items-center justify-between gap-4 rtl:flex-row-reverse">
          <div>
            {(!course.price || course.price === 0) && (
              <span className="font-semibold" style={{ color: colors.text }}>
                {dict?.stream?.courseDetail?.free ?? "FREE"}
              </span>
            )}
          </div>
          <div className="flex-1">
            <CatalogEnrollmentButton
              catalogSubjectId={course.id}
              isEnrolled={isEnrolled}
              price={course.price}
              subjectSlug={course.slug}
              lang={lang}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
