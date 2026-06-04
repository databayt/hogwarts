"use client"

import { useRouter } from "next/navigation"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import ProfileContent from "../client"
import type { ProfileRole } from "../types"

interface ProfileDetailContentProps {
  profileData: Record<string, unknown> | null
  role: ProfileRole
  isOwner: boolean
  userId: string
  error?: string | null
  dictionary?: Dictionary
  lang?: Locale
}

export function ProfileDetailContent({
  profileData,
  role,
  isOwner,
  userId,
  error,
  dictionary,
  lang,
}: ProfileDetailContentProps) {
  const router = useRouter()

  const p = (dictionary as any)?.profile

  // Map server error codes → translated messages (never render a raw code).
  const ERROR_KEY: Record<string, string> = {
    NOT_AUTHENTICATED: "notAuthenticated",
    MISSING_SCHOOL: "missingSchool",
    NOT_FOUND: "notFound",
  }
  const errorMessage = error
    ? (p?.errors?.[ERROR_KEY[error] ?? "failedToLoad"] ??
      p?.errors?.failedToLoad ??
      "Failed to load profile")
    : (p?.errors?.failedToLoad ?? "Failed to load profile")

  // Error state
  if (error || !profileData) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{p?.errors?.error ?? "Error"}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()}>
            {p?.errors?.goBack ?? "Go Back"}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ProfileContent
      role={role}
      data={profileData}
      dictionary={dictionary as Record<string, unknown>}
      lang={lang}
      isOwner={isOwner}
      userId={userId}
    />
  )
}

/**
 * Loading skeleton for profile detail page
 */
export function ProfileDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <Skeleton className="h-96 w-full" />
        </div>
        <div className="lg:col-span-9">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    </div>
  )
}
