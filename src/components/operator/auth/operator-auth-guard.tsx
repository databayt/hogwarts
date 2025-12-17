"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import type { Locale } from "@/components/internationalization/config"

import { OperatorLoadingSkeleton } from "./operator-loading-skeleton"

interface OperatorAuthGuardProps {
  children: React.ReactNode
  lang: Locale
}

export function OperatorAuthGuard({ children, lang }: OperatorAuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  // Debug logging for session state
  console.log("[OPERATOR-GUARD] Session state:", {
    status,
    hasSession: !!session,
    userId: session?.user?.id,
    userRole: session?.user?.role,
    roleType: typeof session?.user?.role,
    userEmail: session?.user?.email,
    fullUser: session?.user,
  })

  useEffect(() => {
    if (status === "loading") {
      console.log("[OPERATOR-GUARD] Still loading...")
      return
    }

    console.log("[OPERATOR-GUARD] Checking access:", {
      hasSession: !!session,
      role: session?.user?.role,
      isDevRole: session?.user?.role === "DEVELOPER",
      roleComparison: `"${session?.user?.role}" === "DEVELOPER" => ${session?.user?.role === "DEVELOPER"}`,
    })

    // Only DEVELOPER role can access operator dashboard
    if (!session || session?.user?.role !== "DEVELOPER") {
      console.log(
        "[OPERATOR-GUARD] Access denied, redirecting to:",
        `/${lang}?access=denied`
      )
      router.push(`/${lang}?access=denied`)
    } else {
      console.log("[OPERATOR-GUARD] Access granted for DEVELOPER")
    }
  }, [session, status, router, lang])

  if (status === "loading") {
    return <OperatorLoadingSkeleton />
  }

  if (!session || session?.user?.role !== "DEVELOPER") {
    console.log("[OPERATOR-GUARD] Rendering null while redirecting")
    return null // Prevent flash while redirecting
  }

  return <>{children}</>
}
