"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { EventFormStepProps } from "./types"
import { eventCreateSchema } from "./validation"

export function DetailsAttendeesStep({ form, isView }: EventFormStepProps) {
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.events?.form as
    | Record<string, string>
    | undefined
  const audiences = dictionary?.school?.events?.targetAudiences as
    | Record<string, string>
    | undefined
  return (
    <div className="w-full space-y-6">
      {/* Organizer */}
      <FormField
        control={form.control}
        name="organizer"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                placeholder={
                  d?.organizerPlaceholder ||
                  "Event organizer (e.g., Teacher Name, Department)"
                }
                disabled={isView}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Target Audience */}
      <FormField
        control={form.control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <Select
              onValueChange={field.onChange}
              value={field.value || ""}
              disabled={isView}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      d?.selectTargetAudience || "Select target audience"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {(
                  [
                    { key: "allStudents", value: "All Students" },
                    { key: "primaryStudents", value: "Primary Students" },
                    { key: "secondaryStudents", value: "Secondary Students" },
                    { key: "teachersOnly", value: "Teachers Only" },
                    { key: "parentsOnly", value: "Parents Only" },
                    { key: "staffOnly", value: "Staff Only" },
                    { key: "public", value: "Public" },
                    { key: "specificClass", value: "Specific Class" },
                    { key: "other", value: "Other" },
                  ] as const
                ).map((audience) => (
                  <SelectItem key={audience.value} value={audience.value}>
                    {audiences?.[audience.key] || audience.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Max Attendees */}
      <FormField
        control={form.control}
        name="maxAttendees"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Input
                type="number"
                placeholder={
                  d?.maxAttendeesPlaceholder ||
                  "Maximum number of attendees (optional)"
                }
                disabled={isView}
                {...field}
                onChange={(e) =>
                  field.onChange(
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Public Event and Registration */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isView}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {d?.publicEvent || "Public Event"}
                </label>
                <p className="text-muted-foreground text-sm">
                  {d?.publicEventDescription ||
                    "This event is open to the public"}
                </p>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="registrationRequired"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-y-0 gap-x-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isView}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <label className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {d?.registrationRequired || "Registration Required"}
                </label>
                <p className="text-muted-foreground text-sm">
                  {d?.registrationRequiredDescription ||
                    "Attendees must register to attend this event"}
                </p>
              </div>
            </FormItem>
          )}
        />
      </div>

      {/* Notes */}
      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Textarea
                placeholder={
                  d?.notesPlaceholder ||
                  "Additional notes or special instructions (optional)"
                }
                disabled={isView}
                {...field}
                rows={4}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
