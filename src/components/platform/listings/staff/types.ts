import { type UseFormReturn } from "react-hook-form"
import { z } from "zod"

import { staffCreateSchema } from "./validation"

export type StaffDTO = {
  id: string
  schoolId: string
  employeeId: string | null
  givenName: string
  surname: string
  gender: string | null
  emailAddress: string
  position: string | null
  departmentId: string | null
  employmentStatus: string
  employmentType: string
  joiningDate: Date | null
  userId: string | null
  createdAt: Date
  updatedAt: Date
}

export type StaffRow = {
  id: string
  userId: string | null
  name: string
  emailAddress: string
  position: string
  departmentName: string
  employmentStatus: string
  employmentType: string
  status: string
  createdAt: string
}

export interface StaffFormStepProps {
  form: UseFormReturn<z.infer<typeof staffCreateSchema>>
  isView: boolean
}

export type StepFieldKeys = keyof z.infer<typeof staffCreateSchema>
