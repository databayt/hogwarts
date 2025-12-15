"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"

import type { UserRole } from "@/components/platform/settings/role-management"

/**
 * Hook to get the current effective role (considering preview mode)
 */
export const useEffectiveRole = () => {
  const session = useSession()
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null)

  useEffect(() => {
    // Check if preview mode is active
    const previewMode = localStorage.getItem("preview-mode") === "true"
    const storedPreviewRole = localStorage.getItem(
      "preview-role"
    ) as UserRole | null

    if (previewMode && storedPreviewRole) {
      setPreviewRole(storedPreviewRole)
    }
  }, [])

  // Return preview role if active, otherwise return actual role
  return previewRole || session.data?.user?.role
}

/**
 * Hook to check if preview mode is active
 */
export const useIsPreviewMode = () => {
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    const previewMode = localStorage.getItem("preview-mode") === "true"
    setIsPreviewMode(previewMode)
  }, [])

  return isPreviewMode
}

/**
 * Hook to get both actual and preview roles
 */
export const useRoleInfo = () => {
  const session = useSession()
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  useEffect(() => {
    const previewMode = localStorage.getItem("preview-mode") === "true"
    const storedPreviewRole = localStorage.getItem(
      "preview-role"
    ) as UserRole | null

    setIsPreviewMode(previewMode)
    if (previewMode && storedPreviewRole) {
      setPreviewRole(storedPreviewRole)
    }
  }, [])

  return {
    actualRole: session.data?.user?.role,
    previewRole,
    effectiveRole: previewRole || session.data?.user?.role,
    isPreviewMode,
  }
}
