"use client"

import { useCallback, useState } from "react"
import Image from "next/image"
import {
  CheckCircle2,
  Clock,
  LinkIcon,
  Loader2,
  Upload,
  Video,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  formatDuration,
  formatResolution,
  type VideoMetadata,
} from "@/lib/video-metadata"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Uploader } from "@/components/file/upload/uploader"

export interface VideoInputMetadata {
  thumbnailDataUrl?: string
  videoDuration?: number
  videoResolution?: string
  videoSize?: number
  storageProvider?: string
  storageKey?: string
}

interface VideoInputProps {
  value: string | null | undefined
  onChange: (url: string | null, metadata?: VideoInputMetadata) => void
  disabled?: boolean
  className?: string
  dictionary?: {
    uploadTab?: string
    urlTab?: string
    uploadPlaceholder?: string
    urlPlaceholder?: string
    removeVideo?: string
  }
}

type UploadState = "idle" | "uploading" | "extracting" | "complete"

/**
 * VideoInput component with tabs for:
 * - Upload Video: S3 upload via Uploader component (with metadata extraction)
 * - Video URL: External URL input
 */
export function VideoInput({
  value,
  onChange,
  disabled = false,
  className,
  dictionary,
}: VideoInputProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "url">(
    value?.startsWith("http") && !value?.includes("s3.") ? "url" : "upload"
  )
  const [urlInput, setUrlInput] = useState(
    value?.startsWith("http") && !value?.includes("s3.") ? value : ""
  )
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null)

  const t = {
    uploadTab: dictionary?.uploadTab ?? "Upload Video",
    urlTab: dictionary?.urlTab ?? "Video URL",
    uploadPlaceholder:
      dictionary?.uploadPlaceholder ?? "Drag & drop video or click to browse",
    urlPlaceholder:
      dictionary?.urlPlaceholder ?? "https://youtube.com/watch?v=...",
    removeVideo: dictionary?.removeVideo ?? "Remove video",
  }

  // Handle URL input change
  const handleUrlChange = (url: string) => {
    setUrlInput(url)
    if (url.startsWith("http://") || url.startsWith("https://")) {
      onChange(url)
    } else if (url === "") {
      onChange(null)
    }
  }

  // Extract metadata from a video URL using a hidden video element
  const extractMetadataFromUrl = useCallback(
    async (videoUrl: string): Promise<VideoMetadata | null> => {
      return new Promise((resolve) => {
        const video = document.createElement("video")
        video.preload = "metadata"
        video.muted = true
        video.crossOrigin = "anonymous"

        const timeout = setTimeout(() => {
          video.remove()
          resolve(null)
        }, 15_000)

        video.addEventListener("loadedmetadata", () => {
          if (!video.duration || !video.videoWidth || !video.videoHeight) {
            clearTimeout(timeout)
            video.remove()
            resolve(null)
            return
          }
          video.currentTime = Math.min(video.duration * 0.25, 10)
        })

        video.addEventListener("seeked", () => {
          clearTimeout(timeout)
          try {
            const canvas = document.createElement("canvas")
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext("2d")
            const result: VideoMetadata = {
              duration: video.duration,
              width: video.videoWidth,
              height: video.videoHeight,
              thumbnailDataUrl: "",
            }
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              result.thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.7)
            }
            video.remove()
            resolve(result)
          } catch {
            video.remove()
            resolve(null)
          }
        })

        video.addEventListener("error", () => {
          clearTimeout(timeout)
          video.remove()
          resolve(null)
        })

        video.src = videoUrl
      })
    },
    []
  )

  // Handle upload complete — extract metadata from the uploaded video URL
  const handleUploadComplete = useCallback(
    async (results: Array<{ url: string }>) => {
      if (results.length === 0 || !results[0].url) return

      const url = results[0].url
      setUploadState("extracting")

      let meta: VideoMetadata | null = null
      try {
        meta = await extractMetadataFromUrl(url)
        if (meta) setMetadata(meta)
      } catch {
        // Non-critical
      }

      setUploadState("complete")

      onChange(url, {
        thumbnailDataUrl: meta?.thumbnailDataUrl,
        videoDuration: meta?.duration,
        videoResolution: meta ? `${meta.width}x${meta.height}` : undefined,
        storageProvider: url.includes("s3.") ? "aws_s3" : "vercel_blob",
      })
    },
    [onChange, extractMetadataFromUrl]
  )

  // Handle remove
  const handleRemove = () => {
    onChange(null)
    setUrlInput("")
    setMetadata(null)
    setUploadState("idle")
  }

  // If we have a value, show preview with remove button
  if (value) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="border-border bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
          {/* Thumbnail preview */}
          {metadata?.thumbnailDataUrl ? (
            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded">
              <Image
                src={metadata.thumbnailDataUrl}
                alt="Video thumbnail"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded">
              <Video className="text-primary h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium">
                {value.includes("s3.") || value.includes("cloudfront")
                  ? "Uploaded Video"
                  : "External Video"}
              </p>
              {metadata && (
                <div className="flex items-center gap-1.5">
                  {metadata.duration && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="me-1 h-3 w-3" />
                      {formatDuration(metadata.duration)}
                    </Badge>
                  )}
                  {metadata.width && metadata.height && (
                    <Badge variant="outline" className="text-xs">
                      {formatResolution(metadata.width, metadata.height)}
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <p className="text-muted-foreground truncate text-xs">{value}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={disabled}
            title={t.removeVideo}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Metadata extraction status */}
      {uploadState === "extracting" && (
        <div className="border-border bg-muted/50 rounded-lg border p-3">
          <div className="flex items-center gap-2 text-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Extracting metadata...
          </div>
        </div>
      )}

      {/* Metadata preview (after extraction, before upload completes) */}
      {metadata && uploadState !== "complete" && (
        <div className="border-border bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
          {metadata.thumbnailDataUrl && (
            <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded">
              <Image
                src={metadata.thumbnailDataUrl}
                alt="Thumbnail preview"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span>{formatDuration(metadata.duration)}</span>
            <span className="text-muted-foreground">
              {formatResolution(metadata.width, metadata.height)}
            </span>
          </div>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "upload" | "url")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" disabled={disabled}>
            <Upload className="me-2 h-4 w-4" />
            {t.uploadTab}
          </TabsTrigger>
          <TabsTrigger value="url" disabled={disabled}>
            <LinkIcon className="me-2 h-4 w-4" />
            {t.urlTab}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-3">
          <Uploader
            category="video"
            type="lesson"
            folder="courses"
            provider="aws_s3"
            tier="warm"
            maxSize={5 * 1024 * 1024 * 1024} // 5GB
            maxFiles={1}
            disabled={disabled}
            showPreview={false}
            showFileList={true}
            variant="default"
            placeholder={t.uploadPlaceholder}
            onUploadComplete={handleUploadComplete}
            dictionary={{
              dropzone: t.uploadPlaceholder,
              browse: "Browse",
              uploading: "Uploading...",
              uploadComplete: "Upload complete",
              uploadFailed: "Upload failed",
              remove: "Remove",
              maxSize: "Max size",
            }}
          />
        </TabsContent>

        <TabsContent value="url" className="mt-3">
          <Input
            placeholder={t.urlPlaceholder}
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
            disabled={disabled}
            type="url"
          />
          <p className="text-muted-foreground mt-1.5 text-xs">
            Paste a YouTube, Vimeo, or other video URL
          </p>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VideoInput
