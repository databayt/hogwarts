"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check } from "lucide-react"

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

function PlayTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="96.69 30.35 93.5 97.51"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M113.428 127.863c2.588 0 5.03-.733 8.448-2.686l60.302-35.01c4.883-2.88 8.008-6.103 8.008-11.084 0-4.98-3.125-8.203-8.008-11.035l-60.302-35.01c-3.418-2.002-5.86-2.685-8.448-2.685-5.566 0-10.742 4.248-10.742 11.67v74.17c0 7.422 5.176 11.67 10.742 11.67Z" />
    </svg>
  )
}

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

  const isRTL = lang === "ar"
  const catalogColor = course._catalog?.color
  const quizCount = course._catalog?.quizCount ?? 0
  const schoolName = course._catalog?.schoolName

  // Share URLs
  const shareUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.href)
      : ""
  const shareText = encodeURIComponent(course.title)

  // Scrollspy: track active chapter on scroll for sidebar indicator
  const [activeChapter, setActiveChapter] = useState<string | null>(
    course.chapters[0]?.id ?? null
  )

  useEffect(() => {
    if (course.chapters.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("chapter-", "")
            setActiveChapter(id)
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 rtl:lg:grid-flow-dense">
          {/* Left Column: Content */}
          <div className="space-y-6 rtl:lg:col-start-2">
            {/* Breadcrumb */}
            <nav
              className="flex items-center gap-1.5 text-sm"
              style={{ color: colors.muted }}
            >
              <Link
                href={`/${lang}/stream`}
                className="hover:underline"
                style={{ color: colors.muted }}
              >
                {schoolName || "Hogwarts"}
              </Link>
              <span>/</span>
              <Link
                href={`/${lang}/stream/courses`}
                className="hover:underline"
                style={{ color: colors.muted }}
              >
                {dict?.stream?.courseDetail?.courses ?? "Courses"}
              </Link>
            </nav>

            {/* Title */}
            <h1
              className="max-w-xs overflow-hidden text-start text-2xl font-semibold tracking-tight whitespace-nowrap sm:max-w-sm sm:text-3xl lg:text-4xl"
              style={{ color: colors.text }}
            >
              {course.title}
            </h1>

            {/* Description */}
            <p
              className="text-start text-base leading-relaxed"
              style={{ color: colors.muted }}
            >
              {course.description ||
                (dict?.stream?.courseDetail?.thisCourseDescription ??
                  "This comprehensive course is designed to take you from beginner to advanced level.")}
            </p>

            {/* CTA Row */}
            <div className="flex items-center gap-3">
              <CatalogEnrollmentButton
                catalogSubjectId={course.id}
                isEnrolled={isEnrolled}
                price={course.price}
                currency={course.currency}
                subjectSlug={course.slug}
                lang={lang}
              />
              {(!course.price || course.price === 0) && (
                <span
                  className="rounded-md px-3 py-1 text-sm font-medium"
                  style={{ backgroundColor: colors.card, color: colors.text }}
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
          <div className="space-y-0 rtl:lg:col-start-1">
            {/* Course Image / Hero */}
            <div
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-t-lg"
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
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                    unoptimized
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <PlayTriangleIcon className="size-10 text-white" />
                  </div>
                </>
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{
                    backgroundColor:
                      catalogColor || accentColors[0] || colors.card,
                  }}
                >
                  <PlayTriangleIcon className="size-10 text-white" />
                </div>
              )}
            </div>

            {/* Stats row */}
            <div
              className="mt-8 flex items-center justify-center gap-6 border-t px-1 pt-2 text-[11px]"
              style={{ borderColor: colors.border, color: colors.muted }}
            >
              <span>
                <strong
                  className="me-0.5 text-[13px]"
                  style={{ color: colors.text }}
                >
                  {totalLessons}
                </strong>{" "}
                {dict?.stream?.courseDetail?.lectures ?? "lectures"}
              </span>
              <span>
                <strong
                  className="me-0.5 text-[13px]"
                  style={{ color: colors.text }}
                >
                  {totalHours > 0
                    ? totalHours
                    : totalMinutes > 0
                      ? totalMinutes
                      : 0}
                </strong>{" "}
                {totalHours > 0
                  ? totalHours !== 1
                    ? (dict?.stream?.courseDetail?.hoursOfVideo ??
                      "hours of video")
                    : (dict?.stream?.courseDetail?.hourOfVideo ??
                      "hour of video")
                  : (dict?.stream?.courseDetail?.minOfVideo ?? "min of video")}
              </span>
              <span>
                <strong
                  className="me-0.5 text-[13px]"
                  style={{ color: colors.text }}
                >
                  {quizCount}
                </strong>{" "}
                {dict?.stream?.courseDetail?.quiz ?? "quiz"}
              </span>
              <span className="flex items-center gap-1">
                <Check
                  className="size-3.5"
                  style={{ color: colors.text }}
                  strokeWidth={3}
                />
                {dict?.stream?.courseDetail?.certificate ??
                  "Certificate of completion"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="bg-muted/50 rounded-xl p-6 sm:p-8">
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

          {/* Learning Objectives */}
          {(course.objectives.length > 0 || course.chapters.length > 0) && (
            <div className="mt-8">
              <h3
                className="text-lg font-semibold"
                style={{ color: colors.text }}
              >
                {dict?.stream?.courseDetail?.learningObjectives ??
                  "Learning objectives"}
              </h3>
              <p className="mt-2 text-sm" style={{ color: colors.muted }}>
                {dict?.stream?.courseDetail?.byTheEnd ??
                  "By the end of this course, you'll be able to:"}
              </p>
              <ul className="mt-3 list-disc space-y-1.5 ps-5">
                {(course.objectives.length > 0
                  ? course.objectives
                  : course.chapters.map((ch) => ch.title)
                ).map((item, idx) => (
                  <li
                    key={idx}
                    className="text-sm"
                    style={{ color: colors.text }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prerequisites */}
          <div className="mt-8">
            <h3
              className="text-lg font-semibold"
              style={{ color: colors.text }}
            >
              {dict?.stream?.courseDetail?.prerequisites ?? "Prerequisites"}
            </h3>
            <ul className="mt-3 list-disc space-y-1.5 ps-5">
              <li className="text-sm" style={{ color: colors.muted }}>
                {course.prerequisites ??
                  "No specific prerequisites. This course is designed for all skill levels."}
              </li>
            </ul>
          </div>

          {/* Who this course is for */}
          <div className="mt-8">
            <h3
              className="text-lg font-semibold"
              style={{ color: colors.text }}
            >
              {dict?.stream?.courseDetail?.whoThisCourseIsFor ??
                "Who this course is for"}
            </h3>
            <p className="mt-2 text-sm" style={{ color: colors.muted }}>
              {course.targetAudience ??
                "Students and learners of all levels interested in this subject."}
            </p>
          </div>
        </div>
      </section>

      {/* Course Sections — two-column layout with scrollspy sidebar */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2
          className="text-start text-2xl font-semibold sm:text-3xl"
          style={{ color: colors.text }}
        >
          {dict?.stream?.courseDetail?.chapters ?? "Chapters"}
        </h2>

        <div className="mt-6 flex gap-8">
          {/* Main content */}
          <div className="min-w-0 flex-1">
            <div className="space-y-8">
              {course.chapters.map((chapter) => {
                if (chapter.lessons.length === 0) return null
                return (
                  <section
                    key={chapter.id}
                    id={`chapter-${chapter.id}`}
                    className="scroll-mt-24 space-y-2"
                  >
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: colors.text }}
                    >
                      {chapter.title}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {chapter.lessons.map((lesson) => (
                        <CourseLessonCard
                          key={lesson.id}
                          lesson={lesson}
                          fallbackColor={catalogColor}
                          dict={dict}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>
          </div>

          {/* Sidebar nav */}
          <aside className="sticky top-24 hidden w-48 shrink-0 self-start lg:block">
            <p
              className="mb-2 text-sm font-semibold"
              style={{ color: colors.text }}
            >
              {course.title}
            </p>
            <nav className="relative">
              <span
                className="absolute start-0 top-3 bottom-3 border-s"
                style={{ borderColor: colors.border }}
              />
              {course.chapters.map((ch) => {
                const isActive = activeChapter === ch.id
                return (
                  <a
                    key={ch.id}
                    href={`#chapter-${ch.id}`}
                    className="relative flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                    style={{
                      color: isActive ? colors.text : colors.muted,
                    }}
                  >
                    {isActive && (
                      <span
                        className="absolute start-[-5px] top-1/2 size-2.5 -translate-y-1/2 rounded-full"
                        style={{
                          backgroundColor: colors.text,
                        }}
                      />
                    )}
                    <span className="line-clamp-1">{ch.title}</span>
                  </a>
                )
              })}
            </nav>
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
              currency={course.currency}
              subjectSlug={course.slug}
              lang={lang}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CourseLessonCard — horizontal row: thumbnail + title + duration
// ---------------------------------------------------------------------------

function CourseLessonCard({
  lesson,
  fallbackColor,
  dict,
}: {
  lesson: {
    id: string
    title: string
    duration: number | null
    imageUrl: string | null
    isFree: boolean
  }
  fallbackColor: string | null | undefined
  dict: any
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
            alt={lesson.title}
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
        <p
          className="line-clamp-2 text-sm leading-snug font-medium"
          style={{ color: colors.text }}
        >
          {lesson.title}
        </p>
        {lesson.duration != null && lesson.duration > 0 && (
          <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>
            {lesson.duration} min
          </p>
        )}
        {lesson.isFree && (
          <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>
            {dict?.stream?.courseDetail?.preview ?? "Preview"}
          </p>
        )}
      </div>
    </div>
  )
}
