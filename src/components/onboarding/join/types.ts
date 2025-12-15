export type JoinMethod = "invite-with-codes" | "manual-enrollment"
export type UserRole = "teacher" | "staff" | "student" | "parent" | "admin"
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked"

export interface JoinData {
  joinMethod: JoinMethod
  autoApproval: boolean
  requireParentApproval: boolean
  allowSelfEnrollment: boolean
}

export interface JoinFormData {
  joinMethod: JoinMethod
  autoApproval: boolean
  requireParentApproval: boolean
  allowSelfEnrollment: boolean
}

export interface InviteCode {
  code: string
  role: UserRole
  expiresAt: Date
  maxUses?: number
  currentUses: number
  status: InviteStatus
}

export interface JoinOption {
  id: JoinMethod
  title: string
  subtitle?: string
  description: string
  recommended: boolean
}

export interface RoleLimit {
  role: UserRole
  limit: number
  used: number
}
