"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { i18n, type Locale } from "./config"

/**
 * Server action to set the user's locale preference
 * Sets a secure cookie and redirects to the new locale URL
 *
 * @param locale - The locale to switch to (en or ar)
 * @param pathname - The current pathname to redirect to with new locale
 */
export async function setLocale(locale: Locale, pathname: string) {
  // Validate locale
  if (!i18n.locales.includes(locale)) {
    throw new Error(`Invalid locale: ${locale}`)
  }

  // Set cookie with secure options
  const cookieStore = await cookies()
  cookieStore.set("NEXT_LOCALE", locale, {
    maxAge: 31536000, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  // Extract the new path by replacing the locale segment
  // Handles paths like: /en/... or /ar/...
  const newPath = pathname.replace(/^\/(en|ar)(\/|$)/, `/${locale}$2`)

  // Redirect to the new locale URL
  // This ensures the cookie is set BEFORE the page loads
  redirect(newPath)
}
