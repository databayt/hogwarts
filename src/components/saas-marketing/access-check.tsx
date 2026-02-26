"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { useSearchParams } from "next/navigation"

import { ErrorToast } from "@/components/atom/toast"

export function AccessCheck() {
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get("access") === "denied") {
      ErrorToast(
        "You don't have permission to access the saas-dashboard dashboard"
      )
      // Clean up URL to remove the query param
      window.history.replaceState({}, "", window.location.pathname)
    }
  }, [searchParams])

  return null
}
