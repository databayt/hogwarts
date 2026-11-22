"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { forgetSavedPages } from "@/components/offline/forget-saved-pages"

import { logout } from "./logout-action"
import { loginUrlFor } from "./switch-account-url"

/**
 * Sign out, then land on this school's login page — for a person who is signed
 * in with an account that has no place in the school (the access-denied
 * screen). Same sign-out as `LogoutButton`: forget the saved pages, run the
 * `logout` action, then a hard navigation so the session state is fresh.
 */
export function SwitchAccountButton({
  lang,
  callbackUrl,
  children,
}: {
  lang: string
  /** Where to return after signing in with the other account. */
  callbackUrl?: string
  children: React.ReactNode
}) {
  const [pending, setPending] = useState(false)

  const onClick = async () => {
    setPending(true)
    const loginUrl = loginUrlFor(lang, callbackUrl)
    try {
      await forgetSavedPages()
      await logout(loginUrl)
    } finally {
      window.location.href = loginUrl
    }
  }

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="min-h-11 px-6"
    >
      {children}
    </Button>
  )
}
