/**
 * Geofence Attendance Page
 * Route: /[lang]/s/[subdomain]/attendance/geo
 */

import { GeofenceContent } from "@/components/school-dashboard/attendance/geofencee/content"

export default function GeofencePage() {
  return <GeofenceContent />
}

export const metadata = {
  title: "Geofence Tracking | Hogwarts",
  description: "Automatic attendance tracking using GPS location",
}
