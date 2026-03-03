/**
 * Main Profile Router Component
 * Fetches session data and renders the GitHub-style ProfileContent
 */

"use client"

import * as React from "react"
import { CircleAlert } from "lucide-react"
import { useSession } from "next-auth/react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"
import OldProfileContent from "@/components/profile/content"
import type { ProfileRole } from "@/components/profile/types"

import { getProfileBasicData } from "./actions"

// Map NextAuth role to ProfileRole
function toProfileRole(role?: string): ProfileRole {
  switch (role) {
    case "STUDENT":
      return "student"
    case "TEACHER":
      return "teacher"
    case "GUARDIAN":
      return "parent"
    case "ADMIN":
    case "DEVELOPER":
    case "STAFF":
    case "ACCOUNTANT":
      return "staff"
    default:
      return "staff"
  }
}

export function ProfileContent() {
  const { dictionary, isLoading: isDictionaryLoading } = useDictionary()
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [profileData, setProfileData] = React.useState<Record<
    string,
    unknown
  > | null>(null)
  const [isLoadingData, setIsLoadingData] = React.useState(false)

  // Fetch profile data when session is available
  React.useEffect(() => {
    if (!session?.user?.id) return

    setIsLoadingData(true)
    getProfileBasicData(session.user.id, locale)
      .then((result) => {
        if (result.success) {
          setProfileData(result.data)
        }
      })
      .finally(() => setIsLoadingData(false))
  }, [session?.user?.id, locale])

  // Loading state
  if (
    status === "loading" ||
    isDictionaryLoading ||
    !dictionary ||
    isLoadingData
  ) {
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

  // Unauthenticated state
  if (status === "unauthenticated" || !session) {
    return (
      <div className="space-y-4">
        <Alert>
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please sign in to view your profile.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const profileRole = toProfileRole(session.user?.role)
  const data = profileData || {
    id: session.user?.id,
    givenName: session.user?.name?.split(" ")[0] || "",
    surname: session.user?.name?.split(" ").slice(1).join(" ") || "",
    profilePhotoUrl: session.user?.image,
    emailAddress: session.user?.email,
    createdAt: new Date().toISOString(),
  }

  return (
    <OldProfileContent
      role={profileRole}
      data={data}
      dictionary={dictionary}
      lang={locale}
      isOwner={true}
      userId={session.user?.id}
    />
  )
}
