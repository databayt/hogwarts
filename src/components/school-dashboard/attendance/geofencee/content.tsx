// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Geofence Content - Main Server Component
 * Combines student tracking and admin live map views
 */

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getGeofences, getLiveStudentLocations } from "./actions"
import { GeoLiveMap } from "./geo-live-map"
import { GeoTracker } from "./geo-tracker"
import { GeofenceForm } from "./geofence-form"
import { GeofenceList } from "./geofence-list"

interface GeofenceContentProps {
  lang?: string
}

export async function GeofenceContent({ lang = "en" }: GeofenceContentProps) {
  const session = await auth()

  if (!session?.user?.schoolId) {
    redirect("/auth/signin")
  }

  const schoolId = session.user.schoolId
  const role = session.user.role

  const dictionary = await getDictionary(lang as "en" | "ar")
  const t = (dictionary.school.attendance as any)?.geofence as
    | Record<string, string>
    | undefined

  // Determine user permissions
  const isStudent = role === "STUDENT"
  const canManage = role === "ADMIN" || role === "TEACHER"

  // Fetch initial data for admin/teacher view
  let initialGeofences: any[] = []
  let initialLocations: any[] = []

  if (canManage) {
    const [geofencesResult, locationsResult] = await Promise.all([
      getGeofences(),
      getLiveStudentLocations(5),
    ])

    if (geofencesResult.success && geofencesResult.data) {
      initialGeofences = geofencesResult.data
    }

    if (locationsResult.success && locationsResult.data) {
      initialLocations = locationsResult.data
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2>{t?.title || "Geofence Attendance Tracking"}</h2>
        <p className="text-muted-foreground">
          {t?.description ||
            "Automatic attendance marking using GPS location tracking"}
        </p>
      </div>

      {isStudent && (
        <div className="space-y-4">
          <GeoTracker />
          <div className="text-muted-foreground rounded-lg border p-4 text-sm">
            <p className="mb-2 font-medium">
              {t?.howItWorks || "How it works:"}
            </p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                {t?.step1 ||
                  "Your school admin defines geofence boundaries on the map"}
              </li>
              <li>
                {t?.step2 ||
                  "Students enable location tracking on their devices"}
              </li>
              <li>
                {t?.step3 ||
                  "When a student enters a geofence, attendance is automatically marked"}
              </li>
              <li>
                {t?.step4 ||
                  "Administrators can monitor real-time student locations"}
              </li>
            </ul>
          </div>
        </div>
      )}

      {canManage && (
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">{t?.liveMap || "Live Map"}</TabsTrigger>
            <TabsTrigger value="geofences">
              {t?.manageGeofences || "Manage Geofences"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <GeoLiveMap
              schoolId={schoolId}
              initialLocations={initialLocations}
              initialGeofences={initialGeofences}
            />
          </TabsContent>

          <TabsContent value="geofences" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3>{t?.geofences || "Geofences"}</h3>
                <p className="text-muted-foreground">
                  {t?.defineAreas ||
                    "Define areas that trigger automatic attendance"}
                </p>
              </div>
              <GeofenceForm />
            </div>

            {/* Geofence List with Management */}
            <GeofenceList geofences={initialGeofences} />
          </TabsContent>
        </Tabs>
      )}

      {!isStudent && !canManage && (
        <div className="text-muted-foreground py-12 text-center">
          <p>
            {t?.permissionDenied ||
              "You do not have permission to manage geofence settings."}
          </p>
        </div>
      )}
    </div>
  )
}
