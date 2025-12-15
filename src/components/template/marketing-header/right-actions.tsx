"use client"

import Link from "next/link"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { LanguageSwitcher } from "@/components/internationalization/language-switcher"

import { ModeSwitcher } from "./mode-switcher"

interface RightActionsProps {
  isAuthenticated: boolean
  dictionary?: Dictionary
}

export function RightActions({
  isAuthenticated,
  dictionary,
}: RightActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <LogoutButton
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "muted bg-muted cursor-pointer px-4"
          )}
        >
          {dictionary?.auth?.signOut || "Logout"}
        </LogoutButton>
      ) : (
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "muted bg-muted px-4"
          )}
        >
          {dictionary?.auth?.signIn || "Login"}
        </Link>
      )}
      <LanguageSwitcher variant="toggle" />
      <ModeSwitcher />
    </div>
  )
}
