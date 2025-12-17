"use client"

import { usePathname } from "next/navigation"

import { logout } from "./logout-action"

interface LogoutButtonProps {
  children?: React.ReactNode
  className?: string
}

/**
 * Context-aware logout button
 *
 * Determines the appropriate public return URL based on current location:
 * - SaaS Marketing (ed.databayt.org) → "/" (homepage)
 * - Operator Dashboard (/o/*) → "/" (homepage)
 * - School Site ({school}.databayt.org) → school homepage
 * - School Platform (/s/{subdomain}/*) → school homepage
 */
export const LogoutButton = ({ children, className }: LogoutButtonProps) => {
  const pathname = usePathname()

  const onClick = () => {
    // Determine public return URL based on current location
    let returnUrl = "/"

    // If on school subdomain platform, return to school homepage
    if (pathname.includes("/s/")) {
      const match = pathname.match(/\/s\/([^/]+)/)
      if (match) {
        const subdomain = match[1]
        // Extract locale from pathname (e.g., /en/s/school/dashboard → en)
        const localeMatch = pathname.match(/^\/([a-z]{2})\//)
        const locale = localeMatch ? localeMatch[1] : "ar"
        returnUrl = `/${locale}/s/${subdomain}/` // School homepage
      }
    }

    logout(returnUrl)
  }

  return (
    <span onClick={onClick} className={className}>
      {children}
    </span>
  )
}
