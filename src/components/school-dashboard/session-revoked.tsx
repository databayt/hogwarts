"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { logout } from "@/components/auth/logout-action"

/**
 * Rendered by MustChangePasswordGate when the password was reset after this
 * session signed in (User.tokenVersion moved on). Clears the cookie and sends
 * the person to sign in with the new login.
 */
export function SessionRevoked({ lang }: { lang: string }) {
  useEffect(() => {
    logout(`/${lang}/login`).then((to) => window.location.replace(to))
  }, [lang])
  return null
}
