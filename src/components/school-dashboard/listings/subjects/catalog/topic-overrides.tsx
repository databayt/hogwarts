"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  ListChecks,
  Loader2,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { uploadVideo } from "@/components/stream/video/video-actions"

import { setLessonQuizHidden, toggleContentOverride } from "./actions"

interface Video {
  id: string
  title: string
  instructorName: string
  source: "own-school" | "featured" | "other-school"
  isHidden: boolean
}

interface Lesson {
  id: string
  name: string
  isHidden: boolean
  videoCount?: number
  videos?: Video[]
  quizHidden?: boolean
}

interface Chapter {
  id: string
  name: string
  isHidden: boolean
  lessons: Lesson[]
}

interface Props {
  chapters: Chapter[]
  lang: Locale
}

export function TopicOverrides({ chapters, lang }: Props) {
  const { dictionary } = useDictionary()
  const cat = dictionary?.school?.subjects?.catalog as
    | Record<string, string>
    | undefined
  const [isPending, startTransition] = useTransition()

  // Video upload dialog state
  const [isVideoOpen, setIsVideoOpen] = useState(false)
  const [videoLessonId, setVideoLessonId] = useState("")
  const [videoLessonName, setVideoLessonName] = useState("")
  const [videoTitle, setVideoTitle] = useState("")
  const [videoUrl, setVideoUrl] = useState("")

  const t = {
    hide: cat?.hide || "Hide",
    show: cat?.show || "Show",
    hidden: cat?.hidden || "Hidden",
    lessons: cat?.lessons || "lessons",
    noChapters: cat?.noChapters || "No chapters available",
  }

  function handleToggleChapter(chapterId: string, currentlyHidden: boolean) {
    startTransition(async () => {
      await toggleContentOverride({
        catalogChapterId: chapterId,
        isHidden: !currentlyHidden,
      })
    })
  }

  function handleToggleLesson(lessonId: string, currentlyHidden: boolean) {
    startTransition(async () => {
      await toggleContentOverride({
        catalogLessonId: lessonId,
        isHidden: !currentlyHidden,
      })
    })
  }

  function handleToggleVideo(videoId: string, currentlyHidden: boolean) {
    startTransition(async () => {
      await toggleContentOverride({
        lessonVideoId: videoId,
        isHidden: !currentlyHidden,
      })
    })
  }

  function handleToggleQuiz(lessonId: string, currentlyHidden: boolean) {
    startTransition(async () => {
      await setLessonQuizHidden({
        catalogLessonId: lessonId,
        hideQuiz: !currentlyHidden,
      })
    })
  }

  function handleOpenVideoUpload(lessonId: string, lessonName: string) {
    setVideoLessonId(lessonId)
    setVideoLessonName(lessonName)
    setVideoTitle("")
    setVideoUrl("")
    setIsVideoOpen(true)
  }

  function handleSubmitVideo() {
    if (!videoUrl.trim()) {
      toast.error("Video URL is required")
      return
    }

    const provider =
      videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")
        ? ("YOUTUBE" as const)
        : videoUrl.includes("vimeo.com")
          ? ("VIMEO" as const)
          : ("OTHER" as const)

    startTransition(async () => {
      try {
        const result = await uploadVideo({
          catalogLessonId: videoLessonId,
          title: videoTitle.trim() || videoLessonName,
          videoUrl: videoUrl.trim(),
          provider,
        })

        if (result.status === "success") {
          toast.success("Video submitted for review")
          setIsVideoOpen(false)
        } else {
          toast.error(result.message)
        }
      } catch {
        toast.error("Failed to upload video")
      }
    })
  }

  if (chapters.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        {t.noChapters}
      </p>
    )
  }

  return (
    <>
      <div className="space-y-1">
        {chapters.map((chapter) => (
          <ChapterRow
            key={chapter.id}
            chapter={chapter}
            t={t}
            onToggleChapter={handleToggleChapter}
            onToggleLesson={handleToggleLesson}
            onToggleVideo={handleToggleVideo}
            onToggleQuiz={handleToggleQuiz}
            onUploadVideo={handleOpenVideoUpload}
            isPending={isPending}
          />
        ))}
      </div>

      {/* Video Upload Dialog */}
      <Dialog open={isVideoOpen} onOpenChange={setIsVideoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription>
              Add a video for &quot;{videoLessonName}&quot;. It will be
              submitted for review before becoming visible to students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tv-title">Video Title</Label>
              <Input
                id="tv-title"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder={videoLessonName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tv-url">Video URL *</Label>
              <Input
                id="tv-url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
              />
              <p className="text-muted-foreground text-xs">
                Supports YouTube, Vimeo, or direct video links
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVideoOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitVideo} disabled={isPending}>
              {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
              Submit Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ChapterRow({
  chapter,
  t,
  onToggleChapter,
  onToggleLesson,
  onToggleVideo,
  onToggleQuiz,
  onUploadVideo,
  isPending,
}: {
  chapter: Chapter
  t: Record<string, string>
  onToggleChapter: (id: string, hidden: boolean) => void
  onToggleLesson: (id: string, hidden: boolean) => void
  onToggleVideo: (videoId: string, hidden: boolean) => void
  onToggleQuiz: (lessonId: string, hidden: boolean) => void
  onUploadVideo: (lessonId: string, lessonName: string) => void
  isPending: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="hover:bg-muted flex items-center gap-2 rounded-md px-3 py-2">
        <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-sm">
          {open ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 rtl:rotate-180" />
          )}
          <span
            className={cn(
              "font-medium",
              chapter.isHidden && "line-through opacity-50"
            )}
          >
            {chapter.name}
          </span>
          <Badge variant="outline" className="ms-auto text-xs">
            {chapter.lessons.length} {t.lessons}
          </Badge>
          {chapter.isHidden && (
            <Badge variant="secondary" className="text-xs">
              {t.hidden}
            </Badge>
          )}
        </CollapsibleTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={isPending}
          onClick={() => onToggleChapter(chapter.id, chapter.isHidden)}
        >
          {chapter.isHidden ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>
      </div>
      <CollapsibleContent>
        <div className="ms-6 space-y-0.5 border-s py-1 ps-4">
          {chapter.lessons.map((lesson) => (
            <div key={lesson.id}>
              <div className="group flex items-center gap-2 py-1 text-sm">
                <BookOpen className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
                <span
                  className={cn(
                    "text-muted-foreground flex-1",
                    lesson.isHidden && "line-through opacity-50"
                  )}
                >
                  {lesson.name}
                </span>
                {(lesson.videoCount ?? 0) > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {lesson.videoCount} video
                    {lesson.videoCount !== 1 ? "s" : ""}
                  </Badge>
                )}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={isPending}
                    onClick={() => onUploadVideo(lesson.id, lesson.name)}
                    title="Upload video"
                  >
                    <Video className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-6 w-6 p-0",
                      lesson.quizHidden && "text-muted-foreground/50"
                    )}
                    disabled={isPending}
                    onClick={() =>
                      onToggleQuiz(lesson.id, lesson.quizHidden ?? false)
                    }
                    title={lesson.quizHidden ? "Show quiz" : "Hide quiz"}
                  >
                    <ListChecks className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    disabled={isPending}
                    onClick={() => onToggleLesson(lesson.id, lesson.isHidden)}
                    title={lesson.isHidden ? "Show lesson" : "Hide lesson"}
                  >
                    {lesson.isHidden ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
              {/* Per-video hide/show */}
              {lesson.videos && lesson.videos.length > 0 && (
                <div className="ms-8 space-y-0.5 border-s py-0.5 ps-3">
                  {lesson.videos.map((video) => (
                    <div
                      key={video.id}
                      className="group/video flex items-center gap-2 py-0.5 text-xs"
                    >
                      <Video className="text-muted-foreground h-3 w-3 shrink-0" />
                      <span
                        className={cn(
                          "text-muted-foreground flex-1",
                          video.isHidden && "line-through opacity-50"
                        )}
                      >
                        {video.title}
                      </span>
                      <Badge
                        variant="outline"
                        className="px-1 py-0 text-[10px]"
                      >
                        {video.instructorName}
                      </Badge>
                      {video.isHidden && (
                        <Badge
                          variant="secondary"
                          className="px-1 py-0 text-[10px]"
                        >
                          {t.hidden}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0 opacity-0 group-hover/video:opacity-100"
                        disabled={isPending}
                        onClick={() => onToggleVideo(video.id, video.isHidden)}
                      >
                        {video.isHidden ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {chapter.lessons.length === 0 && (
            <p className="text-muted-foreground py-2 text-xs">No lessons yet</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
