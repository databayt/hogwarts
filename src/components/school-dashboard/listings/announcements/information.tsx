"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"
import { type UseFormReturn } from "react-hook-form"

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { getPreviousAnnouncements } from "./actions"
import { AnnouncementAutocomplete } from "./autocomplete"
import type { AnnouncementFormValues } from "./validation"

interface InformationStepProps {
  form: UseFormReturn<AnnouncementFormValues>
  isView: boolean
  dictionary: Dictionary["school"]["announcements"]
  lang: Locale
}

interface SuggestionItem {
  id: string
  title: string
  body: string
}

export function InformationStep({
  form,
  isView,
  dictionary,
  lang,
}: InformationStepProps) {
  const t = dictionary

  // Single-language fields
  const titleField = "title" as const
  const bodyField = "body" as const

  // Previous announcements for autocomplete
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])

  // Load previous announcements on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const result = await getPreviousAnnouncements({ displayLang: lang })
        if (result.success && result.data) {
          setSuggestions(
            result.data.map((a) => ({
              id: a.id,
              title: a.title || "",
              body: a.body || "",
            }))
          )
        }
      } catch (error) {
        console.error("Failed to load suggestions:", error)
      }
    }
    loadSuggestions()
  }, [lang])

  // Transform suggestions to options format for autocomplete
  const titleOptions = useMemo(
    () => suggestions.map((s) => ({ id: s.id, value: s.title })),
    [suggestions]
  )

  const bodyOptions = useMemo(
    () => suggestions.map((s) => ({ id: s.id, value: s.body })),
    [suggestions]
  )

  return (
    <div className="w-full space-y-4">
      {/* Title field with autocomplete */}
      <FormField
        control={form.control}
        name={titleField}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{t.titleLabel}</FormLabel>
            <FormControl>
              <AnnouncementAutocomplete
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={titleOptions}
                placeholder={t?.titlePlaceholder || "Enter announcement title"}
                disabled={isView}
                dir={lang === "ar" ? "rtl" : "ltr"}
                autoFocus={!isView}
                emptyMessage={t?.noSuggestions || "No suggestions"}
                groupHeading={t?.previousTitles || "Previous titles"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Body field with autocomplete */}
      <FormField
        control={form.control}
        name={bodyField}
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>{t.contentLabel}</FormLabel>
            <FormControl>
              <AnnouncementAutocomplete
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={bodyOptions}
                placeholder={
                  t?.contentPlaceholder || "Enter announcement content..."
                }
                disabled={isView}
                dir={lang === "ar" ? "rtl" : "ltr"}
                isTextarea
                rows={6}
                emptyMessage={t?.noSuggestions || "No suggestions"}
                groupHeading={t?.previousContent || "Previous content"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
