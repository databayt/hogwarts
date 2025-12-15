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

            {/* Geofence List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {initialGeofences.map((geofence) => (
                <div
                  key={geofence.id}
                  className="space-y-2 rounded-lg border p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{geofence.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        {geofence.type.replace("_", " ")}
                      </p>
                    </div>
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: geofence.color || "#3b82f6" }}
                    />
                  </div>
                  {geofence.centerLat &&
                    geofence.centerLon &&
                    geofence.radiusMeters && (
                      <div className="text-muted-foreground space-y-1 text-xs">
                        <p>
                          Center: {geofence.centerLat.toFixed(4)},{" "}
                          {geofence.centerLon.toFixed(4)}
                        </p>
                        <p>Radius: {geofence.radiusMeters}m</p>
                      </div>
                    )}
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        geofence.isActive ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                    <span className="text-xs">
                      {geofence.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}

              {initialGeofences.length === 0 && (
                <div className="text-muted-foreground col-span-full py-12 text-center">
                  <p>No geofences created yet</p>
                  <p className="text-sm">
                    Click "Create Geofence" to get started
                  </p>
                </div>
              )}
            </div>
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
