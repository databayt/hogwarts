"use client"

import { useCallback, useState, useTransition } from "react"
import Image from "next/image"
import { IconPhoto, IconTrash, IconUpload } from "@tabler/icons-react"
import Dropzone from "react-dropzone"
import { toast } from "sonner"

import { getCatalogImageUrl } from "@/lib/catalog-image-url"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import { deleteCatalogThumbnail, uploadCatalogThumbnail } from "./image-actions"

interface CatalogImageUploadProps {
  entityType: "subject" | "chapter" | "lesson"
  entityId: string
  currentThumbnailKey?: string | null
  currentImageKey?: string | null
  className?: string
}

export function CatalogImageUpload({
  entityType,
  entityId,
  currentThumbnailKey,
  currentImageKey,
  className,
}: CatalogImageUploadProps) {
  const [thumbnailKey, setThumbnailKey] = useState(currentThumbnailKey)
  const [preview, setPreview] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const currentUrl = getCatalogImageUrl(thumbnailKey, currentImageKey, "md")

  const onDrop = useCallback(
    (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return

      // Show preview immediately
      setPreview(URL.createObjectURL(file))

      const formData = new FormData()
      formData.append("file", file)

      startTransition(async () => {
        const result = await uploadCatalogThumbnail(
          formData,
          entityType,
          entityId
        )
        if (result.status === "success" && result.thumbnailKey) {
          setThumbnailKey(result.thumbnailKey)
          setPreview(null)
          toast.success("Thumbnail uploaded")
        } else {
          setPreview(null)
          toast.error(result.error || "Upload failed")
        }
      })
    },
    [entityType, entityId]
  )

  const handleDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteCatalogThumbnail(entityType, entityId)
      if (result.status === "success") {
        setThumbnailKey(null)
        toast.success("Thumbnail removed")
      } else {
        toast.error(result.error || "Delete failed")
      }
    })
  }, [entityType, entityId])

  const displaySrc = preview || currentUrl

  return (
    <div className={cn("space-y-3", className)}>
      {/* Current image preview */}
      {displaySrc ? (
        <div className="relative overflow-hidden rounded-lg border">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="h-48 w-full object-cover"
            />
          ) : thumbnailKey ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displaySrc}
              alt="Current thumbnail"
              className="h-48 w-full object-cover"
            />
          ) : (
            <Image
              src={displaySrc}
              alt="Current image"
              width={600}
              height={192}
              className="h-48 w-full object-cover"
            />
          )}
          {isPending && (
            <div className="bg-background/80 absolute inset-0 flex items-center justify-center">
              <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
            </div>
          )}
        </div>
      ) : null}

      {/* Upload dropzone */}
      <Dropzone
        onDrop={onDrop}
        accept={{ "image/*": [".png", ".jpg", ".jpeg", ".webp"] }}
        maxSize={10 * 1024 * 1024}
        maxFiles={1}
        disabled={isPending}
      >
        {({ getRootProps, getInputProps, isDragActive }) => (
          <div
            {...getRootProps()}
            className={cn(
              "border-muted-foreground/25 hover:bg-muted/25 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition",
              isDragActive && "border-primary bg-primary/5",
              isPending && "pointer-events-none opacity-50"
            )}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <IconPhoto className="text-primary h-5 w-5" />
            ) : (
              <IconUpload className="text-muted-foreground h-5 w-5" />
            )}
            <span className="text-muted-foreground text-sm">
              {isDragActive
                ? "Drop image here"
                : displaySrc
                  ? "Replace thumbnail"
                  : "Upload thumbnail"}
            </span>
          </div>
        )}
      </Dropzone>

      {/* Delete button */}
      {thumbnailKey && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          <IconTrash className="mr-1.5 h-4 w-4" />
          Remove CDN thumbnail
        </Button>
      )}
    </div>
  )
}
