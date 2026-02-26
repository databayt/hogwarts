// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { parentCreateSchema } from "./validation"

export type ParentDTO = {
  id: string
  schoolId: string
  givenName: string
  surname: string
  emailAddress: string | null
  teacherId: string | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

export type ParentRow = {
  id: string
  userId: string | null
  name: string
  emailAddress: string
  status: string
  createdAt: string
}

export interface ParentFormStepProps {
  form: UseFormReturn<z.infer<typeof parentCreateSchema>>
  isView: boolean
}

export type StepFieldKeys = keyof z.infer<typeof parentCreateSchema>
