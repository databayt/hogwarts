import type {
  JoinMethod,
  MembershipRequestStatus,
  UserRole,
} from "@prisma/client"

import type { ReadinessLevel, ReadinessReason } from "../readiness/rules"

/** Readiness facts merged onto a member row (serializable). */
export type MemberReadinessFields = {
  deviceClient: "app" | "web" | null
  devicePlatform: string | null
  appVersion: number | null
  /** School-local relative text («منذ ٣ أيام»); null = never seen. */
  lastSeenAtStr: string | null
  /** Joined / expected, 0-100; null when no classes were expected. */
  attendancePct: number | null
  /** null = no readiness data for this member. */
  readinessLevel: ReadinessLevel | null
  readinessReasons: ReadinessReason[]
  failedSignIns3d: number
  pushOn: boolean
}

export type UnifiedMember = {
  id: string
  name: string
  /** The login handle (the school's 6-digit code) — searchable. */
  username: string | null
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
} & Partial<MemberReadinessFields>

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
