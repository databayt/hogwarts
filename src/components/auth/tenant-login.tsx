"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { mainOriginFromLocation } from "@/lib/root-domain"
import { Button } from "@/components/ui/button"

export function TenantLoginButton({
  tenantSubdomain,
}: {
  tenantSubdomain: string
}) {
  const handleLogin = () => {
    // Central auth lives on the current root's marketing host
    // (ed.databayt.org / balqalam.com / localhost:3000)
    const baseUrl = mainOriginFromLocation()

    // Login on main domain with tenant context
    const loginUrl = `${baseUrl}/api/auth/signin/facebook?callbackUrl=${encodeURIComponent(
      `${baseUrl}/api/auth/callback/facebook?tenant=${tenantSubdomain}`
    )}`

    console.log("🔗 Redirecting to login:", loginUrl)
    window.location.href = loginUrl
  }

  return (
    <Button onClick={handleLogin} className="w-full">
      Login with Facebook
    </Button>
  )
}
