import type {
  JoinMethod,
  MembershipRequestStatus,
  UserRole,
} from "@prisma/client"

export type UnifiedMember = {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: UserRole
  memberStatus: "active" | "suspended" | "inactive"
  roleSpecificStatus: string | null
  joinedAt: Date
  emailVerified: boolean
  image: string | null
  studentId: string | null
  teacherId: string | null
  staffMemberId: string | null
  guardianId: string | null
  gradeName: string | null
  academicGradeId: string | null
  contextInfo: string | null
  /** Teaching load / family size, formatted (and translated) by the column. */
  classCount: number
  childCount: number
}

export type MembershipRequestRow = {
  id: string
  email: string
  name: string | null
  requestedRole: UserRole
  status: MembershipRequestStatus
  joinMethod: JoinMethod
  createdAt: Date
  expiresAt: Date | null
  lastResentAt: Date | null
  resentCount: number
}
