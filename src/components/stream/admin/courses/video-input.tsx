"use client"

import { useState } from "react"
import { LinkIcon, Upload, Video, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Uploader } from "@/components/file/upload/uploader"

interface VideoInputProps {
  value: string | null | undefined
  onChange: (url: string | null) => void
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

/**
 * VideoInput component with tabs for:
 * - Upload Video: S3 upload via Uploader component
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
    // Basic URL validation
    if (url.startsWith("http://") || url.startsWith("https://")) {
      onChange(url)
    } else if (url === "") {
      onChange(null)
    }
  }

  // Handle upload complete
  const handleUploadComplete = (results: Array<{ url: string }>) => {
    if (results.length > 0 && results[0].url) {
      onChange(results[0].url)
    }
  }

  // Handle remove
  const handleRemove = () => {
    onChange(null)
    setUrlInput("")
  }

  // If we have a value, show preview with remove button
  if (value) {
    return (
      <div className={cn("space-y-2", className)}>
        <div className="border-border bg-muted/50 flex items-center gap-3 rounded-lg border p-3">
          <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded">
            <Video className="text-primary h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {value.includes("s3.") ? "Uploaded Video" : "External Video"}
            </p>
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
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "upload" | "url")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" disabled={disabled}>
            <Upload className="mr-2 h-4 w-4" />
            {t.uploadTab}
          </TabsTrigger>
          <TabsTrigger value="url" disabled={disabled}>
            <LinkIcon className="mr-2 h-4 w-4" />
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
