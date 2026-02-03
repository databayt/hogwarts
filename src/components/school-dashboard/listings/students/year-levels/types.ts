// Year Level Types
// Matches Prisma model: YearLevel

// ============================================================================
// Year Level Types
// ============================================================================

export interface YearLevel {
  id: string
  schoolId: string
  levelName: string
  levelNameAr?: string | null
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
  levelNameAr?: string
  levelOrder: number
}

export interface UpdateYearLevelInput {
  id: string
  levelName?: string
  levelNameAr?: string
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
