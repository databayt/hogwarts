"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileDown,
  Loader2,
  Play,
  Plus,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  AvailableVideo,
  CatalogLessonWithProgress,
} from "@/components/stream/data/catalog/get-lesson-with-progress"
import {
  VideoPlayer,
  type VideoProgress,
} from "@/components/stream/shared/video-player"

import {
  markCatalogLessonComplete as markLessonComplete,
  markCatalogLessonIncomplete as markLessonIncomplete,
  updateCatalogLessonProgress as updateLessonProgress,
} from "./catalog-actions"

interface StreamLessonContentProps {
  dictionary: Record<string, unknown>
  lang: string
  schoolId: string | null
  subdomain: string
  lesson: CatalogLessonWithProgress
  quizQuestions?: Array<{
    id: string
    questionText: string
    questionType: string
    options: unknown
    sampleAnswer: string | null
  }>
}

const SOURCE_LABELS: Record<AvailableVideo["source"], string> = {
  "own-school": "Your School",
  featured: "Featured",
  "other-school": "Community",
}

export function StreamLessonContent({
  dictionary,
  lang,
  schoolId,
  subdomain,
  lesson,
  quizQuestions,
}: StreamLessonContentProps) {
  const router = useRouter()
  const [showHero, setShowHero] = useState(true)
  const [isCompleted, setIsCompleted] = useState(
    lesson.progress?.isCompleted ?? false
  )
  const [isPending, startTransition] = useTransition()

  // Multi-instructor video toggle
  const [activeVideoId, setActiveVideoId] = useState<string | null>(
    lesson.availableVideos[0]?.id ?? null
  )
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [showDescDialog, setShowDescDialog] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [wishlistDialog, setWishlistDialog] = useState<
    "added" | "removed" | null
  >(null)

  // Auto-dismiss wishlist overlay after 1.5s
  useEffect(() => {
    if (!wishlistDialog) return
    const timer = setTimeout(() => setWishlistDialog(null), 1500)
    return () => clearTimeout(timer)
  }, [wishlistDialog])

  const activeVideo = useMemo(
    () => lesson.availableVideos.find((v) => v.id === activeVideoId) ?? null,
    [lesson.availableVideos, activeVideoId]
  )

  // Resolve the current video URL — prefer selected instructor video, fallback to lesson default
  const currentVideoUrl = activeVideo?.videoUrl ?? lesson.videoUrl

  const baseUrl = `/${lang}/s/${subdomain}/stream/dashboard/${lesson.chapter.course.slug}`

  const handleToggleComplete = () => {
    startTransition(async () => {
      try {
        if (isCompleted) {
          const result = await markLessonIncomplete(
            lesson.id,
            lesson.chapter.course.slug
          )
          if (result.status === "error") {
            toast.error(result.message)
            return
          }
          setIsCompleted(false)
          toast.success("Marked as incomplete")
        } else {
          const result = await markLessonComplete(
            lesson.id,
            lesson.chapter.course.slug
          )
          if (result.status === "error") {
            toast.error(result.message)
            return
          }
          setIsCompleted(true)
          toast.success("Marked as complete!")
        }
      } catch {
        toast.error("Failed to update progress")
      }
    })
  }

  // Save video progress for resume functionality
  const handleProgress = useCallback(
    (progress: VideoProgress) => {
      updateLessonProgress({
        lessonId: lesson.id,
        watchedSeconds: Math.floor(progress.watchedSeconds),
        totalSeconds: Math.floor(progress.duration),
      })
    },
    [lesson.id]
  )

  // Auto-mark complete when video finishes
  const handleVideoComplete = useCallback(() => {
    if (isCompleted) return

    startTransition(async () => {
      try {
        const result = await markLessonComplete(
          lesson.id,
          lesson.chapter.course.slug
        )
        if (result.status === "error") {
          toast.error(result.message)
          return
        }
        setIsCompleted(true)
        toast.success("Lesson completed!")
      } catch {
        toast.error("Failed to mark lesson as complete")
      }
    })
  }, [isCompleted, lesson.id, lesson.chapter.course.slug])

  // Handle auto-play next lesson
  const handleNextLesson = useCallback(() => {
    if (lesson.nextLesson) {
      router.push(`${baseUrl}/${lesson.nextLesson.id}`)
    }
  }, [lesson.nextLesson, baseUrl, router])

  // Prepare next lesson data for video player
  const nextLessonData = lesson.nextLesson
    ? {
        id: lesson.nextLesson.id,
        title: lesson.nextLesson.title,
        chapterTitle: lesson.chapter.title,
        duration: undefined,
      }
    : null

  // Get initial position for resume (from server)
  const initialPosition = lesson.progress?.watchedSeconds ?? 0

  return (
    <div className="space-y-6 pt-2 pb-6">
      {/* Hero / Video Player */}
      <div
        className="relative aspect-video w-full overflow-hidden"
        style={{ backgroundColor: lesson.color || "#1a1a1a" }}
      >
        {showHero ? (
          <>
            {/* Thumbnail background */}
            {lesson.thumbnailUrl ? (
              <Image
                src={lesson.thumbnailUrl}
                alt={lesson.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                unoptimized
              />
            ) : null}

            {/* Gradient overlay — Apple TV style */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-32">
              {/* Grade badge */}
              {lesson.chapter.course.grades.length > 0 && (
                <div className="mb-2 flex gap-1.5">
                  {lesson.chapter.course.grades.map((grade) => (
                    <span
                      key={grade}
                      className="rounded-md border border-white/30 bg-black/60 px-2.5 text-xs font-medium text-white backdrop-blur-sm"
                    >
                      Grade {gradeWord(grade)}
                    </span>
                  ))}
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                {lesson.title}
              </h1>

              {/* Creator */}
              <div className="mt-1.5 flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Hogwarts"
                  width={16}
                  height={16}
                  className="rounded-sm brightness-0 invert"
                />
                <span className="text-sm font-medium text-white">Hogwarts</span>
              </div>

              {/* Chapter & Lesson position + MORE */}
              <div className="mt-1 flex items-center gap-2 text-sm text-white">
                <span>
                  C{lesson.chapter.position} L{lesson.position} &middot;{" "}
                  {lesson.chapter.course.title} &middot; {lesson.chapter.title}
                </span>
                <button
                  onClick={() => setShowDescDialog(true)}
                  className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  MORE
                </button>
              </div>

              {/* Row 4: Info badges */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm text-white">
                {lesson.year && <span>{lesson.year}</span>}
                {lesson.year &&
                  formatDuration(lesson.duration, lesson.videoDuration) && (
                    <span>&middot;</span>
                  )}
                {formatDuration(lesson.duration, lesson.videoDuration) && (
                  <span>
                    {formatDuration(lesson.duration, lesson.videoDuration)}
                  </span>
                )}
                <span className="rounded bg-white px-1.5 text-xs font-medium text-black">
                  4K
                </span>
                {lesson.isFree && (
                  <span className="rounded border border-white px-1.5 text-xs text-white">
                    Free
                  </span>
                )}
                <span className="rounded border border-white px-1.5 text-xs text-white">
                  CC
                </span>
                <span className="rounded border border-white px-1.5 text-xs text-white">
                  AD
                </span>
                {lesson.availableVideos.length > 1 && (
                  <>
                    <span>&middot;</span>
                    <span>{lesson.availableVideos.length} instructors</span>
                  </>
                )}
                {lesson.attachments.length > 0 && (
                  <>
                    <span>&middot;</span>
                    <span>
                      {lesson.attachments.length} resource
                      {lesson.attachments.length > 1 ? "s" : ""}
                    </span>
                  </>
                )}
              </div>

              {/* Row 5: Play pill + Wishlist */}
              <div className="mt-4 flex items-center gap-3">
                {/* Play button — two states based on watch progress */}
                {lesson.progress &&
                lesson.progress.watchedSeconds > 0 &&
                lesson.progress.totalSeconds ? (
                  <button
                    onClick={() => {
                      if (currentVideoUrl) {
                        setAutoPlay(true)
                        setShowHero(false)
                      }
                    }}
                    disabled={!currentVideoUrl}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-5 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Play className="size-4 shrink-0 fill-current" />
                    <div className="h-1 w-12 overflow-hidden rounded-full bg-black/20">
                      <div
                        className="h-full rounded-full bg-black"
                        style={{
                          width: `${Math.min(100, (lesson.progress.watchedSeconds / lesson.progress.totalSeconds) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-black/60">
                      {formatRemaining(
                        lesson.progress.watchedSeconds,
                        lesson.progress.totalSeconds
                      )}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      if (currentVideoUrl) {
                        setAutoPlay(true)
                        setShowHero(false)
                      }
                    }}
                    disabled={!currentVideoUrl}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-6 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    <Play className="size-4 fill-current" />
                    Play
                  </button>
                )}

                {/* Wishlist toggle */}
                <button
                  onClick={() => {
                    setIsInWishlist((prev) => {
                      setWishlistDialog(prev ? "removed" : "added")
                      return !prev
                    })
                  }}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  {isInWishlist ? (
                    <Check className="size-5" />
                  ) : (
                    <Plus className="size-5" />
                  )}
                </button>
              </div>
            </div>

            {/* About this Lesson — Apple TV+ info sheet */}
            <Dialog open={showDescDialog} onOpenChange={setShowDescDialog}>
              <DialogContent
                showCloseButton={false}
                className="flex max-h-[80vh] flex-col overflow-hidden rounded-3xl p-0 sm:max-w-[380px]"
              >
                {/* Fixed header — title + subtitle only */}
                <div className="shrink-0 px-6 pt-2.5 pb-0.5">
                  {/* Done pill — top-right */}
                  <DialogClose asChild>
                    <button className="absolute end-4 top-3 rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-light text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
                      Done
                    </button>
                  </DialogClose>

                  {/* Header — centered title + subtitle */}
                  <DialogHeader className="items-center gap-0 text-center">
                    <DialogTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {lesson.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                      {lesson.chapter.course.title}
                    </DialogDescription>
                  </DialogHeader>
                </div>

                {/* Scrollable body */}
                <div className="overflow-y-auto px-6 pb-6">
                  {/* Description */}
                  <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                    {lesson.description ||
                      lesson.chapter.course.description ||
                      "Explore this lesson and discover new concepts."}
                  </p>

                  {/* Metadata badges row */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[13px]">
                    {lesson.year && <span>{lesson.year}</span>}
                    {lesson.year &&
                      formatDuration(lesson.duration, lesson.videoDuration) && (
                        <span>&middot;</span>
                      )}
                    {formatDuration(lesson.duration, lesson.videoDuration) && (
                      <span>
                        {formatDuration(lesson.duration, lesson.videoDuration)}
                      </span>
                    )}
                    <span className="bg-foreground text-background rounded px-1 text-[10px] leading-4 font-bold">
                      4K
                    </span>
                    {lesson.isFree && (
                      <span className="rounded border px-1 text-[10px] leading-4">
                        Free
                      </span>
                    )}
                    <span className="rounded border px-1 text-[10px] leading-4">
                      CC
                    </span>
                    <span className="rounded border px-1 text-[10px] leading-4">
                      AD
                    </span>
                  </div>
                  {/* ── Information ── */}
                  <div className="mt-5 pt-4">
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Information
                    </h3>
                    <div className="mt-3 space-y-3">
                      {lesson.year && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Released
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.year}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          Course
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {lesson.chapter.course.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          Chapter
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {lesson.chapter.title}
                        </p>
                      </div>
                      {lesson.chapter.course.grades.length > 0 && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Grade
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.chapter.course.grades
                              .map((g) => `Grade ${gradeWord(g)}`)
                              .join(", ")}
                          </p>
                        </div>
                      )}
                      {lesson.availableVideos.length > 0 && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Instructors
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.availableVideos
                              .map((v) => v.instructor.name ?? "Instructor")
                              .join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── About this Course ── */}
                  {(lesson.chapter.course.description ||
                    lesson.chapter.course.objectives.length > 0 ||
                    lesson.chapter.course.prerequisites ||
                    lesson.chapter.course.targetAudience) && (
                    <div className="mt-5 pt-4">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        About this Course
                      </h3>
                      <div className="mt-3 space-y-3">
                        {lesson.chapter.course.description && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              Description
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.description}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.objectives.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              Objectives
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.objectives.join(", ")}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.prerequisites && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              Prerequisites
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.prerequisites}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.targetAudience && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              Target Audience
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.targetAudience}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* ── Current Lesson ── */}
                  {lesson.description && (
                    <div className="mt-5 pt-4">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                        Current Lesson
                      </h3>
                      <div className="mt-3">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          Description
                        </p>
                        <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                          {lesson.description}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Wishlist overlay — Apple TV transient feedback */}
            {wishlistDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
                <div className="flex flex-col items-center gap-3 rounded-2xl bg-white px-6 py-12 shadow-xl dark:bg-neutral-800">
                  <Bookmark className="h-16 w-10 text-gray-700 dark:text-gray-300" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    {wishlistDialog === "added"
                      ? "Added to Watchlist"
                      : "Removed"}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : currentVideoUrl ? (
          <VideoPlayer
            url={currentVideoUrl}
            title={lesson.title}
            lessonId={lesson.id}
            initialPosition={initialPosition}
            posterUrl={lesson.thumbnailUrl}
            nextLesson={nextLessonData}
            onProgress={handleProgress}
            onComplete={handleVideoComplete}
            onNextLesson={handleNextLesson}
            autoPlay={autoPlay}
            chapterNumber={lesson.chapter.position}
            lessonNumber={lesson.position}
            courseTitle={lesson.chapter.course.title}
            className="h-full w-full"
          />
        ) : null}
      </div>

      {/* More from Course */}
      {lesson.siblingLessons.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            More from {lesson.chapter.course.title}
          </h2>
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-2">
            {lesson.siblingLessons.map((sibling) => (
              <Link
                key={sibling.id}
                href={`${baseUrl}/${sibling.id}`}
                className="group relative w-60 shrink-0 overflow-hidden rounded-lg"
              >
                <div
                  className="relative aspect-[3/2]"
                  style={{ backgroundColor: sibling.color || "#1a1a1a" }}
                >
                  {sibling.thumbnailUrl && (
                    <Image
                      src={sibling.thumbnailUrl}
                      alt={sibling.title}
                      fill
                      className="object-cover"
                      sizes="240px"
                      unoptimized
                    />
                  )}
                  {/* Title — centered on image */}
                  <p className="absolute inset-0 line-clamp-2 flex items-center px-3 text-sm font-bold text-white drop-shadow-md">
                    {sibling.title}
                  </p>
                  {/* Metadata — Apple liquid glass bar */}
                  <div
                    className="absolute inset-x-0 bottom-0 z-10 px-2.5 pt-4 pb-1"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 40%, transparent 100%)",
                      backdropFilter: "blur(8px) saturate(110%)",
                      WebkitBackdropFilter: "blur(8px) saturate(110%)",
                      maskImage:
                        "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to top, black 0%, black 50%, transparent 100%)",
                    }}
                  >
                    <div className="flex items-center gap-1 text-xs text-white/80">
                      <Play className="size-3 fill-current" />
                      {sibling.watchedMinutes != null &&
                      sibling.watchedMinutes > 0 ? (
                        <span>{sibling.watchedMinutes} min watched</span>
                      ) : (
                        <>
                          <span>
                            C{sibling.chapterPosition}, L
                            {sibling.lessonPosition}
                          </span>
                          <span>&middot;</span>
                          <span>{sibling.duration ?? "?"} min</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Instructors — real data from availableVideos */}
      {lesson.availableVideos.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Instructors</h2>
          <div className="flex flex-wrap gap-3">
            {lesson.availableVideos.map((video) => (
              <button
                key={video.id}
                onClick={() => {
                  setActiveVideoId(video.id)
                  setShowHero(false)
                }}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                  activeVideoId === video.id
                    ? "border-primary bg-primary/5"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <Avatar className="size-10">
                  <AvatarImage src={video.instructor.image ?? undefined} />
                  <AvatarFallback>
                    {video.instructor.name?.charAt(0) ?? (
                      <User className="size-5" />
                    )}
                  </AvatarFallback>
                </Avatar>
                <div className="text-start">
                  <p className="text-sm font-medium">
                    {video.instructor.name ?? "Instructor"}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant={
                        video.source === "own-school"
                          ? "default"
                          : video.source === "featured"
                            ? "secondary"
                            : "outline"
                      }
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {video.source === "other-school" && video.school.name
                        ? video.school.name
                        : SOURCE_LABELS[video.source]}
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quiz — practice questions from CatalogQuestion */}
      {quizQuestions && quizQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Practice Quiz</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quizQuestions.map((q, idx) => (
              <QuizQuestion key={q.id} question={q} index={idx} />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lesson Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                {lesson.isFree && (
                  <Badge variant="secondary">Free Preview</Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm">
                {lesson.chapter.title} &bull; {lesson.chapter.course.title}
              </p>
            </div>
            <Button
              onClick={handleToggleComplete}
              disabled={isPending}
              variant={isCompleted ? "secondary" : "default"}
              className="shrink-0"
            >
              {isPending ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="me-2 size-4 text-green-500" />
              ) : (
                <Circle className="me-2 size-4" />
              )}
              {isCompleted ? "Completed" : "Mark as Complete"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Description */}
          {lesson.description && (
            <div className="prose dark:prose-invert mb-6 max-w-none">
              <p>{lesson.description}</p>
            </div>
          )}

          {/* Duration */}
          {(lesson.videoDuration || lesson.duration) && (
            <p className="text-muted-foreground mb-4 text-sm">
              Duration:{" "}
              {lesson.videoDuration
                ? `${Math.floor(lesson.videoDuration / 60)}m ${Math.floor(lesson.videoDuration % 60)}s`
                : `${lesson.duration} minutes`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      {lesson.attachments.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Resources</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {lesson.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:bg-accent flex items-center gap-2 rounded-md border p-2 transition-colors"
              >
                <FileDown className="text-muted-foreground size-4" />
                <span className="text-sm">{attachment.name}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {lesson.previousLesson ? (
          <Link href={`${baseUrl}/${lesson.previousLesson.id}`}>
            <Button variant="outline">
              <ChevronLeft className="me-2 size-4 rtl:rotate-180" />
              <span className="hidden sm:inline">Previous:</span>{" "}
              <span className="max-w-[150px] truncate">
                {lesson.previousLesson.title}
              </span>
            </Button>
          </Link>
        ) : (
          <div />
        )}

        {lesson.nextLesson ? (
          <Link href={`${baseUrl}/${lesson.nextLesson.id}`}>
            <Button>
              <span className="hidden sm:inline">Next:</span>{" "}
              <span className="max-w-[150px] truncate">
                {lesson.nextLesson.title}
              </span>
              <ChevronRight className="ms-2 size-4 rtl:rotate-180" />
            </Button>
          </Link>
        ) : (
          <Link href={baseUrl}>
            <Button>
              Back to Course
              <ChevronRight className="ms-2 size-4 rtl:rotate-180" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// Helper: number to word (1-12)
const GRADE_WORDS: Record<number, string> = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
  11: "Eleven",
  12: "Twelve",
}
function gradeWord(n: number): string {
  return GRADE_WORDS[n] ?? String(n)
}

// Helper: format duration from minutes or seconds
function formatDuration(
  minutes?: number | null,
  seconds?: number | null
): string {
  const totalMin = minutes ?? (seconds ? Math.ceil(seconds / 60) : 0)
  if (totalMin === 0) return ""
  if (totalMin >= 60)
    return `${Math.floor(totalMin / 60)}h ${totalMin % 60} min`
  return `${totalMin} min`
}

// Helper: format remaining time
function formatRemaining(watchedSeconds: number, totalSeconds: number): string {
  const remainSec = Math.max(0, totalSeconds - watchedSeconds)
  const remainMin = Math.ceil(remainSec / 60)
  if (remainMin >= 60)
    return `${Math.floor(remainMin / 60)}h ${remainMin % 60}m left`
  return `${remainMin}m left`
}

// Lightweight quiz question renderer for practice mode
function QuizQuestion({
  question,
  index,
}: {
  question: {
    id: string
    questionText: string
    questionType: string
    options: unknown
    sampleAnswer: string | null
  }
  index: number
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)

  const options = Array.isArray(question.options) ? question.options : []

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-sm font-medium">
        {index + 1}. {question.questionText}
      </p>

      {question.questionType === "MCQ" && options.length > 0 && (
        <div className="space-y-1.5">
          {options.map(
            (opt: { text?: string; isCorrect?: boolean }, i: number) => {
              const text = typeof opt === "string" ? opt : (opt?.text ?? "")
              const isCorrect = typeof opt === "object" && opt?.isCorrect
              return (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedOption(text)
                    setShowAnswer(true)
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                    showAnswer && isCorrect
                      ? "border-green-500 bg-green-50 dark:bg-green-950"
                      : selectedOption === text && showAnswer && !isCorrect
                        ? "border-red-500 bg-red-50 dark:bg-red-950"
                        : selectedOption === text
                          ? "border-primary"
                          : "hover:bg-muted/50"
                  }`}
                >
                  {text}
                </button>
              )
            }
          )}
        </div>
      )}

      {question.questionType === "TRUE_FALSE" && (
        <div className="flex gap-2">
          {["True", "False"].map((opt) => (
            <button
              key={opt}
              onClick={() => {
                setSelectedOption(opt)
                setShowAnswer(true)
              }}
              className={`rounded-md border px-4 py-2 text-sm transition-colors ${
                selectedOption === opt
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {showAnswer && question.sampleAnswer && (
        <p className="text-muted-foreground mt-2 text-xs">
          Answer: {question.sampleAnswer}
        </p>
      )}
    </div>
  )
}
