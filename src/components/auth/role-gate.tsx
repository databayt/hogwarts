"use client"

import { UserRole } from "@prisma/client"

import { FormError } from "./error/form-error"
import { useCurrentRole } from "./use-current-role"

interface RoleGateProps {
  children: React.ReactNode
  allowedRole: UserRole
}

export const RoleGate = ({ children, allowedRole }: RoleGateProps) => {
  const role = useCurrentRole()

  if (role !== allowedRole) {
    return (
      <FormError message="You do not have permission to view this content!" />
    )
  }

  return <>{children}</>
}
