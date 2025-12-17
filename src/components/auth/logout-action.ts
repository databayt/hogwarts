"use server"

import { signOut } from "@/auth"

/**
 * Logout action with context-aware redirect
 *
 * @param returnUrl - Optional URL to redirect to after logout
 *                    Defaults to "/" (homepage)
 *
 * Expected behavior by entry point:
 * - SaaS Marketing (ed.databayt.org) → "/" (homepage)
 * - Operator Dashboard (/o/*) → "/" (homepage)
 * - School Site ({school}.databayt.org) → school homepage
 * - School Platform (/s/{subdomain}/*) → school homepage
 */
export const logout = async (returnUrl?: string) => {
  const redirectTo = returnUrl || "/"

  console.log("🚪 LOGOUT ACTION TRIGGERED", {
    providedReturnUrl: returnUrl,
    finalRedirectTo: redirectTo,
  })

  // Sign out and redirect to the appropriate public page
  await signOut({
    redirectTo,
    redirect: true,
  })
}
