// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Stand Out step types

export interface StandOutFormData {
  description?: string
  features: string[]
  uniqueSellingPoints?: string[]
  specialPrograms?: string[]
  achievements?: string[]
}

export interface StandOutFeature {
  id: string
  label: string
  description: string
  category: "academic" | "facilities" | "programs" | "achievements"
}

export interface StandOutData {
  description?: string
  features: string[]
}

export interface StandOutProps {
  schoolId: string
  initialData?: StandOutData
  onSubmit?: (data: StandOutFormData) => Promise<void>
  onBack?: () => void
  isSubmitting?: boolean
}
