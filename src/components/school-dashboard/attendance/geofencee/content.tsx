// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Location check-in (staff): the live map of students on campus and the
 * zones that mark arrivals automatically. Students share their location
 * from the mobile app; this page is the school's side of it.
 */

import { auth } from "@/auth"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { AttendanceSectionNav } from "../ui/section-nav"
import { getGeofences, getLiveStudentLocations } from "./actions"
import { GeoLiveMap } from "./geo-live-map"
import { GeofenceForm } from "./geofence-form"
import { GeofenceList } from "./geofence-list"

interface GeofenceContentProps {
  lang?: string
}

/** Zone editing — the create/update/delete actions allow these roles. */
const EDIT_ROLES = ["ADMIN", "TEACHER"]

export async function GeofenceContent({ lang = "ar" }: GeofenceContentProps) {
  const session = await auth()
  const schoolId = session?.user?.schoolId ?? ""
  const role = session?.user?.role ?? ""
  const canEdit = EDIT_ROLES.includes(role)

  const dictionary = await getDictionary(lang as "en" | "ar")
  const t = (dictionary.attendanceTake?.geo ?? {}) as Record<string, string>

  const [geofencesResult, locationsResult] = await Promise.all([
    getGeofences(),
    getLiveStudentLocations(5),
  ])
  const geofences =
    geofencesResult.success && geofencesResult.data ? geofencesResult.data : []
  const locations =
    locationsResult.success && locationsResult.data ? locationsResult.data : []

  return (
    <div className="space-y-6">
      <AttendanceSectionNav group="take" />

      <Tabs defaultValue="map" className="space-y-4">
        <TabsList className="rounded-full">
          <TabsTrigger value="map" className="rounded-full">
            {t.liveMap ?? "Live map"}
          </TabsTrigger>
          <TabsTrigger value="zones" className="rounded-full">
            {t.zones ?? "Zones"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="space-y-4">
          <GeoLiveMap
            schoolId={schoolId}
            initialLocations={locations}
            initialGeofences={geofences}
            t={{ ...t, locale: lang }}
          />
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-muted-foreground text-sm">
              {t.zonesDescription ??
                "Areas that mark a student present when they arrive."}
            </p>
            {canEdit ? <GeofenceForm /> : null}
          </div>
          <GeofenceList geofences={geofences} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
