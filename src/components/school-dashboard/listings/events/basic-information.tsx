"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useMemo, useState } from "react"

import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Locale } from "@/components/internationalization/config"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getPreviousEvents } from "./actions"
import { EventAutocomplete } from "./autocomplete"
import { EVENT_TYPES } from "./config"
import { EventFormStepProps } from "./types"

interface SuggestionItem {
  id: string
  title: string
  description: string
}

export function BasicInformationStep({
  form,
  isView,
  lang,
}: EventFormStepProps) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.events?.form as
    | Record<string, string>
    | undefined

  // Previous events for autocomplete
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])

  // Load previous events on mount
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const result = await getPreviousEvents({ displayLang: lang })
        if (result.success && result.data) {
          setSuggestions(
            result.data.map((e) => ({
              id: e.id,
              title: e.title || "",
              description: e.description || "",
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

  const descriptionOptions = useMemo(
    () => suggestions.map((s) => ({ id: s.id, value: s.description })),
    [suggestions]
  )

  return (
    <div className="w-full space-y-6">
      {/* Title */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <EventAutocomplete
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={titleOptions}
                placeholder={d?.titlePlaceholder || "Event title"}
                disabled={isView}
                dir={lang === "ar" ? "rtl" : "ltr"}
                autoFocus={!isView}
                emptyMessage={d?.noSuggestions || "No suggestions"}
                groupHeading={d?.previousTitles || "Previous titles"}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Description */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <EventAutocomplete
                value={field.value ?? ""}
                onValueChange={field.onChange}
                options={descriptionOptions}
                placeholder={
                  d?.descriptionPlaceholder || "Event description (optional)"
                }
                disabled={isView}
                dir={lang === "ar" ? "rtl" : "ltr"}
                isTextarea
                rows={4}
                emptyMessage={d?.noSuggestions || "No suggestions"}
                groupHeading={
                  d?.previousDescriptions || "Previous descriptions"
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Event Type */}
      <FormField
        control={form.control}
        name="eventType"
        render={({ field }) => (
          <FormItem>
            <Select
              onValueChange={field.onChange}
              value={field.value}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
