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
 * - Operator Dashboard (/dashboard/*) → "/" (homepage)
 * - School Site ({school}.databayt.org) → school homepage
 * - School Platform (/s/{subdomain}/*) → school homepage
 *
 * Uses client-side redirect after server action to avoid middleware
 * interference (middleware would redirect unauthenticated users to login).
 */
export const LogoutButton = ({ children, className }: LogoutButtonProps) => {
  const pathname = usePathname()

  const onClick = async () => {
    // Extract locale from pathname (e.g., /en/dashboard → en, /en → en)
    const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/)
    const locale = localeMatch ? localeMatch[1] : "ar"

    // For ALL entry points: use /{locale} as the public return URL
    // - On main domain: browser navigates to /en → SaaS homepage
    // - On school subdomain: browser navigates to /en → proxy rewrites to /en/s/{subdomain}/
    const returnUrl = `/${locale}`

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
