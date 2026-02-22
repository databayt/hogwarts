"use client"

import { useCallback, useEffect, useState, useTransition } from "react"
import { Loader2, Star, Trash2, Video } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  VideoInput,
  type VideoInputMetadata,
} from "@/components/stream/admin/courses/video-input"

import {
  createLessonVideo,
  deleteLessonVideo,
  getLessonVideos,
  toggleLessonVideoFeatured,
} from "./video-actions"

interface LessonVideoItem {
  id: string
  title: string
  videoUrl: string
  provider: string
  durationSeconds: number | null
  isFeatured: boolean
  visibility: string
  approvalStatus: string
  storageKey: string | null
  createdAt: Date
}

interface LessonVideoManagerProps {
  lessonId: string
  lessonName: string
}

export function LessonVideoManager({
  lessonId,
  lessonName,
}: LessonVideoManagerProps) {
  const [videos, setVideos] = useState<LessonVideoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  // New video form state
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoTitle, setVideoTitle] = useState("")
  const [videoMeta, setVideoMeta] = useState<VideoInputMetadata | null>(null)

  // Load existing videos
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const result = await getLessonVideos(lessonId)
        if (!cancelled) setVideos(result)
      } catch {
        if (!cancelled) toast.error("Failed to load videos")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [lessonId])

  const handleVideoChange = useCallback(
    (url: string | null, metadata?: VideoInputMetadata) => {
      setVideoUrl(url)
      if (metadata) setVideoMeta(metadata)
    },
    []
  )

  const handleAddVideo = () => {
    if (!videoUrl || !videoTitle.trim()) {
      toast.error("Title and video are required")
      return
    }

    startTransition(async () => {
      try {
        const result = await createLessonVideo({
          catalogLessonId: lessonId,
          title: videoTitle.trim(),
          videoUrl,
          durationSeconds: videoMeta?.videoDuration
            ? Math.round(videoMeta.videoDuration)
            : undefined,
          storageProvider: videoMeta?.storageProvider ?? undefined,
          storageKey: videoMeta?.storageKey ?? undefined,
        })

        if (result.success) {
          // Refresh list
          const updated = await getLessonVideos(lessonId)
          setVideos(updated)
          // Reset form
          setVideoUrl(null)
          setVideoTitle("")
          setVideoMeta(null)
          toast.success("Video added")
        }
      } catch {
        toast.error("Failed to add video")
      }
    })
  }

  const handleDelete = (videoId: string) => {
    startTransition(async () => {
      try {
        await deleteLessonVideo(videoId)
        setVideos((prev) => prev.filter((v) => v.id !== videoId))
        toast.success("Video deleted")
      } catch {
        toast.error("Failed to delete video")
      }
    })
  }

  const handleToggleFeatured = (videoId: string) => {
    startTransition(async () => {
      try {
        const result = await toggleLessonVideoFeatured(videoId)
        if (result.success) {
          setVideos((prev) =>
            prev.map((v) =>
              v.id === videoId ? { ...v, isFeatured: result.isFeatured } : v
            )
          )
        }
      } catch {
        toast.error("Failed to toggle featured")
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Manage videos for <strong>{lessonName}</strong>
      </p>

      {/* Existing videos */}
      {videos.length > 0 && (
        <div className="space-y-2">
          <Label>Existing Videos ({videos.length})</Label>
          <div className="space-y-2">
            {videos.map((video) => (
              <div
                key={video.id}
                className="border-border flex items-center gap-3 rounded-lg border p-3"
              >
                <Video className="text-muted-foreground h-4 w-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{video.title}</p>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {video.provider}
                    </Badge>
                    {video.durationSeconds && (
                      <Badge variant="outline" className="text-xs">
                        {Math.floor(video.durationSeconds / 60)}m{" "}
                        {video.durationSeconds % 60}s
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleToggleFeatured(video.id)}
                  disabled={isPending}
                  title={
                    video.isFeatured ? "Remove from featured" : "Set featured"
                  }
                >
                  <Star
                    className={`size-3.5 ${video.isFeatured ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleDelete(video.id)}
                  disabled={isPending}
                >
                  <Trash2 className="text-destructive size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add new video */}
      <div className="space-y-4">
        <Label>Add Video</Label>

        <div className="space-y-2">
          <Label htmlFor="video-title">Title</Label>
          <Input
            id="video-title"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            placeholder="e.g., Introduction to the topic"
          />
        </div>

        <VideoInput value={videoUrl} onChange={handleVideoChange} />

        <Button
          onClick={handleAddVideo}
          disabled={isPending || !videoUrl || !videoTitle.trim()}
          className="w-full"
        >
          {isPending && <Loader2 className="me-2 size-4 animate-spin" />}
          Add Video
        </Button>
      </div>
    </div>
  )
}
