"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"

import { ModeSwitcher } from "./mode-switcher"

interface RightActionsProps {
  isAuthenticated: boolean
}

export function RightActions({ isAuthenticated }: RightActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <Button variant="secondary" size="sm" className="muted px-4" asChild>
          <LogoutButton>Logout</LogoutButton>
        </Button>
      ) : (
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "muted px-4"
          )}
        >
          Login
        </Link>
      )}
      <ModeSwitcher />
    </div>
  )
}
