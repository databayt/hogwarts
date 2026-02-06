"use client"

import React, { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/components/auth/use-current-user"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { getUserSchools, initializeSchoolSetup } from "./actions"
import { ErrorBoundary } from "./error-boundary"
import SchoolOnboardingDashboard from "./overview/host-dashboard"
import type { OnboardingSchoolData } from "./types"

// Type for school list items
interface SchoolListItem extends Pick<
  OnboardingSchoolData,
  "id" | "name" | "domain"
> {
  createdAt?: Date | string
  isActive?: boolean
}

interface Props {
  dictionary?: Dictionary["school"]
  locale?: string
}

export default function OnboardingContent({ dictionary, locale }: Props) {
  const router = useRouter()
  const user = useCurrentUser()
  const { update: updateSession } = useSession()
  const { dictionary: d } = useDictionary()
  const [isCreating, setIsCreating] = React.useState(false)
  const [schools, setSchools] = React.useState<SchoolListItem[]>([])
  const [totalSchools, setTotalSchools] = React.useState<number>(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [authChecked, setAuthChecked] = React.useState(false)

  // Auth check - redirect unauthenticated users to login
  useEffect(() => {
    // Wait for user state to be determined
    if (user === undefined) return

    if (user === null) {
      // User is not authenticated - redirect to login with callback
      const currentPath = window.location.pathname
      const loginUrl = `/${locale || "en"}/login?callbackUrl=${encodeURIComponent(currentPath)}`
      router.push(loginUrl)
      return
    }

    setAuthChecked(true)
  }, [user, router, locale])

  // Load schools only after auth check passes
  useEffect(() => {
    if (authChecked) {
      loadUserSchools()
    }
  }, [authChecked])

  // i18n strings with fallbacks
  // Note: These keys may not exist in the dictionary yet, so we use direct fallbacks
  const t = {
    loadFailed: "Failed to load schools",
    createFailed: "Failed to create school",
    creatingSchool: "Creating your school...",
    loading: "Loading...",
  }

  const loadUserSchools = async () => {
    try {
      const response = await getUserSchools()
      if (response.success) {
        const data = response.data || { schools: [], totalCount: 0 }
        setSchools(data.schools || [])
        setTotalSchools(data.totalCount || 0)
      } else {
        console.error("Failed to load schools:", response.error)
        toast.error(t.loadFailed)
      }
    } catch (error) {
      console.error("Failed to load schools:", error)
      toast.error(t.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSchoolClick = (id: string) => {
    // Include locale in the navigation path
    router.push(`/${locale || "en"}/onboarding/${id}/about-school`)
  }

  const handleCreateNew = async () => {
    if (isCreating) return

    setIsCreating(true)
    // Show loading toast
    const loadingToast = toast.loading(t.creatingSchool)

    try {
      const response = await initializeSchoolSetup()
      if (response.success && response.data) {
        toast.dismiss(loadingToast)
        // Refresh session to sync new schoolId into JWT
        try {
          await updateSession()
        } catch {
          // Session refresh may fail, continue with navigation
        }
        // Navigate directly to the school's onboarding with schoolId in URL (no sessionStorage)
        router.push(
          `/${locale || "en"}/onboarding/${response.data.id}/about-school`
        )
      } else {
        toast.dismiss(loadingToast)
        const errorMsg =
          typeof response.error === "string" ? response.error : t.createFailed
        toast.error(errorMsg)
        console.error("Failed to create school:", response.error)
      }
    } catch (error) {
      toast.dismiss(loadingToast)
      toast.error(t.createFailed)
      console.error("Failed to create school:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateFromTemplate = () => {
    router.push(`/${locale || "en"}/onboarding/overview?template=true`)
  }

  // Show loading state while checking auth
  if (!authChecked || isLoading) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center"
        role="status"
        aria-busy="true"
        aria-label={t.loading}
      >
        <div className="mx-auto w-full max-w-xl space-y-3 px-3 sm:space-y-4 sm:px-4">
          {/* Welcome Header skeleton */}
          <div>
            <Skeleton className="mb-3 h-8 w-64 sm:mb-4" />
          </div>

          {/* Schools skeleton */}
          <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>

          {/* New school options skeleton */}
          <div className="space-y-2 sm:space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="space-y-2 rounded-lg border p-3">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen w-full items-center justify-center">
        <SchoolOnboardingDashboard
          userName={user?.name || "Admin"}
          schools={schools.map((school) => ({
            id: school.id!,
            name: school.name || "Unnamed School",
            startDate: school.createdAt
              ? new Date(school.createdAt).toLocaleDateString()
              : "Unknown",
            status: school.isActive ? "active" : ("draft" as const),
            subdomain: school.domain,
          }))}
          totalSchools={totalSchools}
          onSchoolClick={handleSchoolClick}
          onCreateNew={handleCreateNew}
          onCreateFromTemplate={handleCreateFromTemplate}
          dictionary={dictionary}
          locale={locale}
        />
      </div>
    </ErrorBoundary>
  )
}
