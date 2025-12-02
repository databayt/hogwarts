"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { StudentProfileContent } from "../student/content"
import { TeacherProfileContent } from "../teacher/content"
import { ParentProfileContent } from "../parent/content"
import { StaffProfileContent } from "../staff/content"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CircleAlert, Lock, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { FilteredProfileData } from "./types"

interface ProfileDetailContentProps {
  profileData: FilteredProfileData | null
  permissionLevel: string
  error?: string | null
  dictionary: Dictionary
  lang: Locale
}

export function ProfileDetailContent({
  profileData,
  permissionLevel,
  error,
  dictionary,
  lang,
}: ProfileDetailContentProps) {
  const { data: session } = useSession()
  const router = useRouter()

  // Error state
  if (error || !profileData) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Failed to load profile"}
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  // No permission to view
  if (!profileData.canViewFullProfile && permissionLevel === "PUBLIC") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Restricted Profile
            </CardTitle>
            <CardDescription>
              You don't have permission to view this profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This profile is private. Only authorized users can view detailed
              information.
            </p>
            {profileData.username && (
              <div className="flex items-center gap-2">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  {profileData.image ? (
                    <img
                      src={profileData.image}
                      alt={profileData.username}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <UserX className="h-6 w-6" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{profileData.username}</p>
                  <p className="text-sm text-muted-foreground">
                    {profileData.role}
                  </p>
                </div>
              </div>
            )}
            <Button onClick={() => router.back()}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if viewing own profile
  const isOwner = session?.user?.id === profileData.id

  // Render appropriate profile based on detected type
  switch (profileData.profileType) {
    case "STUDENT":
      return (
        <StudentProfileContent
          studentId={profileData.student?.userId || profileData.id}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      )

    case "TEACHER":
      return (
        <TeacherProfileContent
          teacherId={profileData.teacher?.userId || profileData.id}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      )

    case "GUARDIAN":
      return (
        <ParentProfileContent
          parentId={profileData.guardian?.userId || profileData.id}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      )

    case "STAFF":
      return (
        <StaffProfileContent
          staffId={profileData.id}
          dictionary={dictionary}
          lang={lang}
          isOwner={isOwner}
        />
      )

    case "USER":
    default:
      // Generic user profile (no specific type assigned yet)
      return (
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>
                Basic profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profileData.image && (
                  <img
                    src={profileData.image}
                    alt={profileData.username || "User"}
                    className="h-24 w-24 rounded-full"
                  />
                )}
                <div className="space-y-2 text-sm">
                  {profileData.username && (
                    <p>
                      <strong>Username:</strong> {profileData.username}
                    </p>
                  )}
                  {profileData.email && (
                    <p>
                      <strong>Email:</strong> {profileData.email}
                    </p>
                  )}
                  <p>
                    <strong>Role:</strong> {profileData.role}
                  </p>
                  {profileData.createdAt && (
                    <p>
                      <strong>Joined:</strong>{" "}
                      {new Date(profileData.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                {isOwner && (
                  <div className="pt-4">
                    <Alert>
                      <CircleAlert className="h-4 w-4" />
                      <AlertTitle>Complete Your Profile</AlertTitle>
                      <AlertDescription>
                        Your profile type has not been configured yet. Please
                        contact your administrator to complete your profile
                        setup.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )
  }
}

/**
 * Loading skeleton for profile detail page
 */
export function ProfileDetailLoading() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
