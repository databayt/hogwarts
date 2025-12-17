"use client"

import { usePathname, useRouter } from "next/navigation"

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
 * - Operator Dashboard (/dashboard/*) → "/" (homepage)
 * - School Site ({school}.databayt.org) → school homepage
 * - School Platform (/s/{subdomain}/*) → school homepage
 *
 * Uses client-side redirect after server action to avoid middleware
 * interference (middleware would redirect unauthenticated users to login).
 */
export const LogoutButton = ({ children, className }: LogoutButtonProps) => {
  const pathname = usePathname()
  const router = useRouter()

  const onClick = async () => {
    // Determine public return URL based on current location
    let returnUrl = "/"

    // Extract locale from pathname (e.g., /en/dashboard → en)
    const localeMatch = pathname.match(/^\/([a-z]{2})\//)
    const locale = localeMatch ? localeMatch[1] : "ar"

    // If on school subdomain platform, return to school homepage
    if (pathname.includes("/s/")) {
      const match = pathname.match(/\/s\/([^/]+)/)
      if (match) {
        const subdomain = match[1]
        returnUrl = `/${locale}/s/${subdomain}/` // School homepage
      }
    } else {
      // For marketing site and operator dashboard, go to homepage with locale
      returnUrl = `/${locale}`
    }

    // Call logout action (clears session server-side)
    await logout(returnUrl)

    // Client-side redirect to avoid middleware interference
    // Using window.location for hard navigation to ensure session state is fresh
    window.location.href = returnUrl
  }

  return (
    <span onClick={onClick} className={className}>
      {children}
    </span>
  )
}
