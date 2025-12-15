"use client"

import { logout } from "./logout-action"

interface LogoutButtonProps {
  children?: React.ReactNode
  className?: string
}

export const LogoutButton = ({ children, className }: LogoutButtonProps) => {
  const onClick = () => {
    logout()
  }

  return (
    <span onClick={onClick} className={className}>
      {children}
    </span>
  )
}
