"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState } from "react"
import Image from "next/image"
import { Camera, Loader2 } from "lucide-react"
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { uploadFile } from "@/components/file"

import { GENDER_OPTIONS } from "./config"
import { TeacherFormStepProps } from "./types"
import { teacherCreateSchema } from "./validation"

export function InformationStep({ form, isView }: TeacherFormStepProps) {
  const [avatarUrl, setAvatarUrl] = useState(
    form.getValues("profilePhotoUrl") || ""
  )
  const [isUploading, setIsUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const result = await uploadFile(formData, {
        category: "image",
        folder: "avatars",
      })
      if (result.success) {
        setAvatarUrl(result.url)
        form.setValue("profilePhotoUrl", result.url)
      }
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="grid w-full grid-cols-2 gap-8">
      {/* Avatar Upload */}
      <div className="col-span-2 flex items-center gap-4">
        <button
          type="button"
          className="relative size-20 shrink-0 overflow-hidden rounded-full border"
          onClick={() => fileRef.current?.click()}
          disabled={isView || isUploading}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Photo" fill className="object-cover" />
          ) : (
            <div className="bg-muted flex size-full items-center justify-center">
              <Camera className="text-muted-foreground size-6" />
            </div>
          )}
          {!isView && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
              <Camera className="size-5 text-white" />
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="size-5 animate-spin text-white" />
            </div>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
          disabled={isView}
        />
        <div>
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-muted-foreground text-xs">Click to upload</p>
        </div>
      </div>

      {/* Left Column - Names */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="givenName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Given name" disabled={isView} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="surname"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Surname" disabled={isView} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Right Column - Gender & Birth Date */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isView}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {GENDER_OPTIONS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="birthDate"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="date"
                  placeholder="Birth date"
                  disabled={isView}
                  value={
                    field.value instanceof Date
                      ? field.value.toISOString().split("T")[0]
                      : field.value || ""
                  }
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? new Date(e.target.value) : undefined
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
