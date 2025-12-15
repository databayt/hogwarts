# Geo Real-Time Attendance System - Pure Stack Architecture

## Tech Stack (100% Current Infrastructure)

- **Backend**: Next.js 15 Server Actions + API Routes (TypeScript)
- **Geospatial Database**: PostgreSQL with PostGIS extension (Neon)
- **ORM**: Prisma 6.14 (existing)
- **Real-time**: PostgreSQL LISTEN/NOTIFY + WebSockets
- **Mobile**: PWA with Geolocation API + Service Workers
- **Mapping**: Leaflet.js (lightweight, open-source)
- **No additional services**: Pure PostgreSQL/Next.js stack

---

## Architecture Overview

```
┌─────────────────────────┐
│  PWA Mobile Web Client  │ (Student device - browser-based)
│  - Geolocation API      │
│  - Service Worker       │
│  - Offline Queue        │
└───────────┬─────────────┘
            │ HTTPS POST /api/geo/location (every 30s)
            ↓
┌─────────────────────────────────────────────────────────────┐
│              Next.js 15 (Server Actions + API Routes)       │
│  - Auth middleware (schoolId from session)                  │
│  - Rate limiting (20 req/10s per student)                   │
│  - Insert location → PostgreSQL                             │
│  - Trigger geofence check (PostGIS queries)                 │
└────────┬────────────────────────────────┬───────────────────┘
         │                                │
         ↓                                ↓
┌──────────────────────┐     ┌────────────────────────────┐
│  PostgreSQL + PostGIS│     │  PostgreSQL LISTEN/NOTIFY  │
│                      │     │  (Real-time event stream)  │
│  Tables:             │     │                            │
│  - geo_fences        │────▶│  NOTIFY 'geofence_events'  │
│  - location_traces   │     │  (via triggers)            │
│  - geo_events        │     └──────────┬─────────────────┘
│  - attendances       │                │
│                      │                ↓
│  Spatial Indexes:    │     ┌────────────────────────────┐
│  - GiST on geometry  │     │  WebSocket Server          │
│  - BRIN on timestamp │     │  (Next.js Custom Server)   │
└──────────────────────┘     │  - pg.on('notification')   │
                             │  - Broadcast to clients    │
                             └──────────┬─────────────────┘
                                        │
                                        ↓
                             ┌────────────────────────────┐
                             │  Admin Live Dashboard      │
                             │  - Leaflet.js map          │
                             │  - Real-time student pins  │
                             │  - Geofence visualization  │
                             └────────────────────────────┘
```

---

## Phase 1: Database Schema & PostGIS Setup

### 1.1 Enable PostGIS Extension

```sql
-- Run in Neon console
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_version(); -- Verify installation
```

### 1.2 Prisma Schema Extensions

**File**: `prisma/models/geo-attendance.prisma`

```prisma
enum GeoFenceType {
  SCHOOL_GROUNDS    // Main campus boundary
  CLASSROOM         // Individual classroom
  BUS_ROUTE         // Bus pickup/dropoff area
  PLAYGROUND        // Playground area
  CAFETERIA         // Cafeteria area
  LIBRARY           // Library area
}

enum GeoEventType {
  ENTER             // Student entered geofence
  EXIT              // Student exited geofence
  INSIDE            // Student confirmed inside (periodic check)
}

// Geofence definitions (school boundaries, classrooms, etc.)
model GeoFence {
  id          String       @id @default(cuid())
  schoolId    String
  name        String       // e.g., "Main Campus", "Math Classroom 101"
  type        GeoFenceType
  description String?

  // Geofence geometry options:
  // Option 1: Circular geofence (simpler)
  centerLat   Decimal?     @db.Decimal(10, 8) // Center latitude
  centerLon   Decimal?     @db.Decimal(11, 8) // Center longitude
  radiusMeters Int?        // Radius in meters (e.g., 500)

  // Option 2: Polygon geofence (complex shapes)
  // Store as GeoJSON string, query with PostGIS
  polygonGeoJSON String?   @db.Text

  isActive    Boolean      @default(true)
  color       String?      @default("#3b82f6") // For lab visualization

  school      School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  events      GeoAttendanceEvent[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@index([schoolId, isActive])
  @@index([type])
  @@map("geo_fences")
}

// Raw location traces (GPS breadcrumbs)
model LocationTrace {
  id          String   @id @default(cuid())
  schoolId    String
  studentId   String

  lat         Decimal  @db.Decimal(10, 8)
  lon         Decimal  @db.Decimal(11, 8)
  accuracy    Float?   // GPS accuracy in meters
  altitude    Float?   // Altitude in meters (optional)
  heading     Float?   // Direction of travel (0-360 degrees)
  speed       Float?   // Speed in m/s (optional)

  battery     Int?     // Battery percentage (0-100)
  deviceId    String?  // Device identifier
  userAgent   String?  // Browser user agent

  timestamp   DateTime @default(now())

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Performance indexes
  @@index([schoolId, studentId, timestamp(sort: Desc)]) // Latest location per student
  @@index([timestamp(sort: Desc)]) // For cleanup/archival
  @@index([schoolId, timestamp(sort: Desc)]) // School-wide queries

  @@map("location_traces")
}

// Geofence entry/exit events
model GeoAttendanceEvent {
  id          String       @id @default(cuid())
  schoolId    String
  studentId   String
  geofenceId  String
  eventType   GeoEventType

  // Event metadata
  lat         Decimal      @db.Decimal(10, 8) // Location at event time
  lon         Decimal      @db.Decimal(11, 8)
  accuracy    Float?

  timestamp   DateTime     @default(now())
  processedAt DateTime?    // When attendance was auto-marked

  school      School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student     Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  geofence    GeoFence     @relation(fields: [geofenceId], references: [id], onDelete: Cascade)

  @@index([schoolId, geofenceId, timestamp(sort: Desc)])
  @@index([studentId, eventType, timestamp(sort: Desc)])
  @@index([timestamp(sort: Desc)])

  @@map("geo_attendance_events")
}
```

### 1.3 PostgreSQL Triggers for Real-time Events

**File**: `prisma/migrations/XXX_geo_triggers.sql`

```sql
-- Function to notify on geofence events
CREATE OR REPLACE FUNCTION notify_geofence_event()
RETURNS trigger AS $$
DECLARE
  payload JSON;
BEGIN
  payload = json_build_object(
    'eventId', NEW.id,
    'schoolId', NEW.school_id,
    'studentId', NEW.student_id,
    'geofenceId', NEW.geofence_id,
    'eventType', NEW.event_type,
    'lat', NEW.lat,
    'lon', NEW.lon,
    'timestamp', NEW.timestamp
  );

  -- Send notification on channel: geofence_events_{schoolId}
  PERFORM pg_notify('geofence_events_' || NEW.school_id, payload::text);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on geo_attendance_events table
CREATE TRIGGER geofence_event_trigger
AFTER INSERT ON geo_attendance_events
FOR EACH ROW
EXECUTE FUNCTION notify_geofence_event();

-- Create spatial index on geofences (for polygon queries)
-- Note: This must be run as raw SQL since Prisma doesn't support PostGIS geometry types
CREATE INDEX IF NOT EXISTS geo_fences_geom_idx
ON geo_fences
USING GIST (
  CASE
    WHEN polygon_geo_json IS NOT NULL THEN ST_GeomFromGeoJSON(polygon_geo_json)
    WHEN center_lat IS NOT NULL AND center_lon IS NOT NULL AND radius_meters IS NOT NULL
      THEN ST_Buffer(ST_SetSRID(ST_MakePoint(center_lon::float, center_lat::float), 4326)::geography, radius_meters)::geometry
    ELSE NULL
  END
);
```

---

## Phase 2: Service Layer (lib/geo-service.ts)

### 2.1 Core Geospatial Service

**File**: `src/lib/geo-service.ts`

```typescript
/**
 * Geo Service
 * Handles geospatial operations, geofencing, and location tracking
 * Uses PostGIS for all spatial calculations (no external services)
 */

import { Decimal } from "@prisma/client/runtime/library"

import { db } from "@/lib/db"
import { logger } from "@/lib/logger"

// === TYPE DEFINITIONS ===

export interface Coordinates {
  lat: number
  lon: number
}

export interface LocationUpdate {
  studentId: string
  schoolId: string
  lat: number
  lon: number
  accuracy?: number
  battery?: number
  deviceId?: string
  timestamp: Date
}

export interface GeofenceCheckResult {
  isInside: boolean
  geofenceId?: string
  geofenceName?: string
  geofenceType?: string
  distance?: number // Distance from geofence boundary in meters
}

// === HAVERSINE DISTANCE CALCULATION (Fast approximation) ===

/**
 * Calculate distance between two points in meters using Haversine formula
 * Faster than PostGIS for simple distance checks
 */
export function calculateDistance(p1: Coordinates, p2: Coordinates): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (p1.lat * Math.PI) / 180
  const φ2 = (p2.lat * Math.PI) / 180
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180
  const Δλ = ((p2.lon - p1.lon) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

// === GEOFENCE DETECTION ===

/**
 * Check if point is inside ANY active geofence for a school
 * Uses PostGIS ST_DWithin for efficient spatial queries
 */
export async function checkGeofences(
  location: Coordinates,
  schoolId: string
): Promise<GeofenceCheckResult[]> {
  const results: GeofenceCheckResult[] = []

  // Get all active geofences for school
  const geofences = await db.geoFence.findMany({
    where: { schoolId, isActive: true },
    select: {
      id: true,
      name: true,
      type: true,
      centerLat: true,
      centerLon: true,
      radiusMeters: true,
      polygonGeoJSON: true,
    },
  })

  for (const fence of geofences) {
    let isInside = false
    let distance = 0

    if (fence.radiusMeters && fence.centerLat && fence.centerLon) {
      // Circular geofence - use Haversine (faster than PostGIS for circles)
      distance = calculateDistance(location, {
        lat: Number(fence.centerLat),
        lon: Number(fence.centerLon),
      })
      isInside = distance <= fence.radiusMeters
    } else if (fence.polygonGeoJSON) {
      // Polygon geofence - use PostGIS ST_Contains
      const result = await db.$queryRaw<
        Array<{ inside: boolean; distance: number }>
      >`
        SELECT
          ST_Contains(
            ST_GeomFromGeoJSON(${fence.polygonGeoJSON}),
            ST_SetSRID(ST_MakePoint(${location.lon}, ${location.lat}), 4326)
          ) as inside,
          ST_Distance(
            ST_GeomFromGeoJSON(${fence.polygonGeoJSON})::geography,
            ST_SetSRID(ST_MakePoint(${location.lon}, ${location.lat}), 4326)::geography
          ) as distance
      `
      isInside = result[0]?.inside || false
      distance = result[0]?.distance || 0
    }

    if (isInside || distance < 100) {
      // Include near-boundary locations
      results.push({
        isInside,
        geofenceId: fence.id,
        geofenceName: fence.name,
        geofenceType: fence.type,
        distance,
      })
    }
  }

  return results
}

// === LOCATION TRACE STORAGE ===

/**
 * Store location trace in PostgreSQL
 */
export async function saveLocationTrace(update: LocationUpdate) {
  await db.locationTrace.create({
    data: {
      schoolId: update.schoolId,
      studentId: update.studentId,
      lat: new Decimal(update.lat),
      lon: new Decimal(update.lon),
      accuracy: update.accuracy,
      battery: update.battery,
      deviceId: update.deviceId,
      timestamp: update.timestamp,
    },
  })
}

// === GEOFENCE EVENT PROCESSING ===

/**
 * Process geofence entry/exit and auto-mark attendance
 */
export async function processGeofenceEvents(
  studentId: string,
  schoolId: string,
  location: Coordinates,
  timestamp: Date
) {
  const checks = await checkGeofences(location, schoolId)

  for (const check of checks) {
    if (!check.isInside || !check.geofenceId) continue

    // Check if this is a new ENTER event (student wasn't inside before)
    const recentEvent = await db.geoAttendanceEvent.findFirst({
      where: {
        schoolId,
        studentId,
        geofenceId: check.geofenceId,
        timestamp: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
        },
      },
      orderBy: { timestamp: "desc" },
    })

    // New entry event
    if (!recentEvent || recentEvent.eventType === "EXIT") {
      await db.geoAttendanceEvent.create({
        data: {
          schoolId,
          studentId,
          geofenceId: check.geofenceId,
          eventType: "ENTER",
          lat: new Decimal(location.lat),
          lon: new Decimal(location.lon),
          timestamp,
        },
      })

      // Auto-mark attendance if SCHOOL_GROUNDS during attendance window
      if (check.geofenceType === "SCHOOL_GROUNDS") {
        await autoMarkAttendance(studentId, schoolId, timestamp)
      }
    } else {
      // Update INSIDE event (periodic confirmation)
      await db.geoAttendanceEvent.create({
        data: {
          schoolId,
          studentId,
          geofenceId: check.geofenceId,
          eventType: "INSIDE",
          lat: new Decimal(location.lat),
          lon: new Decimal(location.lon),
          timestamp,
        },
      })
    }
  }
}

// === ATTENDANCE AUTO-MARKING ===

/**
 * Auto-mark attendance when student enters school grounds
 */
async function autoMarkAttendance(
  studentId: string,
  schoolId: string,
  timestamp: Date
) {
  const hour = timestamp.getHours()

  // Only auto-mark during morning window (7-9 AM)
  if (hour < 7 || hour > 9) {
    logger.info("Outside attendance window", { studentId, hour })
    return
  }

  // Get student's classes
  const studentClasses = await db.studentClass.findMany({
    where: { schoolId, studentId },
    select: { classId: true },
  })

  const today = new Date(timestamp)
  today.setHours(0, 0, 0, 0)

  const status = hour >= 8 && hour <= 8.5 ? "PRESENT" : "LATE" // 8:30 AM cutoff

  // Mark attendance for all classes
  for (const sc of studentClasses) {
    await db.attendance.upsert({
      where: {
        schoolId_studentId_classId_date: {
          schoolId,
          studentId,
          classId: sc.classId,
          date: today,
        },
      },
      create: {
        schoolId,
        studentId,
        classId: sc.classId,
        date: today,
        status,
        notes: `Auto-marked via geofence at ${timestamp.toLocaleTimeString()}`,
      },
      update: {
        status,
        notes: `Auto-marked via geofence at ${timestamp.toLocaleTimeString()}`,
      },
    })
  }

  logger.info("Auto-marked attendance", { studentId, status, time: timestamp })
}

// === LOCATION HISTORY ===

/**
 * Get student's location history for a time range
 */
export async function getLocationHistory(
  studentId: string,
  schoolId: string,
  startDate: Date,
  endDate: Date
) {
  return db.locationTrace.findMany({
    where: {
      schoolId,
      studentId,
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { timestamp: "asc" },
    select: {
      lat: true,
      lon: true,
      accuracy: true,
      battery: true,
      timestamp: true,
    },
  })
}

// === CLEANUP / ARCHIVAL ===

/**
 * Delete location traces older than retention period
 * Run as cron job (e.g., daily at midnight)
 */
export async function cleanupOldLocationTraces(retentionDays: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const result = await db.locationTrace.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  })

  logger.info("Cleaned up location traces", {
    deleted: result.count,
    cutoffDate,
  })
  return result.count
}
```

---

## Phase 3: Server Actions & API Routes

### 3.1 Server Actions

**File**: `src/components/platform/attendance/geo/actions.ts`

```typescript
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  checkGeofences,
  getLocationHistory,
  processGeofenceEvents,
  saveLocationTrace,
} from "@/lib/geo-service"
import { getTenantContext } from "@/lib/tenant-context"

// === VALIDATION SCHEMAS ===

const locationSchema = z.object({
  studentId: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  battery: z.number().int().min(0).max(100).optional(),
  deviceId: z.string().optional(),
})

const geofenceSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum([
    "SCHOOL_GROUNDS",
    "CLASSROOM",
    "BUS_ROUTE",
    "PLAYGROUND",
    "CAFETERIA",
    "LIBRARY",
  ]),
  description: z.string().optional(),
  // Circular geofence
  centerLat: z.number().min(-90).max(90).optional(),
  centerLon: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().int().min(10).max(10000).optional(),
  // Polygon geofence
  polygonGeoJSON: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
})

// === LOCATION SUBMISSION ===

export async function submitLocation(input: z.infer<typeof locationSchema>) {
  const session = await auth()
  const { schoolId } = await getTenantContext()

  if (!schoolId) throw new Error("Missing school context")
  if (!session?.user) throw new Error("Unauthorized")

  const parsed = locationSchema.parse(input)
  const timestamp = new Date()

  // 1. Save location trace
  await saveLocationTrace({
    ...parsed,
    schoolId,
    timestamp,
  })

  // 2. Process geofence events (async - don't block response)
  processGeofenceEvents(
    parsed.studentId,
    schoolId,
    { lat: parsed.lat, lon: parsed.lon },
    timestamp
  ).catch((err) => console.error("Geofence processing failed:", err))

  return { success: true as const, timestamp: timestamp.toISOString() }
}

// === GEOFENCE MANAGEMENT ===

export async function createGeofence(input: z.infer<typeof geofenceSchema>) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const parsed = geofenceSchema.parse(input)

  // Validate that either circular OR polygon data is provided
  const hasCircular =
    parsed.centerLat && parsed.centerLon && parsed.radiusMeters
  const hasPolygon = parsed.polygonGeoJSON

  if (!hasCircular && !hasPolygon) {
    throw new Error(
      "Must provide either circular (center + radius) or polygon geofence data"
    )
  }

  const geofence = await db.geoFence.create({
    data: {
      schoolId,
      name: parsed.name,
      type: parsed.type,
      description: parsed.description,
      centerLat: parsed.centerLat,
      centerLon: parsed.centerLon,
      radiusMeters: parsed.radiusMeters,
      polygonGeoJSON: parsed.polygonGeoJSON,
      color: parsed.color || "#3b82f6",
    },
  })

  revalidatePath("/attendance/geo")
  return { success: true as const, geofenceId: geofence.id }
}

export async function updateGeofence(
  geofenceId: string,
  input: Partial<z.infer<typeof geofenceSchema>>
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  await db.geoFence.update({
    where: { id: geofenceId, schoolId },
    data: input,
  })

  revalidatePath("/attendance/geo")
  return { success: true as const }
}

export async function deleteGeofence(geofenceId: string) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  await db.geoFence.delete({
    where: { id: geofenceId, schoolId },
  })

  revalidatePath("/attendance/geo")
  return { success: true as const }
}

export async function getGeofences() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const geofences = await db.geoFence.findMany({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
  })

  return { geofences }
}

// === LIVE TRACKING DATA ===

export async function getLiveStudentLocations() {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // Get latest location for each student (last 5 minutes)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  const locations = await db.$queryRaw<
    Array<{
      student_id: string
      student_name: string
      lat: string
      lon: string
      accuracy: number | null
      battery: number | null
      timestamp: Date
    }>
  >`
    SELECT DISTINCT ON (lt.student_id)
      lt.student_id,
      CONCAT(s.given_name, ' ', s.surname) as student_name,
      lt.lat::text,
      lt.lon::text,
      lt.accuracy,
      lt.battery,
      lt.timestamp
    FROM location_traces lt
    JOIN students s ON s.id = lt.student_id
    WHERE lt.school_id = ${schoolId}
      AND lt.timestamp >= ${fiveMinutesAgo}
    ORDER BY lt.student_id, lt.timestamp DESC
  `

  return {
    students: locations.map((loc) => ({
      studentId: loc.student_id,
      name: loc.student_name,
      lat: parseFloat(loc.lat),
      lon: parseFloat(loc.lon),
      accuracy: loc.accuracy,
      battery: loc.battery,
      lastUpdate: loc.timestamp,
    })),
  }
}

// === GEOFENCE EVENTS (for timeline/history) ===

export async function getGeofenceEvents(
  studentId?: string,
  geofenceId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  const events = await db.geoAttendanceEvent.findMany({
    where: {
      schoolId,
      ...(studentId && { studentId }),
      ...(geofenceId && { geofenceId }),
      ...(startDate || endDate
        ? {
            timestamp: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
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
          type: true,
        },
      },
    },
    orderBy: { timestamp: "desc" },
    take: 100,
  })

  return { events }
}
```

### 3.2 API Route with Rate Limiting

**File**: `src/app/api/geo/location/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"

import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { submitLocation } from "@/components/platform/attendance/geo/actions"

export async function POST(req: NextRequest) {
  // 1. Authentication
  const session = await auth()
  if (!session?.user?.schoolId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Rate limiting (20 requests per 10 seconds)
  const rateLimitResult = await checkRateLimit(
    req,
    "geo-location",
    RATE_LIMITS.GEO_LOCATION
  )

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfter: rateLimitResult.retryAfter },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimitResult.retryAfter || 10) },
      }
    )
  }

  // 3. Parse and submit
  try {
    const body = await req.json()
    const result = await submitLocation(body)

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Location submission error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request" },
      { status: 400 }
    )
  }
}

// GET endpoint for testing/debugging
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isPlatformAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({
    status: "ok",
    endpoint: "/api/geo/location",
    methods: ["POST"],
    rateLimit: RATE_LIMITS.GEO_LOCATION,
  })
}
```

---

## Phase 4: Real-time WebSocket Server (PostgreSQL LISTEN/NOTIFY)

### 4.1 Custom Next.js Server with WebSockets

**File**: `server.js` (root directory)

```javascript
const { createServer } = require("http")
const { parse } = require("url")
const next = require("next")
const { WebSocketServer } = require("ws")
const { Client } = require("pg")

const dev = process.env.NODE_ENV !== "production"
const hostname = "localhost"
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true)
    await handle(req, res, parsedUrl)
  })

  // WebSocket server
  const wss = new WebSocketServer({ noServer: true })

  // PostgreSQL client for LISTEN/NOTIFY
  const pgClient = new Client({
    connectionString: process.env.DATABASE_URL,
  })

  pgClient
    .connect()
    .then(() => {
      console.log("✅ Connected to PostgreSQL for LISTEN/NOTIFY")

      // Listen to all school geofence events
      // In production, you might listen to specific schools
      pgClient.query("LISTEN geofence_events")

      pgClient.on("notification", (msg) => {
        console.log("📍 Geofence event:", msg.payload)

        // Broadcast to all connected WebSocket clients
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            // WebSocket.OPEN
            client.send(
              JSON.stringify({
                type: "geofence_event",
                data: JSON.parse(msg.payload),
              })
            )
          }
        })
      })
    })
    .catch((err) => {
      console.error("❌ PostgreSQL LISTEN/NOTIFY error:", err)
    })

  // WebSocket connection handling
  wss.on("connection", (ws, req) => {
    console.log("🔌 WebSocket client connected")

    ws.on("message", (message) => {
      console.log("📨 Received:", message.toString())
    })

    ws.on("close", () => {
      console.log("🔌 WebSocket client disconnected")
    })

    // Send initial connection confirmation
    ws.send(
      JSON.stringify({ type: "connected", message: "WebSocket connected" })
    )
  })

  // Handle WebSocket upgrade
  server.on("upgrade", (request, socket, head) => {
    const { pathname } = parse(request.url)

    if (pathname === "/api/geo/ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request)
      })
    } else {
      socket.destroy()
    }
  })

  server.listen(port, () => {
    console.log(`🚀 Server ready on http://${hostname}:${port}`)
    console.log(
      `🔌 WebSocket server ready on ws://${hostname}:${port}/api/geo/ws`
    )
  })
})
```

**Update package.json**:

```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  },
  "dependencies": {
    "ws": "^8.18.0",
    "pg": "^8.13.1"
  }
}
```

---

## Phase 5: PWA Frontend Components

### 5.1 Location Tracker Component

**File**: `src/components/platform/attendance/geo/tracker.tsx`

```typescript
"use client"

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface GeoTrackerProps {
  studentId: string
  enabled: boolean
  updateInterval?: number // milliseconds (default 30s)
}

export function GeoTracker({
  studentId,
  enabled,
  updateInterval = 30000
}: GeoTrackerProps) {
  const [status, setStatus] = useState<'inactive' | 'active' | 'error'>('inactive')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const sendLocation = useCallback(async (position: GeolocationPosition) => {
    try {
      const battery = await getBatteryLevel()

      const response = await fetch('/api/geo/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          battery,
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      setLastUpdate(new Date())
      setStatus('active')
      setErrorMessage(null)
    } catch (error) {
      console.error('Failed to send location:', error)
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Network error')

      // Queue for offline retry
      await queueLocationForRetry(position, studentId)
    }
  }, [studentId])

  useEffect(() => {
    if (!enabled) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
        setWatchId(null)
      }
      setStatus('inactive')
      return
    }

    if (!navigator.geolocation) {
      setStatus('error')
      setErrorMessage('Geolocation not supported')
      return
    }

    const id = navigator.geolocation.watchPosition(
      sendLocation,
      (error) => {
        console.error('Geolocation error:', error)
        setStatus('error')
        setErrorMessage(error.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000, // 10 seconds
        timeout: 5000,     // 5 seconds
      }
    )

    setWatchId(id)

    return () => {
      navigator.geolocation.clearWatch(id)
    }
  }, [enabled, sendLocation])

  return (
    <div className="flex items-center gap-3 rounded-lg border p-4">
      <div className={`h-3 w-3 rounded-full animate-pulse ${
        status === 'active' ? 'bg-green-500' :
        status === 'error' ? 'bg-red-500' :
        'bg-gray-400'
      }`} />

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">Location Tracking</p>
          <Badge variant={status === 'active' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}>
            {status}
          </Badge>
        </div>

        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last update: {lastUpdate.toLocaleTimeString()}
          </p>
        )}

        {errorMessage && (
          <p className="text-xs text-destructive mt-1">{errorMessage}</p>
        )}
      </div>

      {status === 'error' && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      )}
    </div>
  )
}

// === HELPER FUNCTIONS ===

async function getBatteryLevel(): Promise<number | undefined> {
  if ('getBattery' in navigator) {
    try {
      const battery = await (navigator as any).getBattery()
      return Math.round(battery.level * 100)
    } catch {
      return undefined
    }
  }
  return undefined
}

async function queueLocationForRetry(
  position: GeolocationPosition,
  studentId: string
) {
  if (!('indexedDB' in window)) return

  try {
    const db = await openDB('geo-queue', 1)
    const tx = db.transaction('pending', 'readwrite')
    await tx.objectStore('pending').add({
      studentId,
      lat: position.coords.latitude,
      lon: position.coords.longitude,
      accuracy: position.coords.accuracy,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to queue location:', error)
  }
}

// Simple IndexedDB wrapper
function openDB(name: string, version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}
```

### 5.2 Live Map Dashboard

**File**: `src/components/platform/attendance/geo/live-map.tsx`

```typescript
"use client"

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { getLiveStudentLocations, getGeofences } from '../actions'

// Lazy load Leaflet (client-side only)
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
)
const Circle = dynamic(
  () => import('react-leaflet').then(mod => mod.Circle),
  { ssr: false }
)

interface StudentLocation {
  studentId: string
  name: string
  lat: number
  lon: number
  accuracy?: number | null
  battery?: number | null
  lastUpdate: Date
}

interface Geofence {
  id: string
  name: string
  type: string
  centerLat?: number | null
  centerLon?: number | null
  radiusMeters?: number | null
  color?: string | null
}

export function GeoLiveMap({ schoolId }: { schoolId: string }) {
  const [students, setStudents] = useState<StudentLocation[]>([])
  const [geofences, setGeofences] = useState<Geofence[]>([])
  const [loading, setLoading] = useState(true)
  const [ws, setWs] = useState<WebSocket | null>(null)

  // Load initial data
  useEffect(() => {
    async function loadData() {
      const [locationsRes, geofencesRes] = await Promise.all([
        getLiveStudentLocations(),
        getGeofences()
      ])

      setStudents(locationsRes.students)
      setGeofences(geofencesRes.geofences)
      setLoading(false)
    }

    loadData()
  }, [])

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const websocket = new WebSocket(`${protocol}//${window.location.host}/api/geo/ws`)

    websocket.onopen = () => {
      console.log('WebSocket connected')
    }

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'geofence_event') {
        // Refresh student locations on geofence event
        getLiveStudentLocations().then(res => setStudents(res.students))
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    websocket.onclose = () => {
      console.log('WebSocket disconnected')
    }

    setWs(websocket)

    return () => {
      websocket.close()
    }
  }, [])

  // Poll for updates every 10 seconds (fallback if WebSocket fails)
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await getLiveStudentLocations()
      setStudents(res.students)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-96">Loading map...</div>
  }

  // Calculate map center (default to first geofence or Riyadh)
  const center: [number, number] = geofences[0]?.centerLat && geofences[0]?.centerLon
    ? [Number(geofences[0].centerLat), Number(geofences[0].centerLon)]
    : [24.7136, 46.6753] // Riyadh, Saudi Arabia

  return (
    <div className="rounded-lg border overflow-hidden" style={{ height: '600px' }}>
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Render geofences */}
        {geofences.map(fence => {
          if (!fence.centerLat || !fence.centerLon || !fence.radiusMeters) return null

          return (
            <Circle
              key={fence.id}
              center={[Number(fence.centerLat), Number(fence.centerLon)]}
              radius={fence.radiusMeters}
              pathOptions={{
                color: fence.color || '#3b82f6',
                fillColor: fence.color || '#3b82f6',
                fillOpacity: 0.2
              }}
            >
              <Popup>
                <div>
                  <strong>{fence.name}</strong>
                  <p className="text-sm text-muted-foreground">{fence.type}</p>
                </div>
              </Popup>
            </Circle>
          )
        })}

        {/* Render student markers */}
        {students.map(student => (
          <Marker
            key={student.studentId}
            position={[student.lat, student.lon]}
          >
            <Popup>
              <div className="space-y-1">
                <strong>{student.name}</strong>
                <p className="text-xs text-muted-foreground">
                  Battery: {student.battery}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Accuracy: ±{Math.round(student.accuracy || 0)}m
                </p>
                <p className="text-xs text-muted-foreground">
                  Last update: {new Date(student.lastUpdate).toLocaleTimeString()}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
```

---

## Phase 6: Deployment & Performance Optimization

### 6.1 Environment Variables

Add to `.env`:

```bash
# PostGIS (already in DATABASE_URL - just enable extension in Neon console)
DATABASE_URL=postgresql://...

# WebSocket server (for custom Next.js server)
NODE_ENV=production
PORT=3000
```

### 6.2 Install Dependencies

```bash
pnpm add ws pg leaflet react-leaflet @types/leaflet @types/ws
```

### 6.3 PostGIS Performance Tuning

```sql
-- Create spatial indexes (run after migrations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_location_traces_geom
ON location_traces
USING GIST (ST_SetSRID(ST_MakePoint(lon::float, lat::float), 4326));

-- Create BRIN index for timestamp-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_location_traces_timestamp_brin
ON location_traces
USING BRIN (timestamp);

-- Analyze tables for query planner
ANALYZE location_traces;
ANALYZE geo_fences;
ANALYZE geo_attendance_events;
```

### 6.4 Scheduled Cleanup (Cron Job)

**File**: `src/app/api/cron/cleanup-locations/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"

import { cleanupOldLocationTraces } from "@/lib/geo-service"

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel Cron or custom scheduler)
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const deleted = await cleanupOldLocationTraces(30) // 30 days retention

  return NextResponse.json({
    success: true,
    deletedTraces: deleted,
    timestamp: new Date().toISOString(),
  })
}
```

**Add to `vercel.json`**:

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-locations",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Performance Benchmarks (Expected)

- **Location ingestion**: < 100ms per request (with proper indexes)
- **Geofence check**: < 50ms for up to 20 geofences per school
- **Live map load**: < 2s for 500 active students
- **WebSocket latency**: < 100ms for event propagation
- **Storage**: ~1KB per location trace × 30 days = 30MB per student/month

---

## Privacy & Compliance

1. **Consent**: Require guardian consent before enabling location tracking
2. **Retention**: Auto-delete traces > 30 days (configurable)
3. **Access control**: Only school admins can view live maps
4. **Anonymization**: Export features exclude student names (only IDs)
5. **Audit logs**: Track who accessed location data (extend audit.prisma)

---

## Testing Checklist

- [ ] Enable PostGIS extension on Neon
- [ ] Run Prisma migrations
- [ ] Create spatial indexes
- [ ] Test circular geofence creation
- [ ] Test polygon geofence creation
- [ ] Test location submission from mobile browser
- [ ] Verify WebSocket connection
- [ ] Test geofence ENTER event triggers attendance
- [ ] Test rate limiting (20 req/10s)
- [ ] Test offline queue with Service Worker
- [ ] Load test with 100 concurrent location updates
- [ ] Verify cleanup cron job

---

## Timeline Estimate

- **Phase 1** (Database + PostGIS): 1 day
- **Phase 2** (Service layer): 2 days
- **Phase 3** (Server actions + API): 1 day
- **Phase 4** (WebSocket server): 1 day
- **Phase 5** (PWA frontend): 2 days
- **Phase 6** (Testing + optimization): 1 day

**Total: 8 days (1.5 weeks)**

---

## Next Steps

1. **Confirm plan**: Review architecture and timeline
2. **Start Phase 1**: Enable PostGIS, create Prisma schema
3. **Implement Phase 2**: Build geo-service.ts
4. **Build incrementally**: Test each phase before proceeding
5. **Monitor performance**: Add Sentry tracking for geofence processing

**Ready to implement? Let's start with Phase 1: PostGIS setup and Prisma schema.**
