// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { subjectCreateSchema } from "./validation"

export type SubjectDTO = {
  id: string
  name: string
  department: string
  slug: string
  lang: string
  createdAt: Date
  updatedAt: Date
}

export type SubjectRow = {
  id: string
  name: string
  department: string
  createdAt: string
}

export interface SubjectFormStepProps {
  form: UseFormReturn<z.infer<typeof subjectCreateSchema>>
  isView: boolean
}

export type StepFieldKeys = keyof z.infer<typeof subjectCreateSchema>
