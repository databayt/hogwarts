// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { subjectCreateSchema } from "./validation"

export type SubjectDTO = {
  id: string
  schoolId: string
  departmentId: string
  subjectName: string
  catalogSubjectId?: string | null
  department?: { id: string; departmentName: string } | null
  createdAt: Date
  updatedAt: Date
}

export type SubjectRow = {
  id: string
  subjectName: string
  departmentName: string
  createdAt: string
}

export interface SubjectFormStepProps {
  form: UseFormReturn<z.infer<typeof subjectCreateSchema>>
  isView: boolean
}

export type StepFieldKeys = keyof z.infer<typeof subjectCreateSchema>
