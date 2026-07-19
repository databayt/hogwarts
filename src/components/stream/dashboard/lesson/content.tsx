"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Bookmark,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileDown,
  Loader2,
  Lock,
  Play,
  Plus,
  User,
} from "lucide-react"
import { toast } from "sonner"

import { asset } from "@/lib/asset-url"
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
  LessonWithProgress,
} from "@/components/stream/data/catalog/get-lesson-with-progress"
import { InstructorSwitcher } from "@/components/stream/lesson/instructor-switcher"
import {
  VideoPlayer,
  type VideoPlayerLabels,
  type VideoProgress,
} from "@/components/stream/shared/video-player"
import { purchaseVideo } from "@/components/stream/video/video-purchase-actions"

import {
  markLessonComplete,
  markLessonIncomplete,
  updateLessonProgress,
} from "./catalog-actions"
import { submitLessonQuiz } from "./quiz-actions"

interface StreamLessonContentProps {
  dictionary: Record<string, unknown>
  lang: string
  schoolId: string | null
  subdomain: string
  lesson: LessonWithProgress
  quizQuestions?: Array<{
    id: string
    questionText: string
    questionType: string
    options: unknown
    sampleAnswer: string | null
  }>
}

// When a lesson has no playable video of its own (no approved lesson video, or
// the selected instructor video is paid+unpurchased), fall back to the
// marketing "story" video so the player surface is never empty. This is the
// same clip shown on the public SaaS marketing page (saas-marketing/
// story-section.tsx) and the docs story video.
const FALLBACK_VIDEO_URL = asset("/media/story.mp4")

export function StreamLessonContent({
  dictionary,
  lang,
  schoolId,
  lesson,
  quizQuestions,
}: StreamLessonContentProps) {
  const router = useRouter()
  // The page passes the `stream` subtree (dictionary.stream) as `dictionary`,
  // so descend a single level here — NOT `?.stream?.lesson` (that double-nest
  // bug left ~45 player strings rendering English fallbacks on every tenant).
  const d = (dictionary as Record<string, any>)?.lesson
  // Instructor video source labels (localized).
  const sourceLabels: Record<AvailableVideo["source"], string> = {
    "own-school": d?.yourSchool || "Your School",
    featured: d?.featured || "Featured",
    "other-school": d?.community || "Community",
  }
  // VideoPlayer + VideoUpNext display strings. chapterShort/lessonShort are
  // REUSED from `dictionary.lesson` (the same keys used a few lines below for
  // the hero's own "C1 L2" badge) rather than duplicated under videoPlayer —
  // everything else is new (stream.videoPlayer namespace).
  const vp = (dictionary as Record<string, any>)?.videoPlayer
  const playerLabels: VideoPlayerLabels = {
    play: vp?.play,
    pause: vp?.pause,
    rewind: vp?.rewind,
    forward: vp?.forward,
    pictureInPicture: vp?.pictureInPicture,
    share: vp?.share,
    copyLink: vp?.copyLink,
    airdrop: vp?.airdrop,
    messages: vp?.messages,
    notes: vp?.notes,
    reminders: vp?.reminders,
    volume: vp?.volume,
    mute: vp?.mute,
    unmute: vp?.unmute,
    chapterShort: d?.chapterShort,
    lessonShort: d?.lessonShort,
    upNext: vp?.upNext,
    playNow: vp?.playNow,
    cancelAutoPlay: vp?.cancelAutoPlay,
    keyboardHint: vp?.keyboardHint,
    minUnit: vp?.minUnit,
    hourUnit: vp?.hourUnit,
    minuteUnit: vp?.minuteUnit,
  }
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
  // The real video's source failed to load (dead URL, bad codec) — swap in the
  // marketing fallback clip rather than leaving a black player.
  const [sourceFailed, setSourceFailed] = useState(false)
  const [isPurchasePending, startPurchaseTransition] = useTransition()

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

  // Resolve the current video URL — prefer the selected instructor video, then
  // the lesson default. When the lesson has NO videos at all — or the real
  // video's source failed to load — fall back to the marketing story clip so
  // the surface is never empty. We deliberately do NOT fall back when videos
  // exist but are paywalled (paid + unpurchased) — that must keep the
  // locked/purchase UX, not play a marketing clip.
  const lessonVideoUrl = activeVideo?.videoUrl ?? lesson.videoUrl
  const isFallbackVideo = lesson.availableVideos.length === 0
  // Any fallback playback (no videos, or broken source) must never write
  // lesson watch-progress or auto-complete.
  const playingFallback = isFallbackVideo || sourceFailed
  const currentVideoUrl = sourceFailed
    ? FALLBACK_VIDEO_URL
    : (lessonVideoUrl ?? (isFallbackVideo ? FALLBACK_VIDEO_URL : null))

  // Paid + unpurchased selected video → the server sent no URL. Surface a
  // purchase CTA (the InstructorSwitcher only renders with 2+ videos, so a
  // lone paid video would otherwise be a dead end with a disabled Play).
  const lockedVideo =
    activeVideo && activeVideo.requiresPayment && !activeVideo.hasPurchased
      ? activeVideo
      : null

  const baseUrl = `/${lang}/stream/courses/${lesson.chapter.course.slug}`

  const handleUnlock = useCallback(
    (videoId: string) => {
      startPurchaseTransition(async () => {
        const result = await purchaseVideo(videoId)
        if (result.status === "success" && result.checkoutUrl) {
          window.location.href = result.checkoutUrl
          return
        }
        toast.error(
          result.message ?? d?.purchaseFailed ?? "Failed to start purchase"
        )
      })
    },
    [d?.purchaseFailed]
  )

  // A new instructor selection gets a fresh chance at its real source.
  const handleSwitchVideo = useCallback((videoId: string) => {
    setSourceFailed(false)
    setActiveVideoId(videoId)
  }, [])

  const handleSourceError = useCallback(() => {
    // If the fallback clip itself fails there is nothing further to swap in.
    if (playingFallback) return
    setSourceFailed(true)
  }, [playingFallback])

  const handleToggleComplete = () => {
    startTransition(async () => {
      try {
        if (isCompleted) {
          const result = await markLessonIncomplete(
            lesson.id,
            lesson.chapter.course.slug
          )
          if (result.status === "error") {
            toast.error(d?.failedToUpdateProgress || result.message)
            return
          }
          setIsCompleted(false)
          toast.success(d?.markedIncomplete || "Marked as incomplete")
        } else {
          const result = await markLessonComplete(
            lesson.id,
            lesson.chapter.course.slug
          )
          if (result.status === "error") {
            toast.error(d?.failedToUpdateProgress || result.message)
            return
          }
          setIsCompleted(true)
          toast.success(d?.markedComplete || "Marked as complete!")
        }
      } catch {
        toast.error(d?.failedToUpdateProgress || "Failed to update progress")
      }
    })
  }

  // Save video progress for resume functionality. Skip when playing the
  // marketing fallback — it isn't this lesson's content, so it must not write
  // watch progress.
  const handleProgress = useCallback(
    (progress: VideoProgress) => {
      if (playingFallback) return
      updateLessonProgress({
        lessonId: lesson.id,
        watchedSeconds: Math.floor(progress.watchedSeconds),
        totalSeconds: Math.floor(progress.duration),
      })
    },
    [lesson.id, playingFallback]
  )

  // Auto-mark complete when video finishes
  const handleVideoComplete = useCallback(() => {
    if (isCompleted) return
    // The marketing fallback clip must not auto-complete a real lesson; the
    // student can still mark it complete manually.
    if (playingFallback) return

    startTransition(async () => {
      try {
        const result = await markLessonComplete(
          lesson.id,
          lesson.chapter.course.slug
        )
        if (result.status === "error") {
          toast.error(d?.failedToComplete || result.message)
          return
        }
        setIsCompleted(true)
        toast.success(d?.lessonCompleted || "Lesson completed!")
      } catch {
        toast.error(d?.failedToComplete || "Failed to mark lesson as complete")
      }
    })
  }, [isCompleted, playingFallback, lesson.id, lesson.chapter.course.slug])

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
                      {d?.grade || "Grade"} {gradeWord(grade, lang)}
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
                  src={asset("/icons/logo.png")}
                  alt={d?.brandName || "Hogwarts"}
                  width={16}
                  height={16}
                  className="rounded-sm brightness-0 invert"
                />
                <span className="text-sm font-medium text-white">
                  {d?.brandName || "Hogwarts"}
                </span>
              </div>

              {/* Chapter & Lesson position + MORE */}
              <div className="mt-1 flex items-center gap-2 text-sm text-white">
                <span>
                  {d?.chapterShort || "C"}
                  {lesson.chapter.position} {d?.lessonShort || "L"}
                  {lesson.position} &middot; {lesson.chapter.course.title}{" "}
                  &middot; {lesson.chapter.title}
                </span>
                <button
                  onClick={() => setShowDescDialog(true)}
                  className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-medium text-white/80 backdrop-blur-sm transition-colors hover:bg-white/25"
                >
                  {d?.more || "MORE"}
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
                    {d?.free || "Free"}
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
                    <span>
                      {lesson.availableVideos.length}{" "}
                      {d?.instructors || "instructors"}
                    </span>
                  </>
                )}
                {lesson.attachments.length > 0 && (
                  <>
                    <span>&middot;</span>
                    <span>
                      {lesson.attachments.length}{" "}
                      {lesson.attachments.length > 1
                        ? d?.resourceMany || "resources"
                        : d?.resourceOne || "resource"}
                    </span>
                  </>
                )}
              </div>

              {/* Row 5: Play pill + Wishlist */}
              <div className="mt-4 flex items-center gap-3">
                {/* Locked (paid + unpurchased) with no playable source →
                    purchase pill. Without this, a lone paid video is a dead
                    end: the switcher needs 2+ videos and Play stays disabled. */}
                {lockedVideo && !currentVideoUrl ? (
                  <button
                    onClick={() => handleUnlock(lockedVideo.id)}
                    disabled={isPurchasePending}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-6 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                  >
                    {isPurchasePending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Lock className="size-4" />
                    )}
                    {d?.unlock || "Unlock"}
                    {lockedVideo.price != null && (
                      <span className="text-black/60">
                        {lockedVideo.price.toFixed(2)}{" "}
                        {lockedVideo.currency ?? ""}
                      </span>
                    )}
                  </button>
                ) : /* Play button — two states based on watch progress */
                lesson.progress &&
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
                    {d?.play || "Play"}
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
                      {d?.done || "Done"}
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
                      d?.exploreLesson ||
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
                        {d?.free || "Free"}
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
                      {d?.information || "Information"}
                    </h3>
                    <div className="mt-3 space-y-3">
                      {lesson.year && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {d?.released || "Released"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.year}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {d?.course || "Course"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {lesson.chapter.course.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {d?.chapter || "Chapter"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {lesson.chapter.title}
                        </p>
                      </div>
                      {lesson.chapter.course.grades.length > 0 && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {d?.grade || "Grade"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.chapter.course.grades
                              .map(
                                (g) =>
                                  `${d?.grade || "Grade"} ${gradeWord(g, lang)}`
                              )
                              .join(", ")}
                          </p>
                        </div>
                      )}
                      {lesson.availableVideos.length > 0 && (
                        <div>
                          <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            {d?.instructors || "Instructors"}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.availableVideos
                              .map(
                                (v) =>
                                  v.instructor.name ??
                                  d?.instructor ??
                                  "Instructor"
                              )
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
                        {d?.aboutThisCourse || "About this Course"}
                      </h3>
                      <div className="mt-3 space-y-3">
                        {lesson.chapter.course.description && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.description || "Description"}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.description}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.objectives.length > 0 && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.objectives || "Objectives"}
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.objectives.join(", ")}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.prerequisites && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.prerequisites || "Prerequisites"}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">
                              {lesson.chapter.course.prerequisites}
                            </p>
                          </div>
                        )}
                        {lesson.chapter.course.targetAudience && (
                          <div>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500">
                              {d?.targetAudience || "Target Audience"}
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
                        {d?.currentLesson || "Current Lesson"}
                      </h3>
                      <div className="mt-3">
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                          {d?.description || "Description"}
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
                      ? d?.addedToWatchlist || "Added to Watchlist"
                      : d?.removed || "Removed"}
                  </p>
                </div>
              </div>
            )}
          </>
        ) : currentVideoUrl ? (
          <VideoPlayer
            // Remount on instructor switch — a <video> won't reload just from a
            // changed `src` attribute (it needs .load()), so keying on the
            // active video id gives the new instructor's source a fresh
            // element. Same reason the fallback swap is part of the key.
            key={`${activeVideoId ?? "default"}${sourceFailed ? ":fallback" : ""}`}
            url={currentVideoUrl}
            title={lesson.title}
            lessonId={lesson.id}
            initialPosition={initialPosition}
            posterUrl={lesson.thumbnailUrl}
            nextLesson={nextLessonData}
            onProgress={handleProgress}
            onComplete={handleVideoComplete}
            onNextLesson={handleNextLesson}
            onSourceError={handleSourceError}
            autoPlay={autoPlay}
            chapterNumber={lesson.chapter.position}
            lessonNumber={lesson.position}
            courseTitle={lesson.chapter.course.title}
            className="h-full w-full"
            labels={playerLabels}
          />
        ) : null}
      </div>

      {lesson.availableVideos.length > 1 && (
        <InstructorSwitcher
          videos={lesson.availableVideos}
          activeVideoId={activeVideoId}
          onSwitch={handleSwitchVideo}
          dictionary={dictionary as Record<string, any>}
        />
      )}

      {/* More from Course */}
      {lesson.siblingLessons.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            {d?.moreFrom || "More from"} {lesson.chapter.course.title}
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
                        <span>
                          {sibling.watchedMinutes}{" "}
                          {d?.minWatched || "min watched"}
                        </span>
                      ) : (
                        <>
                          <span>
                            {d?.chapterShort || "C"}
                            {sibling.chapterPosition}, {d?.lessonShort || "L"}
                            {sibling.lessonPosition}
                          </span>
                          <span>&middot;</span>
                          <span>
                            {sibling.duration ?? "?"} {d?.min || "min"}
                          </span>
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
          <h2 className="text-lg font-semibold">
            {d?.instructors || "Instructors"}
          </h2>
          <div className="flex flex-wrap gap-3">
            {lesson.availableVideos.map((video) => {
              const locked = video.requiresPayment && !video.hasPurchased
              return (
                <button
                  key={video.id}
                  disabled={locked && isPurchasePending}
                  onClick={() => {
                    // Locked (paid + unpurchased) videos have no playable URL —
                    // switching would blank the player. Start the purchase
                    // instead so a lone paid video is never a dead end.
                    if (locked) {
                      handleUnlock(video.id)
                      return
                    }
                    handleSwitchVideo(video.id)
                    setShowHero(false)
                  }}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                    activeVideoId === video.id
                      ? "border-primary bg-primary/5"
                      : "bg-muted/50 hover:bg-muted"
                  } ${locked ? "opacity-75" : ""}`}
                >
                  <Avatar className="size-10">
                    <AvatarImage src={video.instructor.image ?? undefined} />
                    <AvatarFallback>
                      {locked ? (
                        <Lock className="size-4" />
                      ) : (
                        (video.instructor.name?.charAt(0) ?? (
                          <User className="size-5" />
                        ))
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-start">
                    <p className="text-sm font-medium">
                      {video.instructor.name ?? d?.instructor ?? "Instructor"}
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
                          : sourceLabels[video.source]}
                      </Badge>
                      {locked && (
                        <span className="text-muted-foreground text-[10px]">
                          {video.price != null
                            ? `${video.price.toFixed(2)} ${video.currency ?? ""}`
                            : (d?.unlock ?? "Unlock")}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Quiz — graded; the score is written to the gradebook server-side */}
      {quizQuestions && quizQuestions.length > 0 && (
        <LessonQuiz
          questions={quizQuestions}
          lessonId={lesson.id}
          subjectId={lesson.chapter.course.id}
          d={d}
        />
      )}

      {/* Lesson Info */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{lesson.title}</CardTitle>
                {lesson.isFree && (
                  <Badge variant="secondary">
                    {d?.freePreview || "Free Preview"}
                  </Badge>
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
              {isCompleted
                ? d?.completed || "Completed"
                : d?.markAsComplete || "Mark as Complete"}
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
              {d?.duration || "Duration"}:{" "}
              {lesson.videoDuration
                ? `${Math.floor(lesson.videoDuration / 60)}m ${Math.floor(lesson.videoDuration % 60)}s`
                : `${lesson.duration} ${d?.minutes || "minutes"}`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Resources */}
      {lesson.attachments.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">
            {d?.resources || "Resources"}
          </h2>
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
              <span className="hidden sm:inline">
                {d?.previous || "Previous"}:
              </span>{" "}
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
              <span className="hidden sm:inline">{d?.next || "Next"}:</span>{" "}
              <span className="max-w-[150px] truncate">
                {lesson.nextLesson.title}
              </span>
              <ChevronRight className="ms-2 size-4 rtl:rotate-180" />
            </Button>
          </Link>
        ) : (
          <Link href={baseUrl}>
            <Button>
              {d?.backToCourse || "Back to Course"}
              <ChevronRight className="ms-2 size-4 rtl:rotate-180" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// Helper: number to word (1-12), locale-aware
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
const GRADE_WORDS_AR: Record<number, string> = {
  1: "الأول",
  2: "الثاني",
  3: "الثالث",
  4: "الرابع",
  5: "الخامس",
  6: "السادس",
  7: "السابع",
  8: "الثامن",
  9: "التاسع",
  10: "العاشر",
  11: "الحادي عشر",
  12: "الثاني عشر",
}
function gradeWord(n: number, lang?: string): string {
  if (lang === "ar") return GRADE_WORDS_AR[n] ?? String(n)
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

type QuizQuestionShape = {
  id: string
  questionText: string
  questionType: string
  options: unknown
  sampleAnswer: string | null
}

/** The question types `submitLessonQuiz` can auto-grade and this UI can render. */
const GRADEABLE_TYPES = ["MULTIPLE_CHOICE", "TRUE_FALSE"]

/**
 * Graded lesson quiz: collects one answer per question, submits them together,
 * and lets the SERVER grade. Correctness is deliberately not revealed until
 * after submit — the previous version revealed the answer on click, which
 * cannot coexist with a score that reaches the gradebook.
 *
 * Answers are sent as option INDEXES (what the action matches on), not text.
 */
function LessonQuiz({
  questions,
  lessonId,
  subjectId,
  d,
}: {
  questions: QuizQuestionShape[]
  lessonId: string
  subjectId: string
  d?: Record<string, any>
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [result, setResult] = useState<{
    score: number
    total: number
    percentage: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  // Only gradeable questions gate the submit button; ungradeable ones (essay,
  // short answer) still render but the server ignores them.
  const gradeable = questions.filter((q) =>
    GRADEABLE_TYPES.includes(q.questionType)
  )
  const allAnswered = gradeable.every((q) => answers[q.id] !== undefined)
  const submitted = result !== null

  const handleSubmit = () => {
    setError(null)
    startSubmit(async () => {
      const res = await submitLessonQuiz({
        lessonId,
        subjectId,
        answers: Object.entries(answers).map(([questionId, index]) => ({
          questionId,
          selectedOptionIndex: index,
        })),
      })
      if (res.success) {
        setResult(res.data)
      } else {
        setError(d?.quizSubmitFailed || "Couldn't submit your answers")
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{d?.quiz || "Quiz"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {questions.map((q, idx) => (
          <QuizQuestion
            key={q.id}
            question={q}
            index={idx}
            d={d}
            selectedIndex={answers[q.id]}
            submitted={submitted}
            onSelect={(i) => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
          />
        ))}

        {error && <p className="text-destructive text-sm">{error}</p>}

        {submitted ? (
          <div className="bg-muted rounded-lg p-4 text-center">
            <p className="text-2xl font-bold">{result.percentage}%</p>
            <p className="muted text-sm">
              {result.score} / {result.total}
            </p>
          </div>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting || gradeable.length === 0}
            className="w-full"
          >
            {isSubmitting
              ? d?.quizSubmitting || "Submitting..."
              : d?.quizSubmit || "Submit Quiz"}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Single question. Controlled by LessonQuiz; reveals correctness only once the
// server has graded (`submitted`).
function QuizQuestion({
  question,
  index,
  d,
  selectedIndex,
  submitted,
  onSelect,
}: {
  question: QuizQuestionShape
  index: number
  d?: Record<string, any>
  selectedIndex: number | undefined
  submitted: boolean
  onSelect: (index: number) => void
}) {
  // TRUE_FALSE stores its options the same way MULTIPLE_CHOICE does
  // (`[{ text, isCorrect }]`), so both render from the stored options and the
  // index we send back always lines up with what the server grades.
  //
  // Two option shapes exist in catalog_questions: the verified curriculum
  // (prisma/seeds/catalog/sd-content.ts) writes `text` — which is what
  // quiz-actions' ChoiceOption declares — while the generated demo filler
  // (catalog/content.ts) writes `label`. Read both, or every demo question
  // renders blank buttons. Grading is unaffected (the server only reads
  // `isCorrect` by index).
  const options = Array.isArray(question.options)
    ? (question.options as Array<{
        text?: string
        label?: string
        isCorrect?: boolean
      }>)
    : []

  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-sm font-medium">
        {index + 1}. {question.questionText}
      </p>

      {options.length > 0 && (
        <div className="space-y-1.5">
          {options.map((opt, i) => {
            const text =
              typeof opt === "string" ? opt : (opt?.text ?? opt?.label ?? "")
            const isCorrect = typeof opt === "object" && opt?.isCorrect === true
            const isPicked = selectedIndex === i
            return (
              <button
                key={i}
                onClick={() => onSelect(i)}
                disabled={submitted}
                className={`w-full rounded-md border px-3 py-2 text-start text-sm transition-colors ${
                  submitted && isCorrect
                    ? "border-green-500 bg-green-50 dark:bg-green-950"
                    : isPicked && submitted && !isCorrect
                      ? "border-red-500 bg-red-50 dark:bg-red-950"
                      : isPicked
                        ? "border-primary"
                        : "hover:bg-muted/50"
                } ${submitted ? "cursor-default" : "cursor-pointer"}`}
              >
                {text}
              </button>
            )
          })}
        </div>
      )}

      {submitted && question.sampleAnswer && (
        <p className="text-muted-foreground mt-2 text-xs">
          {d?.answer || "Answer"}: {question.sampleAnswer}
        </p>
      )}
    </div>
  )
}
