"use client"

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
  const isRTL = lang === "ar"

  // Single-language fields
  const titleField = "title" as const
  const bodyField = "body" as const

  // Previous announcements for autocomplete
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])

  // Load previous announcements on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const result = await getPreviousAnnouncements()
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
  }, [isRTL])

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
                placeholder={
                  isRTL ? "أدخل عنوان الإعلان" : "Enter announcement title"
                }
                disabled={isView}
                dir={isRTL ? "rtl" : "ltr"}
                autoFocus={!isView}
                emptyMessage={isRTL ? "لا توجد اقتراحات" : "No suggestions"}
                groupHeading={isRTL ? "عناوين سابقة" : "Previous titles"}
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
                  isRTL
                    ? "أدخل محتوى الإعلان..."
                    : "Enter announcement content..."
                }
                disabled={isView}
                dir={isRTL ? "rtl" : "ltr"}
                isTextarea
                rows={6}
                emptyMessage={isRTL ? "لا توجد اقتراحات" : "No suggestions"}
                groupHeading={isRTL ? "محتوى سابق" : "Previous content"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
