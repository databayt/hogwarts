"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  ACCEPT_IMAGES,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file/upload/file-uploader"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { updateHeroImage } from "./actions"
import { useAutoSave } from "./use-auto-save"

interface Props {
  schoolId: string
  initialData: {
    heroImageUrl: string
  }
  lang: Locale
  dictionary: Dictionary
}

export function ConfigHeroForm({
  schoolId,
  initialData,
  lang,
  dictionary,
}: Props) {
  const t = dictionary?.school?.configuration?.hero
  const [, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [isDirty, setIsDirty] = useState(false)
  const [heroImage, setHeroImage] = useState(initialData.heroImageUrl)

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const uploadedFile = files[0]
      // Use the direct S3 URL — it's public-read and renders. Do NOT use cdnUrl:
      // it points at cdn.databayt.org, which fronts the *curated* bucket (not
      // this upload bucket) and 403s on every fresh upload (broken images).
      setHeroImage(uploadedFile.url)
      setIsDirty(true)
    }
  }

  const handleRemove = () => {
    setHeroImage("")
    setIsDirty(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      setError("")
      const result = await updateHeroImage(schoolId, {
        heroImageUrl: heroImage || "",
      })
      if (result.success) {
        setIsDirty(false)
      } else {
        setError(
          result.error || t?.updateError || "Failed to update hero image"
        )
      }
    })
  }

  useAutoSave(handleSave, isDirty)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t?.title ?? "Hero Background Image"}</Label>
        <p className="text-muted-foreground text-xs">
          {t?.description ??
            "This image appears as the background of your school's homepage hero section."}
        </p>
        <div className="h-[240px]">
          {!heroImage ? (
            <FileUploader
              category="IMAGE"
              folder="school-hero"
              accept={ACCEPT_IMAGES}
              maxFiles={1}
              multiple={false}
              maxSize={10 * 1024 * 1024}
              optimizeImages={true}
              autoUpload={true}
              onUploadComplete={handleUploadComplete}
              onUploadError={(err) => setError(err)}
              className="h-full [&>div]:h-full"
            />
          ) : (
            <div className="relative h-full overflow-hidden rounded-lg border">
              <Image
                src={heroImage}
                alt={t?.imageAlt ?? "Hero background"}
                fill
                className="object-cover"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute end-2 top-2"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
