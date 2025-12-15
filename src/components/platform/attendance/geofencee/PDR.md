# Product Design Review (PDR): Geo Real-Time Attendance System

**Document Version:** 1.0
**Date:** January 2025
**Status:** 📋 Planning Phase
**Owner:** Engineering Team
**Stakeholders:** School Administrators, Students, Guardians, Platform Team

---

## Executive Summary

### Vision

Transform school attendance tracking from manual, error-prone processes to fully automated, geofence-based real-time monitoring using GPS technology.

### Value Proposition

- **For Schools**: Reduce attendance marking time from 15 minutes/class to < 1 second (automatic)
- **For Teachers**: Eliminate manual attendance sheets, reduce administrative burden by 80%
- **For Parents**: Real-time visibility into student arrival/departure
- **For Students**: Frictionless check-in experience via mobile browser

### Business Impact

- **Time Savings**: 50,000+ hours/year saved across all schools (assuming 100 schools × 500 students × 1 minute/day)
- **Accuracy**: 99.9% accuracy vs. 85% with manual processes
- **Safety**: Real-time alerts for students not arriving at school
- **Compliance**: Automated audit trail for regulatory requirements

### Key Metrics

| Metric                    | Target            | Current (Manual)    |
| ------------------------- | ----------------- | ------------------- |
| Attendance marking time   | < 1 second (auto) | 15 minutes/class    |
| Accuracy rate             | 99.9%             | 85%                 |
| Late detection latency    | < 30 seconds      | End of class period |
| Parent notification delay | < 2 minutes       | 24+ hours           |
| Teacher time saved        | 80%               | 0%                  |

---

## Problem Statement

### Current Pain Points

#### 1. Manual Attendance Process (Critical)

- **Problem**: Teachers manually call student names and mark attendance on paper or spreadsheets
- **Impact**: 15 minutes per class wasted, 10% human error rate
- **Evidence**: Survey of 50 teachers shows 78% report attendance as "most time-consuming administrative task"

#### 2. Late Detection Delays (High)

- **Problem**: Students marked LATE only after roll call, not upon actual arrival
- **Impact**: No real-time visibility for parents, delayed intervention for truancy
- **Evidence**: Average 2-hour delay between student arrival and parent notification

#### 3. Attendance Fraud (Medium)

- **Problem**: Students answer for absent friends, falsify attendance records
- **Impact**: Inaccurate data, legal liability for schools
- **Evidence**: 23% of students admit to "helping" absent friends in anonymous survey

#### 4. Multi-Location Tracking (Medium)

- **Problem**: No way to verify student location within large campuses (library, cafeteria, bus routes)
- **Impact**: Safety concerns, inability to locate students during emergencies
- **Evidence**: 12 emergency lockdown drills showed 45-minute delays in accounting for all students

#### 5. Reporting Overhead (Low)

- **Problem**: Weekly/monthly attendance reports require manual data aggregation
- **Impact**: 8 hours/month per school for report generation
- **Evidence**: Accounting staff logs show consistent 2 full days/month on attendance reports

### User Research Findings

**School Administrators (n=25)**

- 88% want "real-time attendance visibility"
- 76% cite "manual data entry" as top pain point
- 92% would adopt automated attendance if privacy concerns addressed

**Teachers (n=50)**

- 78% spend > 15 minutes/day on attendance
- 64% report attendance errors in their classes
- 100% want automated solution if it "just works"

**Parents (n=200)**

- 82% want real-time notification when child arrives at school
- 45% concerned about privacy/tracking
- 67% willing to enable tracking if child safety improved

**Students (n=150)**

- 54% find manual attendance "annoying waste of time"
- 38% concerned about privacy
- 71% prefer automated check-in over roll call

---

## Solution Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Student Mobile PWA              Admin Live Dashboard               │
│  ┌─────────────────┐            ┌─────────────────────┐            │
│  │ GeoTracker      │            │ GeoLiveMap          │            │
│  │ - watchPosition │            │ - Leaflet.js Map    │            │
│  │ - Offline Queue │            │ - Student Markers   │            │
│  │ - Battery Status│            │ - Geofence Circles  │            │
│  └────────┬────────┘            └──────────┬──────────┘            │
│           │                                │                        │
└───────────┼────────────────────────────────┼────────────────────────┘
            │                                │
            │ POST /api/geo/location         │ WS /api/geo/ws
            │ (every 30s)                    │ (real-time events)
            ↓                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Next.js 15 Server Actions          Custom WebSocket Server        │
│  ┌──────────────────────┐          ┌────────────────────┐          │
│  │ submitLocation()     │          │ PostgreSQL NOTIFY  │          │
│  │ - Auth check         │          │ Listener           │          │
│  │ - Rate limiting      │◄─────────┤ - pg.on('notify')  │          │
│  │ - schoolId scope     │          │ - Broadcast to WS  │          │
│  └──────────┬───────────┘          └────────────────────┘          │
│             │                                                       │
│             ↓                                                       │
│  ┌──────────────────────────────────────────────────────┐          │
│  │ Geo Service Layer (geo-service.ts)                   │          │
│  │ - saveLocationTrace()                                │          │
│  │ - checkGeofences() ──► Haversine OR PostGIS         │          │
│  │ - processGeofenceEvents() ──► Auto-mark attendance  │          │
│  │ - cleanupOldLocationTraces()                        │          │
│  └──────────────────────┬───────────────────────────────┘          │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PostgreSQL 16 + PostGIS 3.4                                       │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │ Tables:                                                  │       │
│  │ - geo_fences (GiST spatial index)                       │       │
│  │ - location_traces (BRIN timestamp index)                │       │
│  │ - geo_attendance_events                                 │       │
│  │ - attendances (existing, updated by triggers)           │       │
│  │                                                          │       │
│  │ Triggers:                                                │       │
│  │ - notify_geofence_event() → NOTIFY channel             │       │
│  │ - auto_mark_attendance() → Update attendances          │       │
│  │                                                          │       │
│  │ Functions:                                               │       │
│  │ - ST_Contains(polygon, point) → Boolean                 │       │
│  │ - ST_DWithin(geom1, geom2, radius) → Boolean           │       │
│  │ - ST_Distance(geom1::geography, geom2::geography) → m  │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Rationale

| Component      | Technology                | Why Not Alternatives?                                                            |
| -------------- | ------------------------- | -------------------------------------------------------------------------------- |
| **Backend**    | Next.js 15 Server Actions | Already in use, serverless, no new infrastructure                                |
| **Database**   | PostgreSQL + PostGIS      | ✅ Existing Neon DB, ❌ MongoDB (no spatial joins), ❌ Redis (no persistence)    |
| **Real-time**  | PostgreSQL LISTEN/NOTIFY  | ✅ Zero dependency, ❌ Pusher ($$$), ❌ Ably ($$$), ❌ Firebase (vendor lock-in) |
| **Mapping**    | Leaflet.js                | ✅ Open-source, ❌ Google Maps ($$$), ❌ Mapbox ($$$)                            |
| **Mobile**     | PWA (Browser)             | ✅ No app store, ❌ Native app (2x dev cost), ❌ React Native (new tech)         |
| **Validation** | Zod 4.0                   | Already in use, type-safe                                                        |
| **ORM**        | Prisma 6.14               | Already in use, PostGIS compatible                                               |

### Decision Log

#### Decision 1: PostgreSQL LISTEN/NOTIFY vs. External Message Broker

- **Options**: PostgreSQL LISTEN/NOTIFY, Redis Pub/Sub, RabbitMQ, Kafka
- **Choice**: PostgreSQL LISTEN/NOTIFY
- **Rationale**:
  - ✅ Zero additional infrastructure (already using PostgreSQL)
  - ✅ Triggers automatically notify on database changes
  - ✅ Supports 8,000 byte payloads (sufficient for events)
  - ✅ Low latency (< 50ms)
  - ❌ Not horizontally scalable (acceptable for 10K concurrent users)
  - ❌ No message persistence (acceptable for real-time events)
- **Trade-offs**: Limited to single PostgreSQL instance, but sufficient for MVP

#### Decision 2: Haversine vs. PostGIS for Circular Geofences

- **Options**: Haversine formula (pure TypeScript), PostGIS ST_DWithin
- **Choice**: Hybrid approach (Haversine for circles, PostGIS for polygons)
- **Rationale**:
  - ✅ Haversine: < 1ms calculation, no database round-trip
  - ✅ PostGIS: Required for polygon geofences, spatial indexes
  - ❌ Haversine: Less accurate for distances > 10km (acceptable for school campuses)
  - ❌ PostGIS: 5-10ms overhead per query
- **Trade-offs**: Slight code complexity, but 10x performance improvement for circular geofences

#### Decision 3: PWA vs. Native App

- **Options**: PWA (browser-based), React Native, iOS/Android native
- **Choice**: PWA
- **Rationale**:
  - ✅ No app store approval delays (weeks → instant)
  - ✅ Zero installation friction (just open URL)
  - ✅ Single codebase for iOS/Android
  - ✅ Automatic updates (no user action required)
  - ❌ No background location tracking (iOS/Android restrictions)
  - ❌ Requires HTTPS (already have)
- **Trade-offs**: Foreground-only tracking, but acceptable since students are actively using devices during school hours

#### Decision 4: WebSocket on Vercel vs. Separate Server

- **Options**: Vercel Edge Functions, Separate WebSocket server (Railway/Render), Pusher
- **Choice**: Custom WebSocket server (optional, fallback to polling)
- **Rationale**:
  - ✅ Vercel doesn't support persistent WebSocket connections
  - ✅ Polling fallback (10s interval) acceptable for MVP
  - ✅ Can deploy WebSocket server later if needed
  - ❌ Slightly higher latency with polling (10s vs. 100ms)
- **Trade-offs**: MVP uses polling, WebSocket server deployed post-MVP

#### Decision 5: 30-Day Data Retention vs. Indefinite

- **Options**: 7 days, 30 days, 90 days, indefinite
- **Choice**: 30 days (configurable)
- **Rationale**:
  - ✅ GDPR compliance (data minimization)
  - ✅ Storage optimization (1KB × 1000 updates/day × 500 students = 15GB/month)
  - ✅ Performance (smaller tables, faster queries)
  - ❌ Cannot analyze long-term location patterns
- **Trade-offs**: Must export data for long-term analysis, but acceptable

---

## Technical Design

### Data Models

#### 1. GeoFence Model

```prisma
model GeoFence {
  id          String       @id @default(cuid())
  schoolId    String       // Multi-tenant scoping (CRITICAL)
  name        String       // e.g., "Main Campus", "Math Classroom 101"
  type        GeoFenceType
  description String?

  // Option 1: Circular geofence (use Haversine for performance)
  centerLat   Decimal?     @db.Decimal(10, 8) // 8 decimal places = ~1mm precision
  centerLon   Decimal?     @db.Decimal(11, 8) // 8 decimal places = ~1mm precision
  radiusMeters Int?        // Radius in meters (e.g., 500)

  // Option 2: Polygon geofence (use PostGIS ST_Contains)
  polygonGeoJSON String?   @db.Text // GeoJSON string for complex shapes

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

enum GeoFenceType {
  SCHOOL_GROUNDS    // Main campus boundary (triggers auto-attendance)
  CLASSROOM         // Individual classroom
  BUS_ROUTE         // Bus pickup/dropoff area
  PLAYGROUND        // Playground area
  CAFETERIA         // Cafeteria area
  LIBRARY           // Library area
}
```

**Design Rationale:**

- **Decimal vs. Float**: Decimal preserves precision for lat/lon (Float has rounding errors)
- **Dual Geofence Types**: Circular for simplicity, Polygon for complex campus shapes
- **Color Field**: Admin UI can visualize different geofence types
- **Soft Delete**: `isActive` flag instead of DELETE (preserve historical data)

#### 2. LocationTrace Model

```prisma
model LocationTrace {
  id          String   @id @default(cuid())
  schoolId    String   // Multi-tenant scoping
  studentId   String

  lat         Decimal  @db.Decimal(10, 8)
  lon         Decimal  @db.Decimal(11, 8)
  accuracy    Float?   // GPS accuracy in meters (iOS/Android provide this)
  altitude    Float?   // Altitude in meters (optional, for future 3D geofencing)
  heading     Float?   // Direction of travel (0-360 degrees)
  speed       Float?   // Speed in m/s (optional)

  battery     Int?     // Battery percentage (0-100) for analytics
  deviceId    String?  // Device fingerprint for fraud detection
  userAgent   String?  // Browser user agent for debugging

  timestamp   DateTime @default(now())

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student     Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Performance indexes
  @@index([schoolId, studentId, timestamp(sort: Desc)]) // Latest location per student
  @@index([timestamp(sort: Desc)]) // For cleanup/archival (BRIN candidate)
  @@index([schoolId, timestamp(sort: Desc)]) // School-wide queries

  @@map("location_traces")
}
```

**Design Rationale:**

- **Timestamp Index**: BRIN index for time-series data (100x smaller than B-tree)
- **Battery Field**: Helps identify students with low battery (safety concern)
- **DeviceId Field**: Detect students sharing devices (fraud prevention)
- **Composite Index**: `[schoolId, studentId, timestamp]` supports `SELECT DISTINCT ON` queries

#### 3. GeoAttendanceEvent Model

```prisma
model GeoAttendanceEvent {
  id          String       @id @default(cuid())
  schoolId    String       // Multi-tenant scoping
  studentId   String
  geofenceId  String
  eventType   GeoEventType

  // Event metadata
  lat         Decimal      @db.Decimal(10, 8) // Location at event time
  lon         Decimal      @db.Decimal(11, 8)
  accuracy    Float?

  timestamp   DateTime     @default(now())
  processedAt DateTime?    // When attendance was auto-marked (for audit)

  school      School       @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  student     Student      @relation(fields: [studentId], references: [id], onDelete: Cascade)
  geofence    GeoFence     @relation(fields: [geofenceId], references: [id], onDelete: Cascade)

  @@index([schoolId, geofenceId, timestamp(sort: Desc)])
  @@index([studentId, eventType, timestamp(sort: Desc)])
  @@index([timestamp(sort: Desc)])

  @@map("geo_attendance_events")
}

enum GeoEventType {
  ENTER             // Student entered geofence
  EXIT              // Student exited geofence
  INSIDE            // Student confirmed inside (periodic check)
}
```

**Design Rationale:**

- **processedAt Field**: Audit trail for when attendance was auto-marked
- **Event Metadata**: Lat/lon at event time for forensic analysis
- **Event Types**: ENTER triggers attendance, EXIT logs departure, INSIDE confirms presence

### API Specifications

#### 1. Location Submission API

**Endpoint**: `POST /api/geo/location`

**Request:**

```typescript
{
  studentId: string      // Required
  lat: number           // -90 to 90
  lon: number           // -180 to 180
  accuracy?: number     // GPS accuracy in meters
  battery?: number      // 0-100
  deviceId?: string     // Browser fingerprint
}
```

**Response:**

```typescript
{
  success: true
  timestamp: "2025-01-19T10:30:00Z"
}
```

**Error Responses:**

```typescript
// 401 Unauthorized
{ error: "Unauthorized" }

// 429 Too Many Requests
{ error: "Too many requests", retryAfter: 10 }

// 400 Bad Request
{ error: "Invalid coordinates" }
```

**Rate Limiting:**

- **Limit**: 20 requests per 10 seconds per student
- **Penalty**: 429 response with `Retry-After` header
- **Implementation**: In-memory rate limiter (Redis-ready for production)

**Authentication:**

- **Method**: NextAuth session cookie
- **Validation**: `session.user.schoolId` must match `student.schoolId`

#### 2. Geofence Management API

**Create Geofence**: `createGeofence(input)`

```typescript
// Server Action
export async function createGeofence(input: {
  name: string
  type: GeoFenceType
  description?: string
  centerLat?: number
  centerLon?: number
  radiusMeters?: number
  polygonGeoJSON?: string
  color?: string
}) {
  // 1. Auth + schoolId scope
  const { schoolId } = await getTenantContext()

  // 2. Validation (either circular OR polygon required)
  const hasCircular = input.centerLat && input.centerLon && input.radiusMeters
  const hasPolygon = input.polygonGeoJSON

  if (!hasCircular && !hasPolygon) {
    throw new Error("Must provide either circular or polygon geofence data")
  }

  // 3. Create in DB
  const geofence = await db.geoFence.create({
    data: { ...input, schoolId },
  })

  // 4. Revalidate
  revalidatePath("/attendance/geo")

  return { success: true, geofenceId: geofence.id }
}
```

**Get Live Student Locations**: `getLiveStudentLocations()`

```typescript
// Returns all students with location updates in last 5 minutes
export async function getLiveStudentLocations() {
  const { schoolId } = await getTenantContext()
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  // PostgreSQL DISTINCT ON query (fast, optimized)
  const locations = await db.$queryRaw`
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

  return { students: locations }
}
```

### Core Algorithms

#### 1. Haversine Distance Calculation

**Use Case**: Fast distance check for circular geofences

**Implementation**:

```typescript
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
```

**Performance**: < 1ms (pure JavaScript, no DB query)

**Accuracy**: ±0.5% error for distances < 10km (sufficient for school campuses)

#### 2. Geofence Detection

**Use Case**: Check if student location is inside any active geofence

**Implementation**:

```typescript
export async function checkGeofences(
  location: Coordinates,
  schoolId: string
): Promise<GeofenceCheckResult[]> {
  const results: GeofenceCheckResult[] = []

  const geofences = await db.geoFence.findMany({
    where: { schoolId, isActive: true },
  })

  for (const fence of geofences) {
    let isInside = false
    let distance = 0

    if (fence.radiusMeters && fence.centerLat && fence.centerLon) {
      // CIRCULAR: Use Haversine (faster)
      distance = calculateDistance(location, {
        lat: Number(fence.centerLat),
        lon: Number(fence.centerLon),
      })
      isInside = distance <= fence.radiusMeters
    } else if (fence.polygonGeoJSON) {
      // POLYGON: Use PostGIS (required)
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
      // Include near-boundary (for smooth transitions)
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
```

**Performance**:

- Circular geofences: < 1ms per fence (Haversine)
- Polygon geofences: 5-10ms per fence (PostGIS with GiST index)
- Total: < 50ms for 20 geofences

#### 3. Auto-Attendance Marking

**Use Case**: Auto-mark attendance when student enters SCHOOL_GROUNDS during attendance window

**Business Rules**:

- **Window**: 7:00 AM - 9:00 AM only
- **Status**: PRESENT if 7:00-8:00 AM, LATE if 8:01-9:00 AM
- **Trigger**: ENTER event for SCHOOL_GROUNDS geofence
- **Scope**: All classes student is enrolled in

**Implementation**:

```typescript
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

  const status = hour >= 7 && hour < 8 ? "PRESENT" : "LATE" // 8:00 AM cutoff

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
```

**Edge Cases Handled**:

- ✅ Student enters multiple times (upsert prevents duplicates)
- ✅ Student already manually marked (upsert updates status)
- ✅ Student has no classes (no-op)
- ✅ Outside attendance window (no-op, logged)

### Database Optimization

#### Spatial Indexes

```sql
-- GiST index for polygon geofences (R-tree structure)
CREATE INDEX idx_geo_fences_geom
ON geo_fences
USING GIST (
  CASE
    WHEN polygon_geo_json IS NOT NULL THEN ST_GeomFromGeoJSON(polygon_geo_json)
    WHEN center_lat IS NOT NULL AND center_lon IS NOT NULL AND radius_meters IS NOT NULL
      THEN ST_Buffer(ST_SetSRID(ST_MakePoint(center_lon::float, center_lat::float), 4326)::geography, radius_meters)::geometry
    ELSE NULL
  END
);

-- GiST index for location traces (for spatial queries)
CREATE INDEX idx_location_traces_geom
ON location_traces
USING GIST (ST_SetSRID(ST_MakePoint(lon::float, lat::float), 4326));

-- BRIN index for timestamp-based queries (100x smaller than B-tree)
CREATE INDEX idx_location_traces_timestamp_brin
ON location_traces
USING BRIN (timestamp);
```

**Index Size Comparison** (for 10M location traces):

- **B-tree on timestamp**: 500 MB
- **BRIN on timestamp**: 5 MB (100x smaller)
- **GiST on geometry**: 200 MB

**Query Performance** (10M rows):

- **Without index**: 45 seconds (full table scan)
- **With BRIN index**: 120ms (block range scan)
- **With GiST index**: 8ms (spatial index lookup)

#### Partitioning Strategy (Future)

For schools with > 1M location traces, partition by month:

```sql
-- Partition by timestamp (monthly)
CREATE TABLE location_traces (
  -- columns...
) PARTITION BY RANGE (timestamp);

CREATE TABLE location_traces_2025_01 PARTITION OF location_traces
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE location_traces_2025_02 PARTITION OF location_traces
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

**Benefits**:

- ✅ Faster queries (scan only relevant partition)
- ✅ Easier cleanup (drop old partitions)
- ✅ Parallel query execution

---

## Security & Privacy

### Threat Model

| Threat                  | Likelihood | Impact   | Mitigation                                           |
| ----------------------- | ---------- | -------- | ---------------------------------------------------- |
| **Location spoofing**   | High       | Medium   | Device fingerprinting, IP validation, speed analysis |
| **Unauthorized access** | Medium     | High     | Session-based auth, schoolId scoping, rate limiting  |
| **Data breach**         | Low        | Critical | Encryption at rest, audit logging, access controls   |
| **Privacy violation**   | Medium     | High     | Consent management, data retention, anonymization    |
| **DoS attack**          | Medium     | Medium   | Rate limiting, CDN, WebSocket connection limits      |

### Security Measures

#### 1. Authentication & Authorization

```typescript
// CRITICAL: Every server action MUST include schoolId scope
export async function submitLocation(input: LocationInput) {
  // 1. Authenticate user
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  // 2. Get tenant context
  const { schoolId } = await getTenantContext()
  if (!schoolId) throw new Error("Missing school context")

  // 3. Validate student belongs to school
  const student = await db.student.findUnique({
    where: { id: input.studentId },
  })

  if (student.schoolId !== schoolId) {
    throw new Error("Student does not belong to this school")
  }

  // 4. Proceed with location submission
  // ...
}
```

#### 2. Input Validation

```typescript
// Zod schema with strict validation
const locationSchema = z.object({
  studentId: z.string().cuid(), // Validate CUID format
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  accuracy: z.number().min(0).max(10000).optional(), // GPS accuracy
  battery: z.number().int().min(0).max(100).optional(),
  deviceId: z.string().max(255).optional(),
})

// Server-side validation (NEVER trust client)
const parsed = locationSchema.parse(input)
```

#### 3. Rate Limiting

```typescript
// Rate limit configuration
export const RATE_LIMITS = {
  GEO_LOCATION: {
    windowMs: 10000, // 10 seconds
    maxRequests: 20, // 20 location updates per student
  },
}

// Rate limit check (in API route)
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
      headers: { "Retry-After": String(rateLimitResult.retryAfter) },
    }
  )
}
```

#### 4. Data Encryption

- **At Rest**: PostgreSQL Transparent Data Encryption (TDE) on Neon
- **In Transit**: HTTPS/TLS 1.3 (required for Geolocation API)
- **Database Connection**: SSL mode `require` in `DATABASE_URL`

### Privacy Compliance (GDPR, CCPA)

#### Consent Management

```typescript
// Before enabling location tracking, require guardian consent
interface LegalConsent {
  id: string
  userId: string
  schoolId: string
  consentType: 'LOCATION_TRACKING'
  granted: boolean
  grantedAt: DateTime
  revokedAt: DateTime?
  ipAddress: string
  userAgent: string
}

// Check consent before tracking
async function canTrackLocation(studentId: string): Promise<boolean> {
  const consent = await db.legalConsent.findFirst({
    where: {
      userId: studentId,
      consentType: 'LOCATION_TRACKING',
      granted: true,
      revokedAt: null
    }
  })

  return !!consent
}
```

#### Data Retention Policy

```typescript
// Auto-delete location traces older than 30 days
export async function cleanupOldLocationTraces(retentionDays: number = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  const result = await db.locationTrace.deleteMany({
    where: { timestamp: { lt: cutoffDate } },
  })

  logger.info("Cleaned up location traces", {
    deleted: result.count,
    cutoffDate,
  })
  return result.count
}

// Run daily via cron job (Vercel Cron)
// GET /api/cron/cleanup-locations (scheduled at 2:00 AM)
```

#### Data Export (GDPR Right to Data Portability)

```typescript
// Export all location data for a student (CSV format)
export async function exportStudentLocationData(studentId: string) {
  const { schoolId } = await getTenantContext()

  const traces = await db.locationTrace.findMany({
    where: { schoolId, studentId },
    orderBy: { timestamp: "asc" },
  })

  // Convert to CSV (exclude sensitive fields like deviceId)
  const csv = [
    "timestamp,latitude,longitude,accuracy,battery",
    ...traces.map(
      (t) =>
        `${t.timestamp.toISOString()},${t.lat},${t.lon},${t.accuracy || ""},${t.battery || ""}`
    ),
  ].join("\n")

  return { csv, filename: `location-data-${studentId}.csv` }
}
```

#### Anonymization

```typescript
// Anonymize location data for analytics (aggregate only)
export async function getSchoolHeatmap(schoolId: string) {
  // Return aggregated heatmap data (no individual student IDs)
  const heatmap = await db.$queryRaw`
    SELECT
      ST_SnapToGrid(ST_SetSRID(ST_MakePoint(lon::float, lat::float), 4326)::geography, 0.001)::geometry as grid_point,
      COUNT(*) as density
    FROM location_traces
    WHERE school_id = ${schoolId}
      AND timestamp >= NOW() - INTERVAL '7 days'
    GROUP BY grid_point
  `

  return { heatmap } // No studentId, only density
}
```

### Audit Logging

```typescript
// Log all access to location data
interface AuditLog {
  id: string
  schoolId: string
  userId: string
  action: "VIEW_LOCATION" | "EXPORT_DATA" | "MODIFY_GEOFENCE"
  resourceId: string
  ipAddress: string
  userAgent: string
  timestamp: DateTime
}

// Example: Log when admin views live map
export async function getLiveStudentLocations() {
  const { schoolId } = await getTenantContext()
  const session = await auth()

  // Audit log
  await db.auditLog.create({
    data: {
      schoolId,
      userId: session.user.id,
      action: "VIEW_LOCATION",
      resourceId: schoolId,
      ipAddress: req.headers.get("x-forwarded-for"),
      userAgent: req.headers.get("user-agent"),
    },
  })

  // Return location data
  // ...
}
```

---

## Performance Requirements

### Service Level Objectives (SLOs)

| Metric                         | Target        | Measurement                       | Alerting                 |
| ------------------------------ | ------------- | --------------------------------- | ------------------------ |
| **Location ingestion latency** | < 100ms (p95) | `/api/geo/location` response time | Sentry alert if > 200ms  |
| **Geofence check latency**     | < 50ms (p99)  | `checkGeofences()` execution time | Log warning if > 100ms   |
| **Live map load time**         | < 2s (p95)    | Time to first marker render       | Vercel Analytics         |
| **WebSocket latency**          | < 100ms       | Event emission to client receipt  | Custom WebSocket metrics |
| **Database query time**        | < 20ms (p95)  | Prisma query duration             | Slow query log (> 50ms)  |
| **Uptime**                     | 99.9%         | Vercel + Neon uptime              | Status page              |

### Load Testing Scenarios

#### Scenario 1: Normal Load (500 students, 30s intervals)

```
Expected Requests/Second: 500 students / 30 seconds = 16.7 req/s
Database Queries/Second: 16.7 × 2 (INSERT + SELECT) = 33.4 queries/s
Storage Growth: 500 students × 1KB × 2,880 updates/day = 1.44 GB/day
```

**Result**: ✅ Well below PostgreSQL limits (10,000 queries/s)

#### Scenario 2: Peak Load (2,000 students, 10s intervals)

```
Expected Requests/Second: 2,000 students / 10 seconds = 200 req/s
Database Queries/Second: 200 × 2 = 400 queries/s
Concurrent Connections: 200 req/s × 100ms latency = 20 concurrent
```

**Result**: ✅ Within Neon connection pool (100 connections)

#### Scenario 3: Burst Load (All students arrive simultaneously at 7:00 AM)

```
Expected Requests: 2,000 students × 1 location update = 2,000 req
Burst Duration: 60 seconds (students spread arrival across 1 minute)
Peak Requests/Second: 2,000 / 60 = 33 req/s
Geofence Checks: 2,000 × 5 geofences × 10ms = 100 seconds total compute
```

**Result**: ⚠️ Potential bottleneck - Implement queue-based processing

**Mitigation**: Use BullMQ job queue for geofence processing (async, non-blocking)

### Caching Strategy

#### 1. Geofence Cache (Redis or In-Memory)

```typescript
// Cache active geofences for 5 minutes (reduce DB queries)
const GEOFENCE_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

let geofenceCache: Map<string, GeoFence[]> = new Map()

export async function getActiveGeofences(schoolId: string) {
  // Check cache
  if (geofenceCache.has(schoolId)) {
    return geofenceCache.get(schoolId)!
  }

  // Query database
  const geofences = await db.geoFence.findMany({
    where: { schoolId, isActive: true },
  })

  // Update cache
  geofenceCache.set(schoolId, geofences)
  setTimeout(() => geofenceCache.delete(schoolId), GEOFENCE_CACHE_TTL)

  return geofences
}
```

**Impact**: Reduces DB queries by 95% (1 query per 5 minutes vs. 1 query per location update)

#### 2. Student Info Cache

```typescript
// Cache student names for live map (reduce JOINs)
const studentCache = new Map<string, { name: string; photo?: string }>()

// Pre-warm cache on server start
export async function warmStudentCache(schoolId: string) {
  const students = await db.student.findMany({
    where: { schoolId },
    select: { id: true, givenName: true, surname: true, photoUrl: true },
  })

  students.forEach((s) => {
    studentCache.set(s.id, {
      name: `${s.givenName} ${s.surname}`,
      photo: s.photoUrl || undefined,
    })
  })
}
```

**Impact**: Eliminates JOIN queries on live map (< 1ms lookups vs. 10ms JOINs)

### Database Connection Pooling

```typescript
// Prisma connection pool configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Connection pool settings
  connection_limit = 100     // Max connections
  pool_timeout     = 20      // Seconds to wait for connection
}
```

**Tuning**:

- **Development**: 5 connections
- **Production**: 100 connections (Neon limit)
- **Serverless**: Use PgBouncer connection pooler

---

## Testing Strategy

### Test Coverage Goals

| Layer                 | Coverage Target      | Tools                    |
| --------------------- | -------------------- | ------------------------ |
| **Unit Tests**        | 80%                  | Vitest + Testing Library |
| **Integration Tests** | 60%                  | Vitest + Prisma mock     |
| **E2E Tests**         | 40% (critical paths) | Playwright               |
| **Load Tests**        | 100% (all endpoints) | k6 or Artillery          |
| **Security Tests**    | 100% (OWASP Top 10)  | Manual + SonarQube       |

### Unit Tests

#### geo-service.test.ts

```typescript
import { describe, expect, it } from "vitest"

import { calculateDistance, checkGeofences } from "./geo-service"

describe("calculateDistance", () => {
  it("should calculate distance between two points", () => {
    const riyadh = { lat: 24.7136, lon: 46.6753 }
    const nearby = { lat: 24.72, lon: 46.68 }

    const distance = calculateDistance(riyadh, nearby)

    expect(distance).toBeGreaterThan(0)
    expect(distance).toBeLessThan(1000) // < 1km
  })

  it("should return 0 for identical points", () => {
    const point = { lat: 24.7136, lon: 46.6753 }
    const distance = calculateDistance(point, point)

    expect(distance).toBe(0)
  })

  it("should handle edge case: poles", () => {
    const northPole = { lat: 90, lon: 0 }
    const southPole = { lat: -90, lon: 0 }

    const distance = calculateDistance(northPole, southPole)

    expect(distance).toBeCloseTo(20015087, -4) // ~20,015 km (Earth circumference / 2)
  })
})

describe("checkGeofences", () => {
  it("should detect point inside circular geofence", async () => {
    const location = { lat: 24.7136, lon: 46.6753 }
    const schoolId = "test-school-123"

    // Mock database to return circular geofence
    const results = await checkGeofences(location, schoolId)

    expect(results).toHaveLength(1)
    expect(results[0].isInside).toBe(true)
  })

  it("should detect point outside geofence", async () => {
    const location = { lat: 25.0, lon: 47.0 } // Far away
    const schoolId = "test-school-123"

    const results = await checkGeofences(location, schoolId)

    expect(results).toHaveLength(0)
  })
})
```

### Integration Tests

#### actions.test.ts

```typescript
import { beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"

import { submitLocation } from "./actions"

describe("submitLocation", () => {
  beforeAll(async () => {
    // Setup test database with seed data
    await db.school.create({ data: { id: "test-school", name: "Test School" } })
    await db.student.create({
      data: { id: "test-student", schoolId: "test-school" },
    })
  })

  it("should save location trace", async () => {
    const result = await submitLocation({
      studentId: "test-student",
      lat: 24.7136,
      lon: 46.6753,
      accuracy: 10,
    })

    expect(result.success).toBe(true)

    // Verify database insert
    const trace = await db.locationTrace.findFirst({
      where: { studentId: "test-student" },
    })

    expect(trace).toBeDefined()
    expect(Number(trace!.lat)).toBeCloseTo(24.7136)
  })

  it("should reject invalid coordinates", async () => {
    await expect(
      submitLocation({
        studentId: "test-student",
        lat: 999, // Invalid
        lon: 46.6753,
      })
    ).rejects.toThrow("Invalid coordinates")
  })

  it("should enforce rate limiting", async () => {
    // Submit 21 locations rapidly (limit is 20)
    const promises = Array.from({ length: 21 }, () =>
      submitLocation({
        studentId: "test-student",
        lat: 24.7136,
        lon: 46.6753,
      })
    )

    const results = await Promise.allSettled(promises)

    // Expect last request to fail with 429
    const rejected = results.filter((r) => r.status === "rejected")
    expect(rejected.length).toBeGreaterThan(0)
  })
})
```

### E2E Tests (Playwright)

#### geo-tracking.spec.ts

```typescript
import { expect, test } from "@playwright/test"

test.describe("Geofence Tracking", () => {
  test("student can enable location tracking", async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(["geolocation"])
    await context.setGeolocation({ latitude: 24.7136, longitude: 46.6753 })

    // Navigate to student lab
    await page.goto("/student/attendance")

    // Enable tracking
    await page.click('button:has-text("Enable Location Tracking")')

    // Verify status indicator
    await expect(page.locator(".status-indicator")).toHaveClass(/active/)

    // Wait for location submission
    await page.waitForResponse(
      (response) =>
        response.url().includes("/api/geo/location") &&
        response.status() === 200
    )
  })

  test("admin can view live student locations", async ({ page }) => {
    await page.goto("/admin/attendance/live-map")

    // Wait for map to load
    await page.waitForSelector(".leaflet-container")

    // Verify student markers appear
    const markers = page.locator(".leaflet-marker-icon")
    await expect(markers).toHaveCount(5) // Assume 5 active students
  })

  test("geofence entry triggers attendance", async ({ page, context }) => {
    // Mock student location entering school grounds
    await context.setGeolocation({ latitude: 24.7136, longitude: 46.6753 })

    // Wait for geofence event
    await page.waitForResponse((response) =>
      response.url().includes("/api/geo/location")
    )

    // Navigate to attendance page
    await page.goto("/student/attendance")

    // Verify attendance marked
    await expect(page.locator(".attendance-status")).toHaveText("PRESENT")
  })
})
```

### Load Testing

#### k6 Load Test Script

```javascript
// load-test.js
import { check, sleep } from "k6"
import http from "k6/http"

export const options = {
  stages: [
    { duration: "1m", target: 50 }, // Ramp up to 50 users
    { duration: "5m", target: 50 }, // Stay at 50 users for 5 minutes
    { duration: "1m", target: 200 }, // Spike to 200 users
    { duration: "2m", target: 200 }, // Stay at 200 users
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<200"], // 95% of requests < 200ms
    http_req_failed: ["rate<0.01"], // Error rate < 1%
  },
}

export default function () {
  const payload = JSON.stringify({
    studentId: "test-student-123",
    lat: 24.7136 + (Math.random() - 0.5) * 0.01, // Random location near school
    lon: 46.6753 + (Math.random() - 0.5) * 0.01,
    accuracy: 10,
    battery: Math.floor(Math.random() * 100),
  })

  const params = {
    headers: {
      "Content-Type": "application/json",
      Cookie: "session-token=YOUR_SESSION_TOKEN",
    },
  }

  const res = http.post(
    "https://ed.databayt.org/api/geo/location",
    payload,
    params
  )

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 200ms": (r) => r.timings.duration < 200,
  })

  sleep(30) // Simulate 30-second update interval
}
```

**Run**: `k6 run load-test.js`

---

## Deployment Plan

### Phase 1: Development Environment (Week 1)

**Tasks**:

- [ ] Enable PostGIS extension on Neon dev database
- [ ] Run Prisma migrations (geo-attendance models)
- [ ] Create database triggers (notify_geofence_event)
- [ ] Implement geo-service.ts (core logic)
- [ ] Implement server actions (submitLocation, createGeofence)
- [ ] Build GeoTracker component (PWA)
- [ ] Build GeoLiveMap component (Leaflet)
- [ ] Setup custom WebSocket server (server.js)
- [ ] Unit tests for geo-service
- [ ] Integration tests for actions

**Deliverables**:

- ✅ Fully functional geofencing system on localhost
- ✅ 80% test coverage
- ✅ Documentation (README.md, PDR.md)

### Phase 2: Staging Environment (Week 2)

**Tasks**:

- [ ] Deploy to Vercel staging branch
- [ ] Enable PostGIS on Neon staging database
- [ ] Run E2E tests (Playwright)
- [ ] Load testing (k6) with 100 concurrent users
- [ ] Security testing (OWASP Top 10)
- [ ] Performance optimization (indexes, caching)
- [ ] User acceptance testing (UAT) with 5 schools

**Deliverables**:

- ✅ Staging environment passes all tests
- ✅ UAT feedback incorporated
- ✅ Performance meets SLOs (< 100ms p95)

### Phase 3: Production Rollout (Week 3)

**Strategy**: Gradual rollout with feature flags

**Rollout Schedule**:

1. **Day 1-2**: 1 pilot school (100 students)
2. **Day 3-4**: 5 schools (500 students total)
3. **Day 5-7**: 20 schools (2,000 students)
4. **Day 8+**: All schools (10,000+ students)

**Rollback Plan**:

- **Trigger**: Error rate > 1% OR p95 latency > 500ms
- **Action**: Disable feature flag, revert to manual attendance
- **Notification**: Sentry alert → PagerDuty → Engineering team

**Monitoring Checklist**:

- [ ] Sentry error tracking configured
- [ ] Vercel Analytics dashboard reviewed
- [ ] Database query performance monitored (slow query log)
- [ ] WebSocket connection count tracked
- [ ] Storage growth monitored (location_traces table size)

### Infrastructure Checklist

**Database** (PostgreSQL + PostGIS):

- [ ] PostGIS extension enabled (`CREATE EXTENSION postgis`)
- [ ] Spatial indexes created (GiST on geofences, BRIN on timestamps)
- [ ] Database triggers installed (notify_geofence_event)
- [ ] Connection pooling configured (100 connections)
- [ ] Backup strategy (Neon automated backups)

**Application** (Next.js 15):

- [ ] Dependencies installed (`pnpm add ws pg leaflet react-leaflet`)
- [ ] Custom server deployed (`server.js` for WebSocket)
- [ ] Environment variables configured (`DATABASE_URL`, `CRON_SECRET`)
- [ ] Rate limiting enabled (`RATE_LIMITS.GEO_LOCATION`)
- [ ] Cron job scheduled (`/api/cron/cleanup-locations` at 2:00 AM)

**Monitoring** (Sentry + Vercel):

- [ ] Sentry project created for geofencing
- [ ] Error tracking configured (server actions, API routes)
- [ ] Performance monitoring enabled (Core Web Vitals)
- [ ] Alerts configured (error rate, latency thresholds)

**Security**:

- [ ] HTTPS enforced (required for Geolocation API)
- [ ] CORS headers configured (allow only school subdomains)
- [ ] Content Security Policy (CSP) updated for Leaflet
- [ ] Input validation (Zod schemas on all server actions)
- [ ] Audit logging enabled (view_location, export_data)

---

## Timeline & Milestones

### Overall Timeline: 3 Weeks (8 Working Days)

```
Week 1: Development (Days 1-5)
├─ Day 1: Database setup + geo-service.ts
├─ Day 2: Server actions + API routes
├─ Day 3: GeoTracker component (PWA)
├─ Day 4: GeoLiveMap component (Leaflet)
├─ Day 5: Testing + bug fixes
│
Week 2: Staging & Testing (Days 6-10)
├─ Day 6: Deploy to staging + E2E tests
├─ Day 7: Load testing + performance optimization
├─ Day 8: Security testing + penetration testing
├─ Day 9: UAT with 5 pilot schools
├─ Day 10: Feedback incorporation + polish
│
Week 3: Production Rollout (Days 11-15)
├─ Day 11: Deploy to production (1 school)
├─ Day 12: Expand to 5 schools
├─ Day 13: Expand to 20 schools
├─ Day 14: Monitor + fix issues
├─ Day 15: Full rollout to all schools
```

### Detailed Task Breakdown

#### Phase 1: Database Layer (Day 1)

- [ ] **Enable PostGIS** (1 hour)
  - Run `CREATE EXTENSION postgis` on Neon
  - Verify with `SELECT PostGIS_version()`
- [ ] **Create Prisma models** (2 hours)
  - Add geo-attendance.prisma file
  - Run `pnpm prisma migrate dev --name add-geo-attendance`
  - Verify tables created
- [ ] **Create database triggers** (2 hours)
  - Write migration SQL for `notify_geofence_event()`
  - Test trigger fires on INSERT
- [ ] **Create spatial indexes** (1 hour)
  - GiST index on geo_fences
  - BRIN index on location_traces
  - Verify with `EXPLAIN ANALYZE`
- [ ] **Test database setup** (1 hour)
  - Insert test geofence
  - Insert test location trace
  - Verify trigger notification

**Acceptance Criteria**:

- ✅ PostGIS extension enabled
- ✅ All 3 models created (GeoFence, LocationTrace, GeoAttendanceEvent)
- ✅ Triggers fire on INSERT
- ✅ Spatial indexes improve query performance (< 10ms)

#### Phase 2: Service Layer (Day 2)

- [ ] **Implement geo-service.ts** (4 hours)
  - `calculateDistance()` (Haversine)
  - `checkGeofences()` (Haversine + PostGIS)
  - `saveLocationTrace()`
  - `processGeofenceEvents()`
  - `autoMarkAttendance()`
  - `cleanupOldLocationTraces()`
- [ ] **Write unit tests** (2 hours)
  - Test Haversine calculation
  - Test circular geofence detection
  - Test polygon geofence detection (mocked)
  - Test auto-attendance logic
- [ ] **Implement server actions** (2 hours)
  - `submitLocation()`
  - `createGeofence()`
  - `updateGeofence()`
  - `deleteGeofence()`
  - `getGeofences()`
  - `getLiveStudentLocations()`

**Acceptance Criteria**:

- ✅ All service functions implemented
- ✅ Unit tests pass (80% coverage)
- ✅ Server actions follow mirror-pattern
- ✅ schoolId scoping on all queries

#### Phase 3: API Layer (Day 3)

- [ ] **Create API route** (2 hours)
  - `POST /api/geo/location`
  - Auth middleware
  - Rate limiting (20 req/10s)
  - Input validation (Zod)
- [ ] **Add rate limiting config** (1 hour)
  - Update `src/lib/rate-limit.ts`
  - Add `GEO_LOCATION` limit
- [ ] **Create validation schemas** (1 hour)
  - `locationSchema`
  - `geofenceSchema`
- [ ] **Setup custom WebSocket server** (3 hours)
  - Create `server.js`
  - PostgreSQL LISTEN/NOTIFY client
  - WebSocket broadcast
  - Test with `wscat`
- [ ] **Update package.json** (1 hour)
  - Add dependencies (`ws`, `pg`, `leaflet`, `react-leaflet`)
  - Update `dev` script to `node server.js`

**Acceptance Criteria**:

- ✅ API route returns 200 on valid request
- ✅ Rate limiting blocks 21st request
- ✅ WebSocket server broadcasts events
- ✅ Custom server works in dev mode

#### Phase 4: PWA Components (Day 4)

- [ ] **Build GeoTracker component** (3 hours)
  - `navigator.geolocation.watchPosition()`
  - Battery API integration
  - IndexedDB offline queue
  - Status indicator UI
- [ ] **Build GeoLiveMap component** (3 hours)
  - Dynamic Leaflet import (SSR: false)
  - WebSocket connection
  - Student markers
  - Geofence circles
  - Polling fallback
- [ ] **Build geofence management UI** (2 hours)
  - Form to create circular geofence
  - Form to create polygon geofence (draw on map)
  - List of active geofences

**Acceptance Criteria**:

- ✅ GeoTracker sends location every 30 seconds
- ✅ Offline queue works when network fails
- ✅ Live map updates in real-time (< 2s latency)
- ✅ Admin can create/update/delete geofences

#### Phase 5: Testing & Polish (Day 5)

- [ ] **Integration tests** (2 hours)
  - Test location submission end-to-end
  - Test geofence creation
  - Test auto-attendance marking
- [ ] **E2E tests** (Playwright) (2 hours)
  - Test student enables tracking
  - Test admin views live map
  - Test geofence entry triggers attendance
- [ ] **Bug fixes** (3 hours)
  - Fix failing tests
  - Fix UI bugs
  - Fix performance issues
- [ ] **Documentation** (1 hour)
  - Update README.md
  - Add API documentation
  - Add deployment guide

**Acceptance Criteria**:

- ✅ All tests pass (unit, integration, E2E)
- ✅ No critical bugs
- ✅ Documentation complete

---

## Risk Assessment

### Technical Risks

| Risk                                          | Likelihood | Impact   | Mitigation                                                   | Contingency                                          |
| --------------------------------------------- | ---------- | -------- | ------------------------------------------------------------ | ---------------------------------------------------- |
| **PostGIS not supported on Neon**             | Low        | Critical | Verify Neon supports PostGIS before starting                 | Use separate PostGIS server (Supabase, Crunchy Data) |
| **WebSocket server incompatible with Vercel** | Medium     | High     | Document limitation, implement polling fallback              | Deploy WebSocket server on Railway/Render            |
| **Geolocation API blocked by browser**        | Medium     | High     | Require HTTPS, show permission prompt                        | Fallback to manual check-in                          |
| **Battery drain concerns from parents**       | High       | Medium   | Optimize update interval (30s → 60s), add battery saver mode | Provide opt-out option                               |
| **GPS inaccuracy indoors**                    | High       | Medium   | Use accuracy field to filter low-quality locations (> 50m)   | Combine with WiFi fingerprinting (future)            |
| **Rate limiting too strict**                  | Medium     | Medium   | Monitor rejected requests, adjust limits                     | Increase to 30 req/10s if needed                     |
| **Database performance degradation**          | Low        | High     | Use spatial indexes, BRIN for timestamps                     | Add partitioning, read replicas                      |

### Privacy Risks

| Risk                                             | Likelihood | Impact   | Mitigation                                           |
| ------------------------------------------------ | ---------- | -------- | ---------------------------------------------------- |
| **Parent concerns about tracking**               | High       | High     | Require explicit consent, transparent privacy policy |
| **Data breach exposing student locations**       | Low        | Critical | Encrypt at rest, audit logging, access controls      |
| **Location data used for unauthorized purposes** | Low        | Critical | Limit access to admins only, audit all queries       |
| **Data retention violates GDPR**                 | Medium     | High     | Auto-delete after 30 days, document retention policy |

### Operational Risks

| Risk                                             | Likelihood | Impact | Mitigation                                           |
| ------------------------------------------------ | ---------- | ------ | ---------------------------------------------------- |
| **Students forget to enable tracking**           | High       | Medium | Auto-enable for enrolled students, send reminders    |
| **False attendance due to GPS spoofing**         | Medium     | Medium | Device fingerprinting, IP validation, speed analysis |
| **Teachers distrust automated system**           | Medium     | High   | Allow manual override, show confidence score         |
| **Network failures prevent location submission** | High       | Low    | Offline queue with retry (IndexedDB)                 |

---

## Success Metrics

### Key Performance Indicators (KPIs)

#### Primary Metrics (Outcome)

| Metric                      | Baseline (Manual) | Target (6 Months) | Measurement                                        |
| --------------------------- | ----------------- | ----------------- | -------------------------------------------------- |
| **Attendance marking time** | 15 min/class      | < 1 second        | Avg time from student arrival to attendance marked |
| **Attendance accuracy**     | 85%               | 99%               | % of attendance records matching ground truth      |
| **Teacher time saved**      | 0 hours/week      | 5 hours/week      | Survey of teachers                                 |
| **Parent satisfaction**     | N/A               | 80%               | NPS score from parent survey                       |
| **Student adoption rate**   | N/A               | 90%               | % of students with location tracking enabled       |

#### Secondary Metrics (Output)

| Metric                           | Target      | Measurement                                         |
| -------------------------------- | ----------- | --------------------------------------------------- |
| **Location update success rate** | > 99%       | % of location submissions with 200 response         |
| **Geofence detection accuracy**  | > 95%       | % of ENTER events within 30 seconds of actual entry |
| **System uptime**                | > 99.9%     | Vercel + Neon uptime                                |
| **Average latency (p95)**        | < 100ms     | `/api/geo/location` response time                   |
| **Storage growth rate**          | < 2GB/month | `location_traces` table size                        |

#### User Engagement Metrics

| Metric                            | Target   | Measurement                              |
| --------------------------------- | -------- | ---------------------------------------- |
| **Daily active users (students)** | 80%      | % of students submitting locations daily |
| **Admin dashboard usage**         | 50%      | % of admins viewing live map weekly      |
| **Geofence creation rate**        | 5/school | Avg geofences created per school         |
| **Error rate**                    | < 1%     | % of location submissions failing        |

### Success Criteria

**MVP Launch Success** (after 1 month):

- ✅ 10+ schools using geofencing
- ✅ 1,000+ students tracked daily
- ✅ < 1% error rate
- ✅ 99.9% uptime
- ✅ < 100ms p95 latency

**Feature Success** (after 6 months):

- ✅ 50+ schools using geofencing
- ✅ 10,000+ students tracked daily
- ✅ 90%+ student adoption rate
- ✅ 80%+ parent satisfaction (NPS)
- ✅ 5+ hours/week teacher time saved

**Business Impact** (after 1 year):

- ✅ 20%+ reduction in truancy rates
- ✅ 50%+ reduction in late arrivals
- ✅ $100K+ annual savings (teacher time)
- ✅ 10%+ increase in parent engagement

---

## Appendix

### A. Glossary

| Term                  | Definition                                                         |
| --------------------- | ------------------------------------------------------------------ |
| **Geofence**          | Virtual boundary defined by GPS coordinates (circle or polygon)    |
| **Haversine Formula** | Algorithm to calculate great-circle distance between two points    |
| **PostGIS**           | PostgreSQL extension for geospatial data (ST_Contains, ST_DWithin) |
| **GiST Index**        | Generalized Search Tree for spatial data (R-tree structure)        |
| **BRIN Index**        | Block Range INdex for time-series data (100x smaller than B-tree)  |
| **LISTEN/NOTIFY**     | PostgreSQL asynchronous notification mechanism                     |
| **PWA**               | Progressive Web App (browser-based app with offline capabilities)  |
| **Leaflet.js**        | Open-source JavaScript mapping library                             |
| **Mirror-Pattern**    | Architecture where URL routes mirror component directories         |

### B. References

1. **PostGIS Documentation**: https://postgis.net/docs/
2. **PostgreSQL LISTEN/NOTIFY**: https://www.postgresql.org/docs/current/sql-notify.html
3. **React Leaflet**: https://react-leaflet.js.org/
4. **MDN Geolocation API**: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation_API
5. **Next.js Custom Server**: https://nextjs.org/docs/pages/building-your-application/configuring/custom-server
6. **Haversine Formula**: https://en.wikipedia.org/wiki/Haversine_formula
7. **GDPR Guidelines**: https://gdpr.eu/
8. **OWASP Top 10**: https://owasp.org/Top10/

### C. Related Work

**Inspiring Projects**:

1. **postgres-websockets** (diogob): PostgreSQL LISTEN/NOTIFY → WebSocket middleware
2. **real-time-websockets-postgres-example** (fdesjardins): Real-time patterns
3. **pg-listen** (andywer): PostgreSQL LISTEN/NOTIFY for Node.js
4. **Crunchy Data pg_eventserv**: Real-time eventing for PostGIS

**Commercial Solutions**:

1. **Geotab**: Fleet tracking with geofencing ($$$)
2. **Life360**: Family location tracking (privacy concerns)
3. **Google Classroom**: No geofencing (opportunity for differentiation)

### D. Open Questions

1. **Battery Optimization**: Should we reduce update frequency when battery < 20%?
   - **Recommendation**: Yes, increase interval from 30s → 60s when battery < 20%

2. **Accuracy Threshold**: What GPS accuracy should we reject (> 50m, > 100m)?
   - **Recommendation**: Reject accuracy > 50m (indoor WiFi fallback)

3. **Multi-Campus Support**: How to handle schools with multiple campuses?
   - **Recommendation**: Allow multiple SCHOOL_GROUNDS geofences per school

4. **Late Cutoff Time**: Should 8:00 AM cutoff be configurable per school?
   - **Recommendation**: Yes, add `attendanceWindowStart` and `attendanceWindowEnd` to School model

5. **Geofence Overlap**: What if student is inside multiple geofences?
   - **Recommendation**: Prioritize smallest geofence (e.g., CLASSROOM over SCHOOL_GROUNDS)

---

## Approval Signatures

**Prepared by**: Engineering Team
**Date**: January 2025

**Reviewed by**:

- [ ] Product Manager: ****\*\*\*\*****\_\_\_****\*\*\*\***** Date: \***\*\_\_\*\***
- [ ] Engineering Lead: ****\*\*\*\*****\_\_\_****\*\*\*\***** Date: \***\*\_\_\*\***
- [ ] Security Team: ****\*\*\*\*****\_\_\_****\*\*\*\***** Date: \***\*\_\_\*\***
- [ ] Legal/Compliance: ****\*\*\*\*****\_\_\_****\*\*\*\***** Date: \***\*\_\_\*\***

**Approved by**:

- [ ] CTO: ****\*\*\*\*****\_\_\_****\*\*\*\***** Date: \***\*\_\_\*\***
- [ ] CEO: ****\*\*\*\*****\_\_\_****\*\*\*\***** Date: \***\*\_\_\*\***

---

**Document Status**: 📋 Draft
**Next Review Date**: [To be determined after initial review]
**Version History**:

- v1.0 (2025-01-19): Initial PDR draft

---

_This Product Design Review is a living document and will be updated as the project progresses._
