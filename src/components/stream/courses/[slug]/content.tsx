"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import {
  Award,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Globe,
  PlayCircle,
  Smartphone,
  Star,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EnrollmentButton } from "@/components/stream/courses/enrollment/button"
import { IndividualCourseType } from "@/components/stream/data/course/get-course"

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
  const [expandedChapter, setExpandedChapter] = useState<string | null>(
    course.chapters[0]?.id || null
  )
  const [showFullDescription, setShowFullDescription] = useState(false)

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

  // Mock data for demonstration (these would come from your data model)
  const courseIncludes = [
    {
      icon: PlayCircle,
      text: `${totalHours > 0 ? `${totalHours}h ` : ""}${totalMinutes}m on-demand video`,
    },
    { icon: FileText, text: "3 articles" },
    { icon: Download, text: "5 downloadable resources" },
    { icon: Smartphone, text: "Access on mobile and TV" },
    { icon: Award, text: "Certificate of completion" },
  ]

  const whatYouWillLearn = [
    "Master the fundamentals and core concepts",
    "Build real-world projects from scratch",
    "Learn industry best practices and patterns",
    "Gain practical, hands-on experience",
    "Understand advanced techniques and methods",
    "Apply knowledge to solve complex problems",
  ]

  const requirements = [
    "No previous experience required - we start from basics",
    "Eagerness and motivation to learn",
    "A computer with internet access",
  ]

  return (
    <div className="min-h-screen">
      {/* Dark Header Bar - Sticky */}
      <div className="sticky top-0 z-40 hidden bg-[#1c1d1f] px-4 py-3 text-white lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h2 className="line-clamp-1 text-base font-bold">{course.title}</h2>
            <div className="mt-0.5 flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="font-bold text-[#f69c08]">4.6</span>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "size-3",
                        i < 4
                          ? "fill-[#f69c08] text-[#f69c08]"
                          : "fill-[#f69c08]/50 text-[#f69c08]/50"
                      )}
                    />
                  ))}
                </div>
                <span className="cursor-pointer text-[#cec0fc] underline">
                  (2,769 ratings)
                </span>
              </div>
              <span className="text-gray-300">
                {course._count?.enrollments || 0} students
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Content */}
          <div className="space-y-8 lg:col-span-2">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm">
              <Link
                href={`/${lang}/stream`}
                className="font-medium text-[#5624d0] hover:text-[#401b9c]"
              >
                Development
              </Link>
              <ChevronDown className="text-muted-foreground size-3 -rotate-90" />
              <Link
                href={`/${lang}/stream/courses`}
                className="font-medium text-[#5624d0] hover:text-[#401b9c]"
              >
                {course.category?.name || "Courses"}
              </Link>
            </nav>

            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-3xl leading-tight font-bold">
                {course.title}
              </h1>

              {course.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {course.description}
                </p>
              )}

              {/* Rating & Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Badge className="bg-[#eceb98] font-medium text-[#3d3c0a] hover:bg-[#eceb98]">
                  Bestseller
                </Badge>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-[#b4690e]">4.6</span>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-3.5",
                          i < 4
                            ? "fill-[#f69c08] text-[#f69c08]"
                            : "fill-[#f69c08]/50 text-[#f69c08]/50"
                        )}
                      />
                    ))}
                  </div>
                  <span className="cursor-pointer text-[#5624d0] underline">
                    (2,769 ratings)
                  </span>
                </div>
                <span className="text-muted-foreground">
                  {course._count?.enrollments || 0} students
                </span>
              </div>

              {/* Instructor & Meta Info */}
              <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span>
                  Created by{" "}
                  <Link
                    href="#instructor"
                    className="text-[#5624d0] underline hover:text-[#401b9c]"
                  >
                    Course Instructor
                  </Link>
                </span>
                <div className="flex items-center gap-1">
                  <Calendar className="size-4" />
                  <span>Last updated 12/2024</span>
                </div>
                <div className="flex items-center gap-1">
                  <Globe className="size-4" />
                  <span>{lang === "ar" ? "العربية" : "English"}</span>
                </div>
              </div>
            </div>

            {/* Mobile Preview Card - Shows on mobile only */}
            <div className="lg:hidden">
              <div className="border-border bg-card overflow-hidden rounded-lg border">
                {/* Video Preview */}
                <div className="bg-muted relative aspect-video">
                  {course.imageUrl ? (
                    <>
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="text-center text-white">
                          <PlayCircle className="mx-auto mb-2 size-16" />
                          <p className="font-medium">Preview this course</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="text-muted-foreground size-16" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-4">
                  {/* Price */}
                  <div className="text-3xl font-bold">
                    {course.price && course.price > 0 ? (
                      `$${course.price.toFixed(2)}`
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </div>

                  {/* Buttons */}
                  {isEnrolled ? (
                    <Link
                      href={`/${lang}/stream/dashboard/${course.slug}`}
                      className="block"
                    >
                      <Button className="h-12 w-full bg-[#5624d0] text-base font-bold hover:bg-[#401b9c]">
                        Continue Learning
                      </Button>
                    </Link>
                  ) : (
                    <EnrollmentButton courseId={course.id} lang={lang} />
                  )}

                  <p className="text-muted-foreground text-center text-sm">
                    30-Day Money-Back Guarantee
                  </p>
                </div>
              </div>
            </div>

            {/* What You'll Learn */}
            <div className="border-border rounded-lg border p-6">
              <h2 className="mb-4 text-xl font-bold">What you&apos;ll learn</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {whatYouWillLearn.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="text-muted-foreground mt-0.5 size-5 shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Explore Related Topics */}
            {course.category && (
              <div>
                <h2 className="mb-4 text-xl font-bold">
                  Explore related topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-2 font-normal"
                  >
                    {course.category.name}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full px-4 py-2 font-normal"
                  >
                    Development
                  </Badge>
                </div>
              </div>
            )}

            {/* This Course Includes - Mobile */}
            <div className="lg:hidden">
              <h2 className="mb-4 text-xl font-bold">This course includes:</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {courseIncludes.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <item.icon className="text-muted-foreground size-5" />
                    <span className="text-sm">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Content */}
            <div>
              <h2 className="mb-2 text-xl font-bold">Course content</h2>
              <div className="text-muted-foreground mb-4 flex items-center justify-between text-sm">
                <span>
                  {course.chapters.length} sections • {totalLessons} lectures •{" "}
                  {totalHours > 0 ? `${totalHours}h ` : ""}
                  {totalMinutes}m total length
                </span>
                <button
                  className="font-medium text-[#5624d0] hover:text-[#401b9c]"
                  onClick={() =>
                    setExpandedChapter(
                      expandedChapter ? null : course.chapters[0]?.id
                    )
                  }
                >
                  {expandedChapter
                    ? "Collapse all sections"
                    : "Expand all sections"}
                </button>
              </div>

              <div className="border-border overflow-hidden rounded-lg border">
                {course.chapters.map((chapter, index) => {
                  const isExpanded = expandedChapter === chapter.id
                  const chapterDuration = chapter.lessons.reduce(
                    (sum, lesson) => sum + (lesson.duration || 0),
                    0
                  )

                  return (
                    <div
                      key={chapter.id}
                      className={cn(index > 0 && "border-border border-t")}
                    >
                      {/* Chapter Header */}
                      <button
                        onClick={() => toggleChapter(chapter.id)}
                        className="bg-muted/50 hover:bg-muted flex w-full items-center justify-between px-4 py-4 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                          <span className="text-left font-semibold">
                            {chapter.title}
                          </span>
                        </div>
                        <span className="text-muted-foreground shrink-0 text-sm">
                          {chapter.lessons.length} lectures •{" "}
                          {Math.floor(chapterDuration / 60) > 0
                            ? `${Math.floor(chapterDuration / 60)}hr `
                            : ""}
                          {chapterDuration % 60}min
                        </span>
                      </button>

                      {/* Chapter Content */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-background">
                              {chapter.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="border-border/50 flex items-center justify-between border-t px-4 py-3"
                                >
                                  <div className="flex items-center gap-3">
                                    <PlayCircle className="text-muted-foreground size-4" />
                                    <span className="text-sm">
                                      {lesson.title}
                                    </span>
                                    {lesson.isFree && (
                                      <span className="cursor-pointer text-xs text-[#5624d0] underline">
                                        Preview
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-muted-foreground text-sm">
                                    {lesson.duration
                                      ? `${String(Math.floor(lesson.duration / 60)).padStart(2, "0")}:${String(lesson.duration % 60).padStart(2, "0")}`
                                      : "00:00"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h2 className="mb-4 text-xl font-bold">Requirements</h2>
              <ul className="space-y-2">
                {requirements.map((req, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Description */}
            <div>
              <h2 className="mb-4 text-xl font-bold">Description</h2>
              <div
                className={cn(
                  "text-sm leading-relaxed",
                  !showFullDescription && "line-clamp-6"
                )}
              >
                <p className="mb-4">
                  {course.description ||
                    "This comprehensive course is designed to take you from beginner to advanced level. You will learn all the essential concepts and gain practical experience through hands-on projects."}
                </p>
                <p className="mb-4">
                  Whether you're just starting out or looking to enhance your
                  existing skills, this course provides everything you need to
                  succeed. Our step-by-step approach ensures that you understand
                  each concept before moving on to the next.
                </p>
                <p>
                  By the end of this course, you'll have the confidence and
                  knowledge to apply what you've learned to real-world
                  scenarios. Join thousands of students who have already
                  transformed their careers with this course.
                </p>
              </div>
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-3 flex items-center gap-1 text-sm font-medium text-[#5624d0] hover:text-[#401b9c]"
              >
                Show {showFullDescription ? "less" : "more"}
                {showFullDescription ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>
            </div>

            {/* Instructor */}
            <div id="instructor">
              <h2 className="mb-4 text-xl font-bold">Instructor</h2>
              <div className="space-y-4">
                <div>
                  <Link
                    href="#"
                    className="text-lg font-bold text-[#5624d0] underline hover:text-[#401b9c]"
                  >
                    Course Instructor
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    Training Professionals of Tomorrow
                  </p>
                </div>

                <div className="flex items-start gap-4">
                  <div className="bg-muted size-24 shrink-0 overflow-hidden rounded-full">
                    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-3xl font-bold">
                      CI
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="text-muted-foreground size-4" />
                      <span>4.6 Instructor Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="text-muted-foreground size-4" />
                      <span>119,779 Reviews</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="text-muted-foreground size-4" />
                      <span>613,212 Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PlayCircle className="text-muted-foreground size-4" />
                      <span>46 Courses</span>
                    </div>
                  </div>
                </div>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Are you thinking about pursuing a career in this field? Do you
                  ever think that your career could take a leap forward if you
                  would have more knowledge and skills? This instructor has
                  helped thousands of students achieve their goals.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar - Desktop */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <div className="border-border bg-card overflow-hidden rounded-lg border shadow-lg">
                {/* Video Preview */}
                <div className="bg-muted group relative aspect-video cursor-pointer">
                  {course.imageUrl ? (
                    <>
                      <img
                        src={course.imageUrl}
                        alt={course.title}
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
                        <div className="text-center text-white">
                          <PlayCircle className="mx-auto mb-2 size-16" />
                          <p className="font-medium">Preview this course</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <BookOpen className="text-muted-foreground size-16" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-6">
                  {/* Price */}
                  <div className="text-3xl font-bold">
                    {course.price && course.price > 0 ? (
                      `$${course.price.toFixed(2)}`
                    ) : (
                      <span className="text-green-600">Free</span>
                    )}
                  </div>

                  {/* Buttons */}
                  {isEnrolled ? (
                    <Link
                      href={`/${lang}/stream/dashboard/${course.slug}`}
                      className="block"
                    >
                      <Button className="h-12 w-full bg-[#5624d0] text-base font-bold hover:bg-[#401b9c]">
                        Continue Learning
                      </Button>
                    </Link>
                  ) : (
                    <div className="space-y-3">
                      <EnrollmentButton courseId={course.id} lang={lang} />
                      <Button
                        variant="outline"
                        className="h-12 w-full text-base font-bold"
                      >
                        Add to cart
                      </Button>
                    </div>
                  )}

                  <p className="text-muted-foreground text-center text-xs">
                    30-Day Money-Back Guarantee
                  </p>
                  <p className="text-muted-foreground text-center text-xs">
                    Full Lifetime Access
                  </p>

                  {/* Action Links */}
                  <div className="border-border flex items-center justify-center gap-4 border-t pt-2 text-sm">
                    <button className="underline hover:text-[#5624d0]">
                      Share
                    </button>
                    <button className="underline hover:text-[#5624d0]">
                      Gift this course
                    </button>
                    <button className="underline hover:text-[#5624d0]">
                      Apply Coupon
                    </button>
                  </div>

                  {/* Course Includes */}
                  <div className="border-border border-t pt-4">
                    <h3 className="mb-3 font-bold">This course includes:</h3>
                    <div className="space-y-2.5">
                      {courseIncludes.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <item.icon className="text-muted-foreground size-4" />
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
