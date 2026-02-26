// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import type { Locale } from "@/components/internationalization/config"

import { eventCreateSchema } from "./validation"

export type EventDTO = {
  id: string
  schoolId: string
  title: string
  description: string | null
  eventType:
    | "ACADEMIC"
    | "SPORTS"
    | "CULTURAL"
    | "PARENT_MEETING"
    | "CELEBRATION"
    | "WORKSHOP"
    | "OTHER"
  eventDate: Date
  startTime: string
  endTime: string
  location: string | null
  organizer: string | null
  targetAudience: string | null
  maxAttendees: number | null
  currentAttendees: number
  status: "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"
  isPublic: boolean
  registrationRequired: boolean
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export type EventRow = {
  id: string
  title: string
  eventType: string
  eventDate: string
  startTime: string
  endTime: string
  location: string
  organizer: string
  targetAudience: string
  maxAttendees: number | null
  currentAttendees: number
  status: string
  isPublic: boolean
  createdAt: string
}

export interface EventFormStepProps {
  form: UseFormReturn<z.infer<typeof eventCreateSchema>>
  isView: boolean
  lang?: Locale
}

export type StepFieldKeys = keyof z.infer<typeof eventCreateSchema>
