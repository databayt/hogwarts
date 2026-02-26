// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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
