"use client"

import { useCallback, useState, useTransition } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  FileDown,
  Loader2,
  Play,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { LessonWithProgress } from "@/components/stream/data/course/get-lesson-with-progress"
import { VideoPlayer } from "@/components/stream/shared/video-player"

import { markLessonComplete, markLessonIncomplete } from "./actions"

interface StreamLessonContentProps {
  dictionary: Record<string, unknown>
  lang: string
  schoolId: string | null
  subdomain: string
  lesson: LessonWithProgress
}

export function StreamLessonContent({
  dictionary,
  lang,
  schoolId,
  subdomain,
  lesson,
}: StreamLessonContentProps) {
  const [isCompleted, setIsCompleted] = useState(
    lesson.progress?.isCompleted ?? false
  )
  const [isPending, startTransition] = useTransition()

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

  const baseUrl = `/${lang}/s/${subdomain}/stream/dashboard/${lesson.chapter.course.slug}`

  return (
    <div className="space-y-6 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={baseUrl}
          className="text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="size-4" />
          Back to Course
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{lesson.chapter.title}</span>
        <span className="text-muted-foreground">/</span>
        <span>{lesson.title}</span>
      </div>

      {/* Video Player */}
      <Card>
        <CardContent className="p-0">
          {lesson.videoUrl ? (
            <div className="aspect-video w-full">
              {/* Check if it's a YouTube URL */}
              {lesson.videoUrl.includes("youtube.com") ||
              lesson.videoUrl.includes("youtu.be") ? (
                <iframe
                  className="h-full w-full rounded-t-lg"
                  src={getYouTubeEmbedUrl(lesson.videoUrl)}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : lesson.videoUrl.includes("vimeo.com") ? (
                <iframe
                  className="h-full w-full rounded-t-lg"
                  src={getVimeoEmbedUrl(lesson.videoUrl)}
                  title={lesson.title}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <VideoPlayer
                  url={lesson.videoUrl}
                  title={lesson.title}
                  onComplete={handleVideoComplete}
                  className="h-full w-full rounded-t-lg"
                />
              )}
            </div>
          ) : (
            <div className="bg-muted flex aspect-video items-center justify-center rounded-t-lg">
              <div className="text-center">
                <Play className="text-muted-foreground mx-auto mb-2 size-12" />
                <p className="text-muted-foreground">No video available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="mr-2 size-4 text-green-500" />
              ) : (
                <Circle className="mr-2 size-4" />
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
          {lesson.duration && (
            <p className="text-muted-foreground mb-4 text-sm">
              Duration: {lesson.duration} minutes
            </p>
          )}

          {/* Attachments */}
          {lesson.attachments.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <h4 className="font-medium">Resources</h4>
                <div className="grid gap-2">
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {lesson.previousLesson ? (
          <Link href={`${baseUrl}/${lesson.previousLesson.id}`}>
            <Button variant="outline">
              <ChevronLeft className="mr-2 size-4" />
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
              <ChevronRight className="ml-2 size-4" />
            </Button>
          </Link>
        ) : (
          <Link href={baseUrl}>
            <Button>
              Back to Course
              <ChevronRight className="ml-2 size-4" />
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
