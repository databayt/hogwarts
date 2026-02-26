// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Academic Step Types

export interface AcademicFormData {
  previousSchool?: string
  previousClass?: string
  previousMarks?: string
  previousPercentage?: string
  achievements?: string
  applyingForClass: string
  preferredStream?: string
  secondLanguage?: string
  thirdLanguage?: string
}

export interface AcademicFormRef {
  saveAndNext: () => Promise<void>
}

export interface AcademicFormProps {
  sessionToken?: string
  initialData?: Partial<AcademicFormData>
  onSuccess?: () => void
  dictionary?: Record<string, unknown>
}
