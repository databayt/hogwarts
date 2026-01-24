"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Languages, Moon, MoreVertical, Sun, User } from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface MobileActionsMenuProps {
  className?: string
}

export function MobileActionsMenu({ className }: MobileActionsMenuProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const currentLang = pathname.split("/")[1] || "en"
  const nextLang = currentLang === "ar" ? "en" : "ar"

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  const switchLanguage = () => {
    const segments = pathname.split("/")
    segments[1] = nextLang
    document.cookie = `NEXT_LOCALE=${nextLang}; path=/; max-age=31536000; samesite=lax`
    router.push(segments.join("/"))
  }

  const goToProfile = () => {
    router.push(`/${currentLang}/login`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("size-8", className)}>
          <MoreVertical className="size-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={switchLanguage}>
          <Languages className="size-4" />
          {nextLang === "ar" ? "العربية" : "English"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={toggleTheme}>
          {resolvedTheme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={goToProfile}>
          <User className="size-4" />
          Sign in
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
