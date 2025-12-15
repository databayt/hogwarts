"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

import { type Locale } from "@/components/internationalization/config"

interface AdminAuthGuardProps {
  children: React.ReactNode
  lang: Locale
}

export function AdminAuthGuard({ children, lang }: AdminAuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    // Only allow ADMIN or DEVELOPER roles to access admin panel
    if (
      !session ||
      (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER")
    ) {
      router.push(`/${lang}/unauthorized`)
    }
  }, [session, status, router, lang])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    )
  }

  // Only render children if user is authorized
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER")
  ) {
    return null
  }

  return <>{children}</>
}
