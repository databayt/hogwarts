"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { exchangeCodeForToken } from "@/lib/haAuth"

export default function AuthCallback() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const code = params.get("code")
    if (code) {
      exchangeCodeForToken(code).then(() => {
        router.push("/") // Return Page
      })
    }
  }, [params, router])

  return <p>Completing login...</p>
}
