"use client"

import { useRouter } from "next/navigation"
import { CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import ProfileContent from "../client"
import type { ProfileViewData } from "../queries"

interface ProfileDetailContentProps {
  profileData: ProfileViewData | null
  errorCode?: string | null
  dictionary: Dictionary
  lang?: Locale
}

export function ProfileDetailContent({
  profileData,
  errorCode,
  dictionary,
  lang,
}: ProfileDetailContentProps) {
  const router = useRouter()

  const p = dictionary?.school?.profile as Record<string, any> | undefined
  const errors = p?.errors as Record<string, string> | undefined

  // Error state
  if (errorCode || !profileData) {
    const message =
      (errorCode && errors?.[errorCodeToKey(errorCode)]) ||
      errors?.failedToLoad ||
      ""
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{errors?.error}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()}>{errors?.goBack}</Button>
        </div>
      </div>
    )
  }

  return <ProfileContent data={profileData} dictionary={p} lang={lang} />
}

function errorCodeToKey(code: string): string {
  switch (code) {
    case "NOT_AUTHENTICATED":
      return "notAuthenticated"
    case "MISSING_SCHOOL":
      return "missingSchool"
    case "NOT_FOUND":
      return "notFound"
    default:
      return "failedToLoad"
  }
}

/**
 * Loading skeleton for the profile detail page (matches the real two-column
 * layout: sidebar + main with contribution graph).
 */
export function ProfileDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <Skeleton className="size-52 rounded-full lg:size-56" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-6 lg:col-span-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-[140px] w-full" />
        </div>
      </div>
    </div>
  )
}
