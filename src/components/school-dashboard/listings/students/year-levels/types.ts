// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Year Level Types
// Matches Prisma model: YearLevel

// ============================================================================
// Year Level Types
// ============================================================================

export interface YearLevel {
  id: string
  schoolId: string
  levelName: string
  lang?: string | null
  levelOrder: number
  createdAt: Date
  updatedAt: Date
  // Related data (optional, for display)
  _count?: {
    studentYearLevels: number
    batches: number
  }
}

export interface CreateYearLevelInput {
  levelName: string
  lang?: string
  levelOrder: number
}

export interface UpdateYearLevelInput {
  id: string
  levelName?: string
  lang?: string
  levelOrder?: number
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ActionResult {
  success: boolean
  message?: string
  data?: {
    yearLevels?: YearLevel[]
    yearLevel?: YearLevel
  }
}
