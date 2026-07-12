"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState, useTransition } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  ACCEPT_IMAGES,
  FileUploader,
  type UploadedFileResult,
} from "@/components/file/upload/file-uploader"
import type { Locale } from "@/components/internationalization/config"

import { updateSchoolBranding } from "./actions"
import { useAutoSave } from "./use-auto-save"

const BORDER_RADIUS_OPTIONS = [
  { value: "none", label: "None (0px)" },
  { value: "sm", label: "Small (2px)" },
  { value: "md", label: "Medium (6px)" },
  { value: "lg", label: "Large (8px)" },
  { value: "xl", label: "Extra Large (12px)" },
  { value: "full", label: "Full (9999px)" },
]

interface Props {
  schoolId: string
  initialData: {
    logoUrl: string
    primaryColor: string
    secondaryColor: string
    borderRadius: string
  }
  lang: Locale
}

export function ConfigBrandingForm({ schoolId, initialData, lang }: Props) {
  const [, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [isDirty, setIsDirty] = useState(false)
  const [logo, setLogo] = useState(initialData.logoUrl)
  const [primaryColor, setPrimaryColor] = useState(
    initialData.primaryColor || "#000000"
  )
  const [secondaryColor, setSecondaryColor] = useState(
    initialData.secondaryColor || "#ffffff"
  )
  const [borderRadius, setBorderRadius] = useState(
    initialData.borderRadius || "md"
  )

  const handleUploadComplete = (files: UploadedFileResult[]) => {
    if (files.length > 0) {
      const uploadedFile = files[0]
      // Use the direct S3 URL — it's public-read and renders. Do NOT use cdnUrl:
      // it points at cdn.databayt.org, which fronts the *curated* bucket (not
      // this upload bucket) and 403s on every fresh upload (broken logos).
      setLogo(uploadedFile.url)
      setIsDirty(true)
    }
  }

  const handleRemoveLogo = () => {
    setLogo("")
    setIsDirty(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      setError("")
      const result = await updateSchoolBranding(schoolId, {
        logoUrl: logo || "",
        primaryColor,
        secondaryColor,
        borderRadius,
      })
      if (result.success) {
        setIsDirty(false)
      } else {
        setError(result.error || "Failed to update branding")
      }
    })
  }

  useAutoSave(handleSave, isDirty)

  return (
    <div className="space-y-6">
      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>School Logo</Label>
        <div className="h-[200px]">
          {!logo ? (
            <FileUploader
              category="IMAGE"
              folder="school-logos"
              accept={ACCEPT_IMAGES}
              maxFiles={1}
              multiple={false}
              maxSize={5 * 1024 * 1024}
              optimizeImages={true}
              autoUpload={true}
              onUploadComplete={handleUploadComplete}
              onUploadError={(err) => setError(err)}
              className="h-full [&>div]:h-full"
            />
          ) : (
            <div className="relative h-full overflow-hidden rounded-lg border">
              <Image
                src={logo}
                alt="School logo"
                fill
                className="object-contain p-8"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute end-2 top-2"
                onClick={handleRemoveLogo}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Primary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => {
                setPrimaryColor(e.target.value)
                setIsDirty(true)
              }}
              className="h-10 w-10 cursor-pointer rounded border"
            />
            <Input
              value={primaryColor}
              onChange={(e) => {
                setPrimaryColor(e.target.value)
                setIsDirty(true)
              }}
              placeholder="#000000"
              className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Secondary Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => {
                setSecondaryColor(e.target.value)
                setIsDirty(true)
              }}
              className="h-10 w-10 cursor-pointer rounded border"
            />
            <Input
              value={secondaryColor}
              onChange={(e) => {
                setSecondaryColor(e.target.value)
                setIsDirty(true)
              }}
              placeholder="#ffffff"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <Label>Border Radius</Label>
        <Select
          value={borderRadius}
          onValueChange={(v) => {
            setBorderRadius(v)
            setIsDirty(true)
          }}
        >
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BORDER_RADIUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
