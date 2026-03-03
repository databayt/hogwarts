"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState } from "react"
import Image from "next/image"
import { format } from "date-fns"
import { Camera, Loader2 } from "lucide-react"
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { uploadFile } from "@/components/file"
import { Icons } from "@/components/icons"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { GENDER_OPTIONS } from "./config"
import { StudentFormStepProps } from "./types"
import { studentCreateSchema } from "./validation"

export function InformationStep({ form, isView }: StudentFormStepProps) {
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.students?.information
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
    <div className="grid w-full grid-cols-3 gap-8">
      {/* Avatar Upload */}
      <div className="col-span-3 flex items-center gap-4">
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

      {/* Left Column - Names (2/3 width) */}
      <div className="col-span-2 space-y-4">
        <FormField
          control={form.control}
          name="givenName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder={t?.givenName ?? "Given name"}
                  disabled={isView}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="middleName"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder={t?.middleName ?? "Middle name"}
                  disabled={isView}
                  {...field}
                />
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
                <Input
                  placeholder={t?.surname ?? "Surname"}
                  disabled={isView}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Right Column - Date and Gender */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full ps-3 text-start font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                      disabled={isView}
                    >
                      {field.value ? (
                        format(new Date(field.value), "PPP")
                      ) : (
                        <span>{t?.dateOfBirth ?? "Date of birth"}</span>
                      )}
                      <Icons.calendar className="ms-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0"
                  align="start"
                  sideOffset={4}
                >
                  <Calendar
                    mode="single"
                    selected={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(date?.toISOString().split("T")[0])
                    }
                    disabled={isView}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

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
                    <SelectValue
                      placeholder={t?.selectGender ?? "Select gender"}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">{t?.male ?? "Male"}</SelectItem>
                  <SelectItem value="female">
                    {t?.female ?? "Female"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
