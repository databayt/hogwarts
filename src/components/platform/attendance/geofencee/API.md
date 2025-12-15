# API Reference: Geo Real-Time Attendance System

**Version**: 1.0
**Base URL**: `https://ed.databayt.org`
**Authentication**: Session-based (NextAuth JWT)

---

## Table of Contents

- [Authentication](#authentication)
- [API Routes](#api-routes)
- [Server Actions](#server-actions)
- [WebSocket API](#websocket-api)
- [Error Codes](#error-codes)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

---

## Authentication

All API endpoints require authentication via session cookie.

### Session Structure

```typescript
interface Session {
  user: {
    id: string
    email: string
    schoolId: string
    role: "ADMIN" | "TEACHER" | "STUDENT" | "GUARDIAN"
    isPlatformAdmin: boolean
  }
  expires: string
}
```

### Authorization Rules

| Endpoint                    | Student | Teacher | Admin  | Platform Admin |
| --------------------------- | ------- | ------- | ------ | -------------- |
| `POST /api/geo/location`    | ✅ Own  | ❌      | ❌     | ✅ All         |
| `createGeofence()`          | ❌      | ❌      | ✅     | ✅             |
| `getLiveStudentLocations()` | ❌      | ❌      | ✅     | ✅             |
| `getLocationHistory()`      | ✅ Own  | ❌      | ✅ All | ✅ All         |

---

## API Routes

### POST /api/geo/location

Submit student location update.

#### Request

```http
POST /api/geo/location HTTP/1.1
Host: ed.databayt.org
Content-Type: application/json
Cookie: session-token=eyJhbGc...

{
  "studentId": "student_cm5a1b2c3d4e5f6g7h8i9",
  "lat": 24.7136,
  "lon": 46.6753,
  "accuracy": 15.2,
  "battery": 85,
  "deviceId": "fingerprint_abc123"
}
```

#### Request Body Schema

```typescript
{
  studentId: string      // Required: Student CUID
  lat: number           // Required: -90 to 90
  lon: number           // Required: -180 to 180
  accuracy?: number     // Optional: GPS accuracy in meters (0-10000)
  battery?: number      // Optional: Battery percentage (0-100)
  deviceId?: string     // Optional: Browser fingerprint (max 255 chars)
}
```

#### Response

**Success (200 OK)**:

```json
{
  "success": true,
  "timestamp": "2025-01-19T10:30:45.123Z"
}
```

**Validation Error (400 Bad Request)**:

```json
{
  "error": "Invalid coordinates",
  "details": {
    "lat": "Number must be less than or equal to 90"
  }
}
```

**Unauthorized (401 Unauthorized)**:

```json
{
  "error": "Unauthorized"
}
```

**Rate Limit Exceeded (429 Too Many Requests)**:

```json
{
  "error": "Too many requests",
  "retryAfter": 10
}
```

**Headers**:

```
Retry-After: 10
```

#### Performance

- **Latency**: < 100ms (p95)
- **Throughput**: 300 req/s (10,000 students / 30s interval)
- **Rate Limit**: 20 requests per 10 seconds per student

#### Example (cURL)

```bash
curl -X POST https://ed.databayt.org/api/geo/location \
  -H 'Content-Type: application/json' \
  -H 'Cookie: session-token=eyJhbGc...' \
  -d '{
    "studentId": "student_cm5a1b2c3d4e5f6g7h8i9",
    "lat": 24.7136,
    "lon": 46.6753,
    "accuracy": 15.2,
    "battery": 85
  }'
```

#### Example (JavaScript)

```javascript
const response = await fetch("/api/geo/location", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    accuracy: position.coords.accuracy,
    battery: await getBatteryLevel(),
  }),
})

const result = await response.json()
if (result.success) {
  console.log("Location submitted:", result.timestamp)
}
```

---

## Server Actions

Server actions are called from React Server Components using the `"use server"` directive.

### submitLocation

Submit student location (same as POST /api/geo/location but for server components).

```typescript
import { submitLocation } from "@/components/platform/attendance/geofence/actions"

const result = await submitLocation({
  studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
  lat: 24.7136,
  lon: 46.6753,
  accuracy: 15.2,
  battery: 85,
})
```

**Return Type**:

```typescript
{
  success: true
  timestamp: string
}
```

**Throws**:

- `Error('Unauthorized')` if no session
- `Error('Missing school context')` if no schoolId
- `ZodError` if validation fails

---

### createGeofence

Create a new geofence for the school.

```typescript
import { createGeofence } from "@/components/platform/attendance/geofence/actions"

const result = await createGeofence({
  name: "Main Campus",
  type: "SCHOOL_GROUNDS",
  description: "Primary school boundary",
  centerLat: 24.7136,
  centerLon: 46.6753,
  radiusMeters: 500,
  color: "#3b82f6",
})
```

**Input Schema**:

```typescript
{
  name: string                      // Required: 1-100 chars
  type: GeoFenceType                // Required: SCHOOL_GROUNDS, CLASSROOM, etc.
  description?: string              // Optional

  // Option 1: Circular geofence
  centerLat?: number                // Required if circular: -90 to 90
  centerLon?: number                // Required if circular: -180 to 180
  radiusMeters?: number             // Required if circular: 10-10000

  // Option 2: Polygon geofence
  polygonGeoJSON?: string           // Required if polygon: Valid GeoJSON

  color?: string                    // Optional: Hex color (#RRGGBB)
}
```

**Validation Rules**:

- Must provide EITHER circular (centerLat, centerLon, radiusMeters) OR polygon (polygonGeoJSON)
- Cannot provide both circular and polygon

**Return Type**:

```typescript
{
  success: true
  geofenceId: string
}
```

**Example (Circular)**:

```typescript
await createGeofence({
  name: "School Grounds",
  type: "SCHOOL_GROUNDS",
  centerLat: 24.7136,
  centerLon: 46.6753,
  radiusMeters: 500,
  color: "#3b82f6",
})
```

**Example (Polygon)**:

```typescript
await createGeofence({
  name: "Irregular Campus Boundary",
  type: "SCHOOL_GROUNDS",
  polygonGeoJSON: JSON.stringify({
    type: "Polygon",
    coordinates: [
      [
        [46.675, 24.713],
        [46.676, 24.713],
        [46.676, 24.714],
        [46.675, 24.714],
        [46.675, 24.713],
      ],
    ],
  }),
  color: "#10b981",
})
```

---

### updateGeofence

Update an existing geofence.

```typescript
import { updateGeofence } from "@/components/platform/attendance/geofence/actions"

await updateGeofence("geofence_cm5a1b2c3d4e5f6g7h8i9", {
  radiusMeters: 600,
  isActive: true,
})
```

**Parameters**:

- `geofenceId: string` - CUID of geofence
- `input: Partial<GeofenceInput>` - Fields to update

**Return Type**:

```typescript
{
  success: true
}
```

---

### deleteGeofence

Delete (soft delete) a geofence.

```typescript
import { deleteGeofence } from "@/components/platform/attendance/geofence/actions"

await deleteGeofence("geofence_cm5a1b2c3d4e5f6g7h8i9")
```

**Parameters**:

- `geofenceId: string` - CUID of geofence

**Return Type**:

```typescript
{
  success: true
}
```

**Note**: This is a hard delete, not soft delete. All related events are cascade deleted.

---

### getGeofences

Get all active geofences for the current school.

```typescript
import { getGeofences } from "@/components/platform/attendance/geofence/actions"

const { geofences } = await getGeofences()
```

**Return Type**:

```typescript
{
  geofences: Array<{
    id: string
    schoolId: string
    name: string
    type: GeoFenceType
    description: string | null
    centerLat: Decimal | null
    centerLon: Decimal | null
    radiusMeters: number | null
    polygonGeoJSON: string | null
    isActive: boolean
    color: string
    createdAt: Date
    updatedAt: Date
  }>
}
```

**Example**:

```typescript
const { geofences } = await getGeofences()
console.log(`Found ${geofences.length} geofences`)

geofences.forEach((fence) => {
  console.log(
    `${fence.name} (${fence.type}): ${fence.isActive ? "Active" : "Inactive"}`
  )
})
```

---

### getLiveStudentLocations

Get all students with location updates in the last 5 minutes.

```typescript
import { getLiveStudentLocations } from "@/components/platform/attendance/geofence/actions"

const { students } = await getLiveStudentLocations()
```

**Return Type**:

```typescript
{
  students: Array<{
    studentId: string
    name: string
    lat: number
    lon: number
    accuracy: number | null
    battery: number | null
    lastUpdate: Date
  }>
}
```

**Performance**:

- Uses PostgreSQL `DISTINCT ON` for efficiency
- Returns students with updates in last 5 minutes only
- Sorted by latest update first

**Example**:

```typescript
const { students } = await getLiveStudentLocations()

students.forEach((student) => {
  console.log(`${student.name}: (${student.lat}, ${student.lon})`)
  console.log(`  Battery: ${student.battery}%`)
  console.log(`  Accuracy: ±${student.accuracy}m`)
  console.log(`  Last update: ${student.lastUpdate.toLocaleTimeString()}`)
})
```

---

### getGeofenceEvents

Get geofence entry/exit event history.

```typescript
import { getGeofenceEvents } from "@/components/platform/attendance/geofence/actions"

const { events } = await getGeofenceEvents({
  studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-01-31"),
})
```

**Parameters** (all optional):

```typescript
{
  studentId?: string
  geofenceId?: string
  startDate?: Date
  endDate?: Date
}
```

**Return Type**:

```typescript
{
  events: Array<{
    id: string
    schoolId: string
    studentId: string
    geofenceId: string
    eventType: "ENTER" | "EXIT" | "INSIDE"
    lat: Decimal
    lon: Decimal
    accuracy: number | null
    timestamp: Date
    processedAt: Date | null
    student: {
      givenName: string
      surname: string
    }
    geofence: {
      name: string
      type: GeoFenceType
    }
  }>
}
```

**Limits**:

- Returns max 100 events (most recent first)
- Results are ordered by `timestamp DESC`

**Example (Student Timeline)**:

```typescript
const { events } = await getGeofenceEvents({
  studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
  startDate: new Date("2025-01-19T00:00:00Z"),
  endDate: new Date("2025-01-19T23:59:59Z"),
})

events.forEach((event) => {
  const student = `${event.student.givenName} ${event.student.surname}`
  console.log(
    `${event.timestamp.toLocaleTimeString()}: ${student} ${event.eventType} ${event.geofence.name}`
  )
})

// Output:
// 07:45:30: Ahmad Al-Rashid ENTER Main Campus
// 07:46:15: Ahmad Al-Rashid ENTER Classroom 101
// 12:30:00: Ahmad Al-Rashid EXIT Classroom 101
// 12:31:00: Ahmad Al-Rashid ENTER Cafeteria
```

---

## WebSocket API

### Connection

```javascript
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
const ws = new WebSocket(`${protocol}//${window.location.host}/api/geo/ws`)

ws.onopen = () => {
  console.log("WebSocket connected")
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log("Received:", message)
}

ws.onerror = (error) => {
  console.error("WebSocket error:", error)
}

ws.onclose = () => {
  console.log("WebSocket disconnected")
}
```

### Message Types

#### Connection Confirmation

Sent immediately after connection.

```json
{
  "type": "connected",
  "message": "WebSocket connected"
}
```

#### Geofence Event

Sent when student enters/exits geofence.

```json
{
  "type": "geofence_event",
  "data": {
    "eventId": "event_cm5a1b2c3d4e5f6g7h8i9",
    "schoolId": "school_cm5a1b2c3d4e5f6g7h8i9",
    "studentId": "student_cm5a1b2c3d4e5f6g7h8i9",
    "geofenceId": "geofence_cm5a1b2c3d4e5f6g7h8i9",
    "eventType": "ENTER",
    "lat": "24.7136",
    "lon": "46.6753",
    "timestamp": "2025-01-19T07:45:30.123Z"
  }
}
```

### Client Implementation

```typescript
interface GeofenceEvent {
  eventId: string
  schoolId: string
  studentId: string
  geofenceId: string
  eventType: "ENTER" | "EXIT" | "INSIDE"
  lat: string
  lon: string
  timestamp: string
}

const ws = new WebSocket("wss://ed.databayt.org/api/geo/ws")

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  if (message.type === "geofence_event") {
    const data: GeofenceEvent = message.data

    // Update live map marker
    updateStudentMarker(data.studentId, {
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      lastUpdate: new Date(data.timestamp),
    })

    // Show notification
    if (data.eventType === "ENTER") {
      showNotification(`Student entered ${data.geofenceId}`)
    }
  }
}
```

### Reconnection Logic

```typescript
let ws: WebSocket | null = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

function connect() {
  ws = new WebSocket("wss://ed.databayt.org/api/geo/ws")

  ws.onopen = () => {
    console.log("WebSocket connected")
    reconnectAttempts = 0
  }

  ws.onclose = () => {
    console.log("WebSocket disconnected")

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
      console.log(`Reconnecting in ${delay}ms...`)
      setTimeout(connect, delay)
    } else {
      console.error(
        "Max reconnection attempts reached. Falling back to polling."
      )
      startPolling()
    }
  }
}

function startPolling() {
  setInterval(async () => {
    const { students } = await getLiveStudentLocations()
    updateStudentMarkers(students)
  }, 10000) // Poll every 10 seconds
}
```

---

## Error Codes

| Code    | Error                 | Cause                                 | Solution                                             |
| ------- | --------------------- | ------------------------------------- | ---------------------------------------------------- |
| **400** | Bad Request           | Invalid input (Zod validation failed) | Check request body schema                            |
| **401** | Unauthorized          | No session or invalid session         | Login via `/api/auth/signin`                         |
| **403** | Forbidden             | Insufficient permissions              | Check user role (e.g., student cannot view live map) |
| **429** | Too Many Requests     | Rate limit exceeded (20 req/10s)      | Wait for `Retry-After` seconds                       |
| **500** | Internal Server Error | Database error or service failure     | Check logs, retry request                            |

### Error Response Format

```typescript
{
  error: string           // Human-readable error message
  details?: object        // Validation errors (Zod)
  retryAfter?: number     // Seconds to wait (rate limiting)
}
```

### Example Error Handling

```typescript
try {
  const result = await submitLocation(locationData)
} catch (error) {
  if (error.message === "Too many requests") {
    // Rate limited - queue for retry
    await queueLocationForRetry(locationData)
  } else if (error.message === "Unauthorized") {
    // Redirect to login
    window.location.href = "/auth/signin"
  } else {
    // Show error to user
    toast.error(error.message)
  }
}
```

---

## Rate Limiting

### Limits

| Endpoint                 | Window     | Max Requests | Scope       |
| ------------------------ | ---------- | ------------ | ----------- |
| `POST /api/geo/location` | 10 seconds | 20           | Per student |

### Rate Limit Headers

**Response Headers**:

```
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 15
X-RateLimit-Reset: 1642598400
```

**When Exceeded**:

```
HTTP 429 Too Many Requests
Retry-After: 10
```

### Implementation

```typescript
// In-memory rate limiter (upgrade to Redis for production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}
```

---

## Examples

### Complete Student Location Tracking Flow

```typescript
// 1. Check if geolocation is supported
if (!navigator.geolocation) {
  alert("Geolocation not supported")
  return
}

// 2. Request permission and start tracking
const watchId = navigator.geolocation.watchPosition(
  async (position) => {
    // 3. Get battery level (optional)
    const battery = await getBatteryLevel()

    // 4. Submit location
    try {
      const result = await fetch("/api/geo/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          accuracy: position.coords.accuracy,
          battery,
        }),
      })

      if (!result.ok) {
        if (result.status === 429) {
          // Rate limited - queue for retry
          await queueLocationInIndexedDB(position)
        } else {
          throw new Error(`HTTP ${result.status}`)
        }
      } else {
        const data = await result.json()
        console.log("Location submitted:", data.timestamp)
      }
    } catch (error) {
      console.error("Failed to submit location:", error)
      await queueLocationInIndexedDB(position)
    }
  },
  (error) => {
    console.error("Geolocation error:", error)
  },
  {
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 5000,
  }
)

// 5. Cleanup on unmount
function cleanup() {
  navigator.geolocation.clearWatch(watchId)
}

// Helper function
async function getBatteryLevel(): Promise<number | undefined> {
  if ("getBattery" in navigator) {
    const battery = await (navigator as any).getBattery()
    return Math.round(battery.level * 100)
  }
  return undefined
}

async function queueLocationInIndexedDB(position: GeolocationPosition) {
  const db = await openDB("geo-queue", 1)
  await db.add("pending", {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date().toISOString(),
  })
}
```

### Admin Live Map with Real-time Updates

```typescript
'use client'

import { useEffect, useState } from 'react'
import { getLiveStudentLocations } from '../actions'

export function AdminLiveMap() {
  const [students, setStudents] = useState([])
  const [ws, setWs] = useState<WebSocket | null>(null)

  // 1. Load initial data
  useEffect(() => {
    async function loadData() {
      const { students } = await getLiveStudentLocations()
      setStudents(students)
    }
    loadData()
  }, [])

  // 2. Setup WebSocket for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const websocket = new WebSocket(`${protocol}//${window.location.host}/api/geo/ws`)

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data)

      if (message.type === 'geofence_event') {
        // Refresh student locations
        getLiveStudentLocations().then(res => setStudents(res.students))
      }
    }

    setWs(websocket)

    return () => websocket.close()
  }, [])

  // 3. Polling fallback (if WebSocket fails)
  useEffect(() => {
    const interval = setInterval(async () => {
      const { students } = await getLiveStudentLocations()
      setStudents(students)
    }, 10000) // Poll every 10 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h2>Live Student Locations ({students.length} active)</h2>
      {students.map(student => (
        <div key={student.studentId}>
          <strong>{student.name}</strong>
          <p>Location: ({student.lat.toFixed(6)}, {student.lon.toFixed(6)})</p>
          <p>Battery: {student.battery}%</p>
          <p>Accuracy: ±{student.accuracy}m</p>
          <p>Last update: {new Date(student.lastUpdate).toLocaleTimeString()}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## TypeScript Types

### Complete Type Definitions

```typescript
// Enums
export enum GeoFenceType {
  SCHOOL_GROUNDS = "SCHOOL_GROUNDS",
  CLASSROOM = "CLASSROOM",
  BUS_ROUTE = "BUS_ROUTE",
  PLAYGROUND = "PLAYGROUND",
  CAFETERIA = "CAFETERIA",
  LIBRARY = "LIBRARY",
}

export enum GeoEventType {
  ENTER = "ENTER",
  EXIT = "EXIT",
  INSIDE = "INSIDE",
}

// Location Types
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

// Geofence Types
export interface GeofenceInput {
  name: string
  type: GeoFenceType
  description?: string
  centerLat?: number
  centerLon?: number
  radiusMeters?: number
  polygonGeoJSON?: string
  color?: string
}

export interface Geofence {
  id: string
  schoolId: string
  name: string
  type: GeoFenceType
  description: string | null
  centerLat: Decimal | null
  centerLon: Decimal | null
  radiusMeters: number | null
  polygonGeoJSON: string | null
  isActive: boolean
  color: string
  createdAt: Date
  updatedAt: Date
}

// Event Types
export interface GeofenceEvent {
  id: string
  schoolId: string
  studentId: string
  geofenceId: string
  eventType: GeoEventType
  lat: Decimal
  lon: Decimal
  accuracy: number | null
  timestamp: Date
  processedAt: Date | null
  student: {
    givenName: string
    surname: string
  }
  geofence: {
    name: string
    type: GeoFenceType
  }
}

// API Response Types
export interface SubmitLocationResponse {
  success: true
  timestamp: string
}

export interface CreateGeofenceResponse {
  success: true
  geofenceId: string
}

export interface GetGeofencesResponse {
  geofences: Geofence[]
}

export interface GetLiveStudentLocationsResponse {
  students: Array<{
    studentId: string
    name: string
    lat: number
    lon: number
    accuracy: number | null
    battery: number | null
    lastUpdate: Date
  }>
}

export interface GetGeofenceEventsResponse {
  events: GeofenceEvent[]
}
```

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: Engineering Team
