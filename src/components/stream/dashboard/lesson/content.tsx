"use client"

import { useCallback, useState, useTransition } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
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

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CatalogLessonWithProgress } from "@/components/stream/data/catalog/get-lesson-with-progress"
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
}

export function StreamLessonContent({
  dictionary,
  lang,
  schoolId,
  subdomain,
  lesson,
}: StreamLessonContentProps) {
  const router = useRouter()
  const [showHero, setShowHero] = useState(true)
  const [isCompleted, setIsCompleted] = useState(
    lesson.progress?.isCompleted ?? false
  )
  const [isPending, startTransition] = useTransition()

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
      // Debounced save to server (handled by video player)
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
    if (isCompleted) return // Already completed, don't mark again

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
        duration: undefined, // Could be added if available
      }
    : null

  // Get initial position for resume (from server)
  const initialPosition = lesson.progress?.watchedSeconds ?? 0

  return (
    <div className="space-y-6 py-6">
      {/* Hero / Video Player */}
      <div
        className="relative aspect-video w-full overflow-hidden rounded-lg"
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

            {/* Gradient overlay */}
            <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-24">
              <h1 className="text-lg font-semibold text-white sm:text-2xl">
                {lesson.title}
              </h1>
              <p className="mt-1 text-sm text-white/70">
                {lesson.chapter.course.title} &middot; {lesson.chapter.title}
              </p>
              {lesson.description && (
                <p className="mt-1 line-clamp-1 text-sm text-white/50">
                  {lesson.description}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => {
                    if (lesson.videoUrl) setShowHero(false)
                  }}
                  disabled={!lesson.videoUrl}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <Play className="size-4 fill-current" />
                  Play
                </button>
                <button
                  onClick={() => toast.info("Coming soon")}
                  className="inline-flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-sm transition-colors hover:bg-white/30"
                >
                  <Plus className="size-5" />
                </button>
              </div>
            </div>
          </>
        ) : lesson.videoUrl ? (
          <div className="h-full w-full">
            {lesson.videoUrl.includes("youtube.com") ||
            lesson.videoUrl.includes("youtu.be") ? (
              <iframe
                className="h-full w-full rounded-lg"
                src={getYouTubeEmbedUrl(lesson.videoUrl)}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : lesson.videoUrl.includes("vimeo.com") ? (
              <iframe
                className="h-full w-full rounded-lg"
                src={getVimeoEmbedUrl(lesson.videoUrl)}
                title={lesson.title}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <VideoPlayer
                url={lesson.videoUrl}
                title={lesson.title}
                lessonId={lesson.id}
                initialPosition={initialPosition}
                posterUrl={lesson.thumbnailUrl}
                nextLesson={nextLessonData}
                onProgress={handleProgress}
                onComplete={handleVideoComplete}
                onNextLesson={handleNextLesson}
                className="h-full w-full rounded-lg"
              />
            )}
          </div>
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

      {/*
        TODO: Wire up instructor toggle
        - LessonVideo has userId + schoolId — multiple teachers can submit videos for the same CatalogLesson
        - Change get-lesson-with-progress.ts: findFirst → findMany, include user/school info
        - Add availableVideos[] to CatalogLessonWithProgress interface
        - Use useState for activeVideoId, default to first (featured) video
        - On click, update videoUrl in the player
      */}
      {/* Instructors */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Instructors</h2>
        <div className="flex gap-3">
          {/* Placeholder instructor cards — replace with real data from availableVideos[] */}
          {[
            { name: "Featured Instructor", role: "Lead Teacher" },
            { name: "Guest Instructor", role: "Subject Expert" },
          ].map((instructor) => (
            <button
              key={instructor.name}
              className="bg-muted/50 hover:bg-muted flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
            >
              <div className="bg-muted flex size-10 items-center justify-center rounded-full">
                <User className="text-muted-foreground size-5" />
              </div>
              <div className="text-start">
                <p className="text-sm font-medium">{instructor.name}</p>
                <p className="text-muted-foreground text-xs">
                  {instructor.role}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

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
              <ChevronLeft className="me-2 size-4" />
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
              <ChevronRight className="ms-2 size-4" />
            </Button>
          </Link>
        ) : (
          <Link href={baseUrl}>
            <Button>
              Back to Course
              <ChevronRight className="ms-2 size-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

// Helper functions for video embedding
function getYouTubeEmbedUrl(url: string): string {
  const videoId = url.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
  )?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}

function getVimeoEmbedUrl(url: string): string {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url
}
