"use server"

/**
 * Server Actions for Geofence Feature
 * Location tracking, geofence management, and live monitoring
 * Part of the Hogwarts School Management System
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import {
  checkGeofences,
  getCurrentGeofences,
  processGeofenceEvents,
  type Coordinates,
} from "./geo-service"
import {
  circularGeofenceSchema,
  deleteGeofenceSchema,
  geofenceEventsQuerySchema,
  liveLocationsQuerySchema,
  locationSchema,
  polygonGeofenceSchema,
  updateGeofenceStatusSchema,
  type CircularGeofenceInput,
  type LocationInput,
  type PolygonGeofenceInput,
} from "./validation"

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = unknown> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================================================
// LOCATION SUBMISSION
// ============================================================================

/**
 * Submit student location from device
 * Validates location, checks geofences, processes events, triggers auto-attendance
 * CRITICAL: Rate-limited to 20 requests per 10 seconds per student
 *
 * @param data Location data from GPS
 * @returns Success status and processed event IDs
 */
export async function submitLocation(
  data: LocationInput
): Promise<ActionResult<{ eventIds: string[] }>> {
  try {
    // 1. Authenticate and get session
    const session = await auth()
    if (!session?.user?.schoolId || !session.user.id) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const userId = session.user.id

    // 2. Verify user is a student
    const student = await db.student.findFirst({
      where: {
        schoolId,
        userId,
      },
      select: {
        id: true,
      },
    })

    if (!student) {
      return { success: false, error: "User is not a student" }
    }

    // 3. Validate location data
    const validated = locationSchema.parse(data)

    // 4. Get previous geofences the student was inside
    const previousGeofenceIds = await getCurrentGeofences(schoolId, student.id)

    // 5. Save location trace to database
    await db.locationTrace.create({
      data: {
        schoolId,
        studentId: student.id,
        lat: validated.lat,
        lon: validated.lon,
        accuracy: validated.accuracy,
        altitude: validated.altitude,
        heading: validated.heading,
        speed: validated.speed,
        battery: validated.battery,
        deviceId: validated.deviceId,
        userAgent: validated.userAgent,
      },
    })

    // 6. Check which geofences student is currently inside
    const location: Coordinates = { lat: validated.lat, lon: validated.lon }
    const geofenceResults = await checkGeofences(
      schoolId,
      student.id,
      location,
      previousGeofenceIds
    )

    // 7. Process geofence events and trigger auto-attendance
    const eventIds = await processGeofenceEvents(
      schoolId,
      student.id,
      location,
      geofenceResults
    )

    // Note: PostgreSQL trigger will send LISTEN/NOTIFY for real-time updates
    // No need to revalidate here as WebSocket handles real-time updates

    return {
      success: true,
      data: { eventIds },
    }
  } catch (error) {
    console.error("Error submitting location:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit location",
    }
  }
}

// ============================================================================
// GEOFENCE MANAGEMENT (ADMIN)
// ============================================================================

/**
 * Create a new circular geofence
 * Only accessible by ADMIN and TEACHER roles
 *
 * @param data Circular geofence configuration
 * @returns Created geofence
 */
export async function createCircularGeofence(
  data: CircularGeofenceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const role = session.user.role

    // Check permissions
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validate data
    const validated = circularGeofenceSchema.parse(data)

    // Check for duplicate name within school
    const existing = await db.geoFence.findFirst({
      where: {
        schoolId,
        name: validated.name,
      },
    })

    if (existing) {
      return { success: false, error: "Geofence with this name already exists" }
    }

    // Create geofence
    const geofence = await db.geoFence.create({
      data: {
        schoolId,
        name: validated.name,
        description: validated.description,
        type: validated.type,
        centerLat: validated.centerLat,
        centerLon: validated.centerLon,
        radiusMeters: validated.radiusMeters,
        color: validated.color,
        isActive: validated.isActive,
      },
    })

    revalidatePath("/[lang]/s/[subdomain]/(platform)/attendance/geo", "page")

    return {
      success: true,
      data: { id: geofence.id },
    }
  } catch (error) {
    console.error("Error creating circular geofence:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create geofence",
    }
  }
}

/**
 * Create a new polygon geofence
 * Only accessible by ADMIN and TEACHER roles
 *
 * @param data Polygon geofence configuration
 * @returns Created geofence
 */
export async function createPolygonGeofence(
  data: PolygonGeofenceInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const role = session.user.role

    // Check permissions
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validate data
    const validated = polygonGeofenceSchema.parse(data)

    // Check for duplicate name within school
    const existing = await db.geoFence.findFirst({
      where: {
        schoolId,
        name: validated.name,
      },
    })

    if (existing) {
      return { success: false, error: "Geofence with this name already exists" }
    }

    // Create geofence
    const geofence = await db.geoFence.create({
      data: {
        schoolId,
        name: validated.name,
        description: validated.description,
        type: validated.type,
        polygonGeoJSON: validated.polygonGeoJSON,
        color: validated.color,
        isActive: validated.isActive,
      },
    })

    revalidatePath("/[lang]/s/[subdomain]/(platform)/attendance/geo", "page")

    return {
      success: true,
      data: { id: geofence.id },
    }
  } catch (error) {
    console.error("Error creating polygon geofence:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create geofence",
    }
  }
}

/**
 * Update geofence active status
 * Only accessible by ADMIN and TEACHER roles
 */
export async function updateGeofenceStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const role = session.user.role

    // Check permissions
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validate input
    const validated = updateGeofenceStatusSchema.parse({ id, isActive })

    // Verify geofence belongs to school
    const geofence = await db.geoFence.findFirst({
      where: {
        id: validated.id,
        schoolId,
      },
    })

    if (!geofence) {
      return { success: false, error: "Geofence not found" }
    }

    // Update status
    await db.geoFence.update({
      where: { id: validated.id },
      data: { isActive: validated.isActive },
    })

    revalidatePath("/[lang]/s/[subdomain]/(platform)/attendance/geo", "page")

    return { success: true }
  } catch (error) {
    console.error("Error updating geofence status:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update geofence",
    }
  }
}

/**
 * Delete a geofence
 * Only accessible by ADMIN role
 */
export async function deleteGeofence(id: string): Promise<ActionResult> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const role = session.user.role

    // Check permissions (only ADMIN can delete)
    if (role !== "ADMIN") {
      return {
        success: false,
        error: "Only administrators can delete geofences",
      }
    }

    // Validate input
    const validated = deleteGeofenceSchema.parse({ id })

    // Verify geofence belongs to school
    const geofence = await db.geoFence.findFirst({
      where: {
        id: validated.id,
        schoolId,
      },
    })

    if (!geofence) {
      return { success: false, error: "Geofence not found" }
    }

    // Delete geofence (cascade will delete events)
    await db.geoFence.delete({
      where: { id: validated.id },
    })

    revalidatePath("/[lang]/s/[subdomain]/(platform)/attendance/geo", "page")

    return { success: true }
  } catch (error) {
    console.error("Error deleting geofence:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete geofence",
    }
  }
}

/**
 * Get all geofences for a school
 * Accessible by ADMIN, TEACHER roles
 */
export async function getGeofences(): Promise<
  ActionResult<
    Array<{
      id: string
      name: string
      type: string
      isActive: boolean
      centerLat: number | null
      centerLon: number | null
      radiusMeters: number | null
      color: string | null
    }>
  >
> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const role = session.user.role

    // Check permissions
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" }
    }

    const geofences = await db.geoFence.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
        centerLat: true,
        centerLon: true,
        radiusMeters: true,
        color: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const serialized = geofences.map((g) => ({
      ...g,
      centerLat: g.centerLat ? Number(g.centerLat) : null,
      centerLon: g.centerLon ? Number(g.centerLon) : null,
    }))

    return {
      success: true,
      data: serialized,
    }
  } catch (error) {
    console.error("Error fetching geofences:", error)
    return {
      success: false,
      error: "Failed to fetch geofences",
    }
  }
}

// ============================================================================
// LIVE MONITORING
// ============================================================================

/**
 * Get live student locations (last 5 minutes by default)
 * Only accessible by ADMIN and TEACHER roles
 * Used for live map view in admin lab
 */
export async function getLiveStudentLocations(
  maxAgeMinutes: number = 5
): Promise<
  ActionResult<
    Array<{
      studentId: string
      studentName: string
      lat: number
      lon: number
      accuracy: number | null
      battery: number | null
      timestamp: Date
      currentGeofences: string[]
    }>
  >
> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const role = session.user.role

    // Check permissions
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validate query
    const validated = liveLocationsQuerySchema.parse({
      schoolId,
      maxAgeMinutes,
    })

    // Calculate cutoff time
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - validated.maxAgeMinutes)

    // Get latest location for each student
    const locations = await db.$queryRaw<
      Array<{
        student_id: string
        student_name: string
        lat: number
        lon: number
        accuracy: number | null
        battery: number | null
        timestamp: Date
      }>
    >`
      SELECT DISTINCT ON (l."studentId")
        l."studentId" as student_id,
        CONCAT(s."givenName", ' ', s."surname") as student_name,
        CAST(l.lat AS DOUBLE PRECISION) as lat,
        CAST(l.lon AS DOUBLE PRECISION) as lon,
        l.accuracy,
        l.battery,
        l.timestamp
      FROM location_traces l
      JOIN students s ON s.id = l."studentId"
      WHERE l."schoolId" = ${schoolId}
        AND l.timestamp > ${cutoffTime}
      ORDER BY l."studentId", l.timestamp DESC
    `

    // Get current geofences for each student
    const enrichedLocations = await Promise.all(
      locations.map(async (loc) => {
        const currentGeofences = await getCurrentGeofences(
          schoolId,
          loc.student_id
        )
        return {
          studentId: loc.student_id,
          studentName: loc.student_name,
          lat: loc.lat,
          lon: loc.lon,
          accuracy: loc.accuracy,
          battery: loc.battery,
          timestamp: loc.timestamp,
          currentGeofences,
        }
      })
    )

    return {
      success: true,
      data: enrichedLocations,
    }
  } catch (error) {
    console.error("Error fetching live locations:", error)
    return {
      success: false,
      error: "Failed to fetch live locations",
    }
  }
}

/**
 * Get geofence events (history)
 * Only accessible by ADMIN and TEACHER roles
 */
export async function getGeofenceEvents(
  studentId?: string,
  geofenceId?: string,
  limit: number = 100
): Promise<
  ActionResult<
    Array<{
      id: string
      studentId: string
      studentName: string
      geofenceId: string
      geofenceName: string
      eventType: string
      lat: number
      lon: number
      timestamp: Date
      processedAt: Date | null
    }>
  >
> {
  try {
    const session = await auth()
    if (!session?.user?.schoolId) {
      return { success: false, error: "Unauthorized" }
    }

    const schoolId = session.user.schoolId
    const role = session.user.role

    // Check permissions
    if (role !== "ADMIN" && role !== "TEACHER") {
      return { success: false, error: "Insufficient permissions" }
    }

    // Validate query
    const validated = geofenceEventsQuerySchema.parse({
      schoolId,
      studentId,
      geofenceId,
      limit,
    })

    const events = await db.geoAttendanceEvent.findMany({
      where: {
        schoolId,
        ...(validated.studentId && { studentId: validated.studentId }),
        ...(validated.geofenceId && { geofenceId: validated.geofenceId }),
      },
      include: {
        student: {
          select: {
            givenName: true,
            surname: true,
          },
        },
        geofence: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
      take: validated.limit,
    })

    const serialized = events.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      studentName: `${e.student.givenName} ${e.student.surname}`,
      geofenceId: e.geofenceId,
      geofenceName: e.geofence.name,
      eventType: e.eventType,
      lat: Number(e.lat),
      lon: Number(e.lon),
      timestamp: e.timestamp,
      processedAt: e.processedAt,
    }))

    return {
      success: true,
      data: serialized,
    }
  } catch (error) {
    console.error("Error fetching geofence events:", error)
    return {
      success: false,
      error: "Failed to fetch geofence events",
    }
  }
}
