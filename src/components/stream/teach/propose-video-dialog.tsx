"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useState, useTransition } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  Upload,
  Video,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { uploadVideo } from "@/components/stream/video/video-actions"

interface LessonOption {
  id: string
  name: string
  chapterName: string
  subjectName: string
  subjectSlug: string
}

interface Props {
  lessons: LessonOption[]
  children?: React.ReactNode
}

type Step = "select-lesson" | "add-video" | "confirm"

export function ProposeVideoDialog({ lessons, children }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("select-lesson")
  const [isPending, startTransition] = useTransition()

  // Form state
  const [selectedLessonId, setSelectedLessonId] = useState("")
  const [title, setTitle] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [description, setDescription] = useState("")
  const [videoSource, setVideoSource] = useState<"url" | "upload">("url")

  const selectedLesson = lessons.find((l) => l.id === selectedLessonId)

  const resetForm = useCallback(() => {
    setStep("select-lesson")
    setSelectedLessonId("")
    setTitle("")
    setVideoUrl("")
    setDescription("")
    setVideoSource("url")
  }, [])

  function detectProvider(
    url: string
  ): "YOUTUBE" | "VIMEO" | "SELF_HOSTED" | "OTHER" {
    if (url.includes("youtube.com") || url.includes("youtu.be"))
      return "YOUTUBE"
    if (url.includes("vimeo.com")) return "VIMEO"
    if (url.includes("s3.") || url.includes("cloudfront.net"))
      return "SELF_HOSTED"
    return "OTHER"
  }

  function handleSubmit() {
    if (!selectedLessonId || !title.trim() || !videoUrl.trim()) return

    startTransition(async () => {
      const result = await uploadVideo({
        catalogLessonId: selectedLessonId,
        title: title.trim(),
        videoUrl: videoUrl.trim(),
        provider: detectProvider(videoUrl),
      })

      if (result.status === "success") {
        toast.success(
          "Video submitted for review. You'll be notified when it's approved."
        )
        setOpen(false)
        resetForm()
      } else {
        toast.error(result.message)
      }
    })
  }

  const canProceedFromLesson = !!selectedLessonId
  const canProceedFromVideo = !!videoUrl.trim() && !!title.trim()

  // Group lessons by subject for easier browsing
  const lessonsBySubject = lessons.reduce(
    (acc, lesson) => {
      const key = lesson.subjectName
      if (!acc[key]) acc[key] = []
      acc[key].push(lesson)
      return acc
    },
    {} as Record<string, LessonOption[]>
  )

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (!v) resetForm()
      }}
    >
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Video className="mr-2 size-4" />
            Propose a Video
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "select-lesson" && "Select Lesson"}
            {step === "add-video" && "Add Your Video"}
            {step === "confirm" && "Review & Submit"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-lesson" &&
              "Choose which lesson you want to contribute a video for."}
            {step === "add-video" &&
              "Provide the video URL and details. Your video will be reviewed before going live."}
            {step === "confirm" &&
              "Review your submission. You retain full ownership and control over your video."}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-2">
          {(["select-lesson", "add-video", "confirm"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-medium ${
                  s === step
                    ? "bg-primary text-primary-foreground"
                    : (
                          ["select-lesson", "add-video", "confirm"] as Step[]
                        ).indexOf(step) > i
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {(["select-lesson", "add-video", "confirm"] as Step[]).indexOf(
                  step
                ) > i ? (
                  <Check className="size-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              {i < 2 && <div className="bg-muted h-px w-8" />}
            </div>
          ))}
        </div>

        {/* Step 1: Select lesson */}
        {step === "select-lesson" && (
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {Object.entries(lessonsBySubject).map(
              ([subjectName, subjectLessons]) => (
                <div key={subjectName}>
                  <p className="text-muted-foreground sticky top-0 bg-white px-2 py-1 text-xs font-semibold">
                    {subjectName}
                  </p>
                  {subjectLessons.map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`w-full rounded-md px-3 py-2 text-start text-sm transition-colors ${
                        selectedLessonId === lesson.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="font-medium">{lesson.name}</span>
                      <span className="text-muted-foreground block text-xs">
                        {lesson.chapterName}
                      </span>
                    </button>
                  ))}
                </div>
              )
            )}
            {lessons.length === 0 && (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No lessons available for video proposals.
              </p>
            )}
          </div>
        )}

        {/* Step 2: Add video */}
        {step === "add-video" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Video Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Algebra - Lesson 1"
              />
            </div>

            <div className="space-y-2">
              <Label>Video Source</Label>
              <Tabs
                value={videoSource}
                onValueChange={(v) => setVideoSource(v as "url" | "upload")}
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">
                    <ExternalLink className="mr-1.5 size-3.5" />
                    URL
                  </TabsTrigger>
                  <TabsTrigger value="upload">
                    <Upload className="mr-1.5 size-3.5" />
                    Upload
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-2">
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    type="url"
                  />
                  <p className="text-muted-foreground text-xs">
                    Supports YouTube, Vimeo, or direct video URLs.
                  </p>
                </TabsContent>
                <TabsContent value="upload">
                  <div className="text-muted-foreground rounded-lg border-2 border-dashed p-8 text-center text-sm">
                    <Upload className="mx-auto mb-2 size-8 opacity-50" />
                    <p>Direct upload coming soon.</p>
                    <p className="text-xs">
                      For now, use a YouTube or Vimeo URL.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of what this video covers..."
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === "confirm" && selectedLesson && (
          <div className="space-y-3">
            <div className="bg-muted/50 space-y-2 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lesson</span>
                <span className="font-medium">{selectedLesson.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Course</span>
                <span>{selectedLesson.subjectName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Title</span>
                <span>{title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Source</span>
                <span className="max-w-48 truncate text-xs">{videoUrl}</span>
              </div>
            </div>

            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
              <p className="mb-1 font-medium">Your rights are protected</p>
              <ul className="list-inside list-disc space-y-0.5">
                <li>You retain full ownership of your video</li>
                <li>You can change visibility or delete at any time</li>
                <li>Admin review is required before the video goes live</li>
                <li>Even after approval, you control who can see your video</li>
              </ul>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row justify-between gap-2">
          {step !== "select-lesson" && (
            <Button
              variant="outline"
              onClick={() =>
                setStep(step === "confirm" ? "add-video" : "select-lesson")
              }
              disabled={isPending}
            >
              <ArrowLeft className="mr-1.5 size-3.5" />
              Back
            </Button>
          )}
          <div className="flex-1" />
          {step === "select-lesson" && (
            <Button
              onClick={() => setStep("add-video")}
              disabled={!canProceedFromLesson}
            >
              Next
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          )}
          {step === "add-video" && (
            <Button
              onClick={() => setStep("confirm")}
              disabled={!canProceedFromVideo}
            >
              Review
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          )}
          {step === "confirm" && (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit for Review
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
