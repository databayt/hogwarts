// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// About School step types

export interface AboutSchoolData {
  viewed: boolean
  viewedAt?: Date
}

export interface WelcomeData {
  totalSteps: number
  estimatedTime: string
  completionRate: number
}

export interface OnboardingStats {
  averageCompletionTime: number
  mostCommonSchoolTypes: string[]
  successfulCompletions: number
}

export interface AboutSchoolProps {
  schoolId?: string
  onContinue?: () => void
  showProgress?: boolean
}
