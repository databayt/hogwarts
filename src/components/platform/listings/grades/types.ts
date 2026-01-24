import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { type Dictionary } from "@/components/internationalization/dictionaries"

import { resultCreateSchema } from "./validation"

export type ResultDTO = {
  id: string
  schoolId: string
  studentId: string
  assignmentId: string
  classId: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  feedback: string | null
  submittedAt: Date | null
  gradedAt: Date | null
  student?: { id: string; givenName: string; surname: string } | null
  assignment?: { id: string; title: string; totalPoints: number } | null
  class?: { id: string; name: string } | null
  createdAt: Date
  updatedAt: Date
}

export type ResultRow = {
  id: string
  studentName: string
  assignmentTitle: string
  className: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  createdAt: string
}

export interface ResultFormStepProps {
  form: UseFormReturn<z.infer<typeof resultCreateSchema>>
  isView: boolean
  dictionary: Dictionary["school"]["grades"]
}

export type StepFieldKeys = keyof z.infer<typeof resultCreateSchema>
