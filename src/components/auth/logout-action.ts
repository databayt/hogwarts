"use server"

import { signOut } from "@/auth"

/**
 * Logout action with context-aware redirect
 *
 * Uses redirect: false to avoid middleware interference.
 * The client handles the redirect after session is cleared.
 *
 * @param returnUrl - Optional URL to redirect to after logout
 *                    Defaults to "/" (homepage)
 *
 * Expected behavior by entry point:
 * - SaaS Marketing (ed.databayt.org) → "/" (homepage)
 * - Operator Dashboard (/dashboard/*) → "/" (homepage)
 * - School Site ({school}.databayt.org) → school homepage
 * - School Platform (/s/{subdomain}/*) → school homepage
 *
 * @returns The URL to redirect to (client handles redirect)
 */
export const logout = async (returnUrl?: string): Promise<string> => {
  const redirectTo = returnUrl || "/"

  console.log("🚪 LOGOUT ACTION TRIGGERED", {
    providedReturnUrl: returnUrl,
    finalRedirectTo: redirectTo,
  })

  // Sign out WITHOUT server redirect to avoid middleware interference
  // When redirect: true is used, the middleware sees the unauthenticated
  // request to the dashboard and redirects to login before the signOut
  // redirect can complete.
  await signOut({
    redirect: false,
  })

  // Return the redirect URL for client-side navigation
  return redirectTo
}
