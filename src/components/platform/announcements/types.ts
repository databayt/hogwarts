import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { announcementCreateSchema } from "./validation"

export type AnnouncementDTO = {
  id: string
  schoolId: string
  title: string
  body: string
  language: "en" | "ar"
  scope: "school" | "class" | "role"
  classId: string | null
  class?: { id: string; name: string } | null
  role: string | null
  published: boolean
  createdAt: Date
  updatedAt: Date
}

export type AnnouncementRow = {
  id: string
  title: string
  language: string
  scope: string
  published: boolean
  createdAt: string
}

export interface AnnouncementFormStepProps {
  form: UseFormReturn<z.infer<typeof announcementCreateSchema>>
  isView: boolean
}

export type StepFieldKeys = keyof z.infer<typeof announcementCreateSchema>
