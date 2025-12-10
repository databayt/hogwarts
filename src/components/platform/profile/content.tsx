/**
 * Main Profile Router Component
 * Dynamically loads the appropriate profile component based on user role
 */

"use client";

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { StudentProfileContent } from './student/content'
import { TeacherProfileContent } from './teacher/content'
import { ParentProfileContent } from './parent/content'
import { StaffProfileContent } from './staff/content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CircleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useDictionary } from '@/components/internationalization/use-dictionary'
import { useLocale } from '@/components/internationalization/use-locale'

export function ProfileContent() {
  const { dictionary, isLoading: isDictionaryLoading } = useDictionary()
  const { locale } = useLocale()
  const { data: session, status } = useSession()
  const [profileId, setProfileId] = React.useState<string | undefined>()

  // Extract user ID and role from session
  React.useEffect(() => {
    if (session?.user?.id) {
      setProfileId(session.user.id)
    }
  }, [session])

  // Loading state (dictionary or session)
  if (status === 'loading' || isDictionaryLoading || !dictionary) {
    return (
      <div className="space-y-6">
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

  // Unauthenticated state
  if (status === 'unauthenticated' || !session) {
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

  // Get user role - prioritize specific roles over generic USER role
  const userRole = session.user?.role

  // Render appropriate profile based on role
  switch (userRole) {
    case 'STUDENT':
      return (
        <StudentProfileContent
          studentId={profileId}
          dictionary={dictionary}
          lang={locale}
          isOwner={true}
        />
      )

    case 'TEACHER':
      return (
        <TeacherProfileContent
          teacherId={profileId}
          dictionary={dictionary}
          lang={locale}
          isOwner={true}
        />
      )

    case 'GUARDIAN':
      return (
        <ParentProfileContent
          parentId={profileId}
          dictionary={dictionary}
          lang={locale}
          isOwner={true}
        />
      )

    case 'STAFF':
    case 'ACCOUNTANT':
      return (
        <StaffProfileContent
          staffId={profileId}
          dictionary={dictionary}
          lang={locale}
          isOwner={true}
        />
      )

    case 'ADMIN':
    case 'DEVELOPER':
      // Admins and developers get staff profile with additional privileges
      return (
        <StaffProfileContent
          staffId={profileId}
          dictionary={dictionary}
          lang={locale}
          isOwner={true}
        />
      )

    default:
      // Fallback for USER or unknown roles
      return (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Setup Required</CardTitle>
              <CardDescription>
                Your profile type has not been configured yet. Please contact your administrator.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>User ID: {session.user?.id}</p>
                <p>Email: {session.user?.email}</p>
                <p>Role: {userRole || 'Not assigned'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
  }
}


