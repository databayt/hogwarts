"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import Link from "next/link"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/logout-button"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { ModeSwitcher } from "./mode-switcher"

interface RightActionsProps {
  isAuthenticated: boolean
  locale: string
}

export function RightActions({ isAuthenticated, locale }: RightActionsProps) {
  const { dictionary } = useDictionary()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = (dictionary as any)?.marketing?.site?.nav as
    | Record<string, string>
    | undefined

  return (
    <div className="flex items-center gap-2">
      {isAuthenticated ? (
        <Button variant="secondary" size="sm" className="muted px-4" asChild>
          <LogoutButton>{nav?.logout || "Logout"}</LogoutButton>
        </Button>
      ) : (
        <Link
          href={`/${locale}/login`}
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "muted px-4"
          )}
        >
          {nav?.login || "Login"}
        </Link>
      )}
      <ModeSwitcher />
    </div>
  )
}
