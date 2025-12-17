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

  useEffect(() => {
    if (status === "loading") return

    // Only DEVELOPER role can access operator dashboard
    if (!session || session.user.role !== "DEVELOPER") {
      router.push(`/${lang}?access=denied`)
    }
  }, [session, status, router, lang])

  if (status === "loading") {
    return <OperatorLoadingSkeleton />
  }

  if (!session || session.user.role !== "DEVELOPER") {
    return null // Prevent flash while redirecting
  }

  return <>{children}</>
}
