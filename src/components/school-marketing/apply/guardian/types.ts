// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Guardian Step Types

export interface GuardianFormData {
  fatherName: string
  fatherOccupation?: string
  fatherPhone?: string
  fatherEmail?: string
  motherName: string
  motherOccupation?: string
  motherPhone?: string
  motherEmail?: string
  guardianName?: string
  guardianRelation?: string
  guardianPhone?: string
  guardianEmail?: string
}

export interface GuardianFormRef {
  saveAndNext: () => Promise<void>
}

export interface GuardianFormProps {
  sessionToken?: string
  initialData?: Partial<GuardianFormData>
  onSuccess?: () => void
  dictionary?: Record<string, unknown>
}
