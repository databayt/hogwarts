// Academic Year Setup Types
// Matches Prisma models: SchoolYear, Term, Period

// ============================================================================
// School Year Types
// ============================================================================

export interface SchoolYear {
  id: string
  schoolId: string
  yearName: string
  startDate: Date
  endDate: Date
  createdAt: Date
  updatedAt: Date
  // Related data (optional, for display)
  terms?: Term[]
  periods?: Period[]
  _count?: {
    terms: number
    periods: number
  }
}

export interface CreateSchoolYearInput {
  yearName: string
  startDate: Date
  endDate: Date
}

export interface UpdateSchoolYearInput {
  id: string
  yearName?: string
  startDate?: Date
  endDate?: Date
}

// ============================================================================
// Term Types
// ============================================================================

export interface Term {
  id: string
  schoolId: string
  yearId: string
  termNumber: number
  startDate: Date
  endDate: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  // Related data
  schoolYear?: SchoolYear
}

export interface CreateTermInput {
  yearId: string
  termNumber: number
  startDate: Date
  endDate: Date
}

export interface UpdateTermInput {
  id: string
  termNumber?: number
  startDate?: Date
  endDate?: Date
  isActive?: boolean
}

// ============================================================================
// Period Types
// ============================================================================

export interface Period {
  id: string
  schoolId: string
  yearId: string
  name: string
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  createdAt: Date
  updatedAt: Date
  // Related data
  schoolYear?: SchoolYear
}

export interface CreatePeriodInput {
  yearId: string
  name: string
  startTime: string
  endTime: string
}

export interface UpdatePeriodInput {
  id: string
  name?: string
  startTime?: string
  endTime?: string
}

export interface BulkCreatePeriodInput {
  yearId: string
  periods: Array<{
    name: string
    startTime: string
    endTime: string
  }>
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Action result type for server actions.
 * Using a simple interface that works with all return patterns.
 */
export interface ActionResult {
  success: boolean
  message?: string
  data?: {
    years?: SchoolYear[]
    year?: SchoolYear
    terms?: Term[]
    activeTerm?: Term
    term?: Term
    periods?: Period[]
    period?: Period
  }
}
