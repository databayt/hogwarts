/**
 * Custom hook for timetable permissions
 * Provides role-based access control for UI components
 */

import { useMemo } from "react"
import { useSession } from "next-auth/react"

import { getUIConfigForRole, type TimetableRole } from "./permissions-config"

/**
 * Hook to get current user's timetable permissions
 */
export function useTimetablePermissions() {
  const { data: session } = useSession()
  const role = session?.user?.role as TimetableRole | undefined

  const permissions = useMemo(() => {
    return getUIConfigForRole(role)
  }, [role])

  const viewType = useMemo(() => {
    if (!role) return "readonly"

    switch (role) {
      case "DEVELOPER":
      case "ADMIN":
        return "admin"
      case "TEACHER":
        return "teacher"
      case "STUDENT":
        return "student"
      case "GUARDIAN":
        return "guardian"
      default:
        return "readonly"
    }
  }, [role])

  return {
    role,
    permissions,
    viewType,
    isAdmin: role === "ADMIN" || role === "DEVELOPER",
    isTeacher: role === "TEACHER",
    isStudent: role === "STUDENT",
    isGuardian: role === "GUARDIAN",
    canEdit: permissions.showEditButton,
    canExport: permissions.showExportButton,
    canConfigure: permissions.showConfigButton,
    readOnlyMode: permissions.readOnlyMode,
  }
}
