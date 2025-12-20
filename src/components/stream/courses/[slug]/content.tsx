"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  Award,
  BookOpen,
  ChevronDown,
  ChevronRight,
  PlayCircle,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { EnrollmentButton } from "@/components/stream/courses/enrollment/button"
import { IndividualCourseType } from "@/components/stream/data/course/get-course"

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
  course: IndividualCourseType
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

  // Mock data for learning objectives and prerequisites
  const learningObjectives = [
    "Master the fundamentals and core concepts",
    "Build real-world projects from scratch",
    "Learn industry best practices and patterns",
    "Gain practical, hands-on experience",
    "Understand advanced techniques and methods",
    "Apply knowledge to solve complex problems",
  ]

  const prerequisites = [
    "No previous experience required - we start from basics",
    "Eagerness and motivation to learn",
    "A computer with internet access",
  ]

  // Share URLs
  const shareUrl =
    typeof window !== "undefined"
      ? encodeURIComponent(window.location.href)
      : ""
  const shareText = encodeURIComponent(course.title)

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 rtl:lg:grid-flow-dense">
          {/* Left Column: Content */}
          <div className="space-y-6 rtl:lg:col-start-2">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm rtl:flex-row-reverse">
              <Link
                href={`/${lang}/stream`}
                className="hover:underline"
                style={{ color: colors.muted }}
              >
                {dict?.stream?.courseDetail?.home ?? "Home"}
              </Link>
              <span style={{ color: colors.muted }}>/</span>
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

            {/* CTA Row */}
            <div className="flex flex-wrap items-center gap-4 rtl:flex-row-reverse">
              {isEnrolled ? (
                <Link
                  href={`/${lang}/stream/dashboard/${course.slug}`}
                  className="block"
                >
                  <Button
                    className="h-12 px-8 text-base font-medium"
                    style={{
                      backgroundColor: colors.text,
                      color: colors.background,
                    }}
                  >
                    {dict?.stream?.courseDetail?.continueLearning ??
                      "Continue Learning"}
                  </Button>
                </Link>
              ) : (
                <EnrollmentButton courseId={course.id} lang={lang} />
              )}
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

          {/* Right Column: Video + Stats */}
          <div className="space-y-4 rtl:lg:col-start-1">
            {/* Video Preview */}
            <div
              className="group relative aspect-video cursor-pointer overflow-hidden rounded-xl"
              style={{ backgroundColor: colors.card }}
            >
              {course.imageUrl ? (
                <>
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                    <div className="text-center text-white">
                      <PlayCircle
                        className="mx-auto size-16"
                        strokeWidth={1.5}
                      />
                    </div>
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

          {/* Learning Objectives */}
          <h3
            className="mt-8 text-start text-xl font-semibold"
            style={{ color: colors.text }}
          >
            {dict?.stream?.courseDetail?.learningObjectives ??
              "Learning objectives"}
          </h3>
          <p className="mt-2 text-start" style={{ color: colors.muted }}>
            {dict?.stream?.courseDetail?.byTheEnd ??
              "By the end of this course, you'll be able to:"}
          </p>
          <ul className="mt-4 space-y-2 text-start">
            {learningObjectives.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rtl:flex-row-reverse"
              >
                <span style={{ color: colors.muted }}>•</span>
                <span style={{ color: colors.text }}>{item}</span>
              </li>
            ))}
          </ul>

          {/* Prerequisites */}
          <h3
            className="mt-8 text-start text-xl font-semibold"
            style={{ color: colors.text }}
          >
            {dict?.stream?.courseDetail?.prerequisites ?? "Prerequisites"}
          </h3>
          <ul className="mt-4 space-y-2 text-start">
            {prerequisites.map((item, index) => (
              <li
                key={index}
                className="flex items-start gap-2 rtl:flex-row-reverse"
              >
                <span style={{ color: colors.muted }}>•</span>
                <span style={{ color: colors.text }}>{item}</span>
              </li>
            ))}
          </ul>

          {/* Who this course is for */}
          <h3
            className="mt-8 text-start text-xl font-semibold"
            style={{ color: colors.text }}
          >
            {dict?.stream?.courseDetail?.whoThisCourseIsFor ??
              "Who this course is for"}
          </h3>
          <p className="mt-2 text-start" style={{ color: colors.text }}>
            {dict?.stream?.courseDetail?.learnersDescription ??
              "Learners who want to accelerate their workflow with AI assistance"}
          </p>
        </div>
      </section>

      {/* Course Sections */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2
          className="text-start text-2xl font-semibold sm:text-3xl"
          style={{ color: colors.text }}
        >
          {dict?.stream?.courseDetail?.courseSections ?? "Course sections"}
        </h2>
        <div className="mt-6 space-y-4">
          {course.chapters.map((chapter, index) => {
            const isExpanded = expandedChapter === chapter.id
            const chapterDuration = chapter.lessons.reduce(
              (sum, lesson) => sum + (lesson.duration || 0),
              0
            )
            const accentColor = accentColors[index % accentColors.length]

            return (
              <div
                key={chapter.id}
                className="overflow-hidden rounded-xl bg-white"
                style={{ borderTop: `3px solid ${accentColor}` }}
              >
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="flex w-full items-center justify-between p-6 transition-colors hover:bg-gray-50 rtl:flex-row-reverse"
                >
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
                      <p className="text-sm" style={{ color: colors.muted }}>
                        {chapter.lessons.length}{" "}
                        {chapter.lessons.length === 1
                          ? (dict?.stream?.courseDetail?.lesson ?? "lesson")
                          : (dict?.stream?.courseDetail?.lessons ?? "lessons")}
                      </p>
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

                {/* Expanded Lessons */}
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
                                <PlayCircle
                                  className="size-4"
                                  style={{ color: colors.muted }}
                                />
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
      </section>

      {/* Instructor Section */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2
          className="text-start text-2xl font-semibold sm:text-3xl"
          style={{ color: colors.text }}
        >
          {dict?.stream?.courseDetail?.instructor ?? "Instructor"}
        </h2>
        <div className="mt-6 flex items-start gap-4 rtl:flex-row-reverse">
          <div
            className="size-16 shrink-0 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.card }}
          >
            <div
              className="flex h-full w-full items-center justify-center text-xl font-semibold"
              style={{ color: colors.muted }}
            >
              CI
            </div>
          </div>
          <div className="text-start">
            <h3 className="font-semibold" style={{ color: colors.text }}>
              {dict?.stream?.courseDetail?.courseInstructor ??
                "Course Instructor"}
            </h3>
            <p className="mt-1 text-sm" style={{ color: colors.muted }}>
              {dict?.stream?.courseDetail?.trainingProfessionals ??
                "Training Professionals of Tomorrow"}
            </p>
          </div>
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
          {isEnrolled ? (
            <Link
              href={`/${lang}/stream/dashboard/${course.slug}`}
              className="flex-1"
            >
              <Button
                className="h-12 w-full text-base font-medium"
                style={{
                  backgroundColor: colors.text,
                  color: colors.background,
                }}
              >
                {dict?.stream?.courseDetail?.continueLearning ??
                  "Continue Learning"}
              </Button>
            </Link>
          ) : (
            <div className="flex-1">
              <EnrollmentButton courseId={course.id} lang={lang} />
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
