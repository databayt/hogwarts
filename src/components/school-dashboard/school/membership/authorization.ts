import type { UserRole } from "@prisma/client"

export type MembershipAction =
  | "read"
  | "change_role"
  | "assign_grade"
  | "suspend"
  | "activate"
  | "remove"
  | "approve"
  | "reject"
  | "invite"
  | "resend_invitation"
  | "export"
  | "bulk_action"

export interface AuthContext {
  userId: string
  role: UserRole
  schoolId: string | null
}

export function checkMembershipPermission(
  auth: AuthContext,
  action: MembershipAction,
  targetSchoolId?: string
): boolean {
  // DEVELOPER has full access
  if (auth.role === "DEVELOPER") return true

  // Must have schoolId
  if (!auth.schoolId) return false

  // Must match school
  if (targetSchoolId && auth.schoolId !== targetSchoolId) return false

  // ADMIN has full school membership management
  if (auth.role === "ADMIN") return true

  // TEACHER can only read and export
  if (auth.role === "TEACHER") {
    return action === "read" || action === "export"
  }

  // All other roles: no access
  return false
}

export function assertMembershipPermission(
  auth: AuthContext,
  action: MembershipAction,
  targetSchoolId?: string
): void {
  if (!checkMembershipPermission(auth, action, targetSchoolId)) {
    throw new Error("Insufficient permissions for this membership action")
  }
}

export function canManageMembers(role: string): boolean {
  return ["DEVELOPER", "ADMIN"].includes(role)
}

export function canViewMembers(role: string): boolean {
  return ["DEVELOPER", "ADMIN", "TEACHER"].includes(role)
}

export function getAuthContext(
  session: {
    user?: { id?: string; role?: string; schoolId?: string }
  } | null
): AuthContext | null {
  if (!session?.user?.id || !session?.user?.role) return null
  return {
    userId: session.user.id,
    role: session.user.role as UserRole,
    schoolId: session.user.schoolId ?? null,
  }
}
