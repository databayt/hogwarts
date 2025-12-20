/**
 * Geofence Content - Main Server Component
 * Combines student tracking and admin live map views
 */

import { redirect } from "next/navigation"
import { auth } from "@/auth"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { getGeofences, getLiveStudentLocations } from "./actions"
import { GeoLiveMap } from "./geo-live-map"
import { GeoTracker } from "./geo-tracker"
import { GeofenceForm } from "./geofence-form"
import { GeofenceList } from "./geofence-list"

export async function GeofenceContent() {
  const session = await auth()

  if (!session?.user?.schoolId) {
    redirect("/auth/signin")
  }

  const schoolId = session.user.schoolId
  const role = session.user.role

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
        <h2>Geofence Attendance Tracking</h2>
        <p className="text-muted-foreground">
          Automatic attendance marking using GPS location tracking
        </p>
      </div>

      {isStudent && (
        <div className="space-y-4">
          <GeoTracker />
          <div className="text-muted-foreground rounded-lg border p-4 text-sm">
            <p className="mb-2 font-medium">How it works:</p>
            <ul className="list-inside list-disc space-y-1">
              <li>Enable location tracking by clicking "Start Tracking"</li>
              <li>Your location is securely submitted every 30 seconds</li>
              <li>
                When you enter school grounds, attendance is automatically
                marked
              </li>
              <li>
                Your location data is kept for 30 days for privacy compliance
              </li>
            </ul>
          </div>
        </div>
      )}

      {canManage && (
        <Tabs defaultValue="map" className="space-y-4">
          <TabsList>
            <TabsTrigger value="map">Live Map</TabsTrigger>
            <TabsTrigger value="geofences">Manage Geofences</TabsTrigger>
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
                <h3>Geofences</h3>
                <p className="text-muted-foreground">
                  Define areas that trigger automatic attendance
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
            Geofence tracking is only available for students, teachers, and
            administrators
          </p>
        </div>
      )}
    </div>
  )
}
