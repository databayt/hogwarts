// Department Types
// Matches Prisma model: Department

// ============================================================================
// Teacher Types (for department context)
// ============================================================================

export interface DepartmentTeacher {
  id: string
  givenName: string
  surname: string
  emailAddress: string
  profilePhotoUrl?: string | null
  isPrimary: boolean
}

// ============================================================================
// Subject Types (for department context)
// ============================================================================

export interface DepartmentSubject {
  id: string
  subjectName: string
  lang?: string
}

// ============================================================================
// Department Types
// ============================================================================

export interface Department {
  id: string
  schoolId: string
  departmentName: string
  lang?: string | null
  createdAt: Date
  updatedAt: Date
  // Related data (optional, for display)
  teachers?: DepartmentTeacher[]
  subjects?: DepartmentSubject[]
  _count?: {
    subjects: number
    teacherDepartments: number
  }
}

export interface CreateDepartmentInput {
  departmentName: string
  lang?: string
}

export interface UpdateDepartmentInput {
  id: string
  departmentName?: string
  lang?: string
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ActionResult {
  success: boolean
  message?: string
  data?: {
    departments?: Department[]
    department?: Department
  }
}
