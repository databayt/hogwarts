# Testing Guide: Geo Real-Time Attendance System

**Test Coverage Goal**: 80%+
**Tools**: Vitest, React Testing Library, Playwright

---

## Table of Contents

- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [E2E Tests](#e2e-tests)
- [Load Tests](#load-tests)
- [Manual Testing](#manual-testing)
- [Test Data Setup](#test-data-setup)

---

## Unit Tests

### File: `src/lib/geo-service.test.ts`

Test the core geospatial service layer.

#### Test: Haversine Distance Calculation

```typescript
import { describe, expect, it } from "vitest"

import { calculateDistance } from "./geo-service"

describe("calculateDistance", () => {
  it("should calculate distance between two points in meters", () => {
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

  it("should handle edge case: equator crossing", () => {
    const north = { lat: 1.0, lon: 0.0 }
    const south = { lat: -1.0, lon: 0.0 }

    const distance = calculateDistance(north, south)

    expect(distance).toBeCloseTo(222390, -2) // ~222km
  })

  it("should handle edge case: international date line", () => {
    const west = { lat: 0.0, lon: 179.0 }
    const east = { lat: 0.0, lon: -179.0 }

    const distance = calculateDistance(west, east)

    expect(distance).toBeCloseTo(222390, -2) // ~222km
  })

  it("should handle edge case: poles", () => {
    const northPole = { lat: 90, lon: 0 }
    const southPole = { lat: -90, lon: 0 }

    const distance = calculateDistance(northPole, southPole)

    expect(distance).toBeCloseTo(20015087, -4) // ~20,015 km (half Earth circumference)
  })
})
```

#### Test: Circular Geofence Detection

```typescript
import { describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { checkGeofences } from "./geo-service"

// Mock Prisma client
vi.mock("@/lib/db", () => ({
  db: {
    geoFence: {
      findMany: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

describe("checkGeofences", () => {
  it("should detect point inside circular geofence", async () => {
    const location = { lat: 24.7136, lon: 46.6753 }
    const schoolId = "test-school"

    // Mock database response
    vi.mocked(db.geoFence.findMany).mockResolvedValue([
      {
        id: "fence-1",
        name: "Main Campus",
        type: "SCHOOL_GROUNDS",
        centerLat: 24.7136,
        centerLon: 46.6753,
        radiusMeters: 500,
        polygonGeoJSON: null,
        isActive: true,
      },
    ])

    const results = await checkGeofences(location, schoolId)

    expect(results).toHaveLength(1)
    expect(results[0].isInside).toBe(true)
    expect(results[0].geofenceName).toBe("Main Campus")
    expect(results[0].distance).toBe(0)
  })

  it("should detect point outside circular geofence", async () => {
    const location = { lat: 25.0, lon: 47.0 } // Far away
    const schoolId = "test-school"

    vi.mocked(db.geoFence.findMany).mockResolvedValue([
      {
        id: "fence-1",
        name: "Main Campus",
        type: "SCHOOL_GROUNDS",
        centerLat: 24.7136,
        centerLon: 46.6753,
        radiusMeters: 500,
        polygonGeoJSON: null,
        isActive: true,
      },
    ])

    const results = await checkGeofences(location, schoolId)

    expect(results).toHaveLength(0) // Not inside, not within 100m boundary
  })

  it("should include points near boundary (< 100m)", async () => {
    const location = { lat: 24.7136, lon: 46.6803 } // ~50m from center
    const schoolId = "test-school"

    vi.mocked(db.geoFence.findMany).mockResolvedValue([
      {
        id: "fence-1",
        name: "Main Campus",
        type: "SCHOOL_GROUNDS",
        centerLat: 24.7136,
        centerLon: 46.6753,
        radiusMeters: 30, // Radius 30m
        polygonGeoJSON: null,
        isActive: true,
      },
    ])

    const results = await checkGeofences(location, schoolId)

    expect(results).toHaveLength(1)
    expect(results[0].isInside).toBe(false)
    expect(results[0].distance).toBeLessThan(100)
  })
})
```

#### Test: Auto-Attendance Logic

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { processGeofenceEvents } from "./geo-service"

describe("processGeofenceEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should auto-mark PRESENT when entering school at 7:30 AM", async () => {
    const studentId = "student-1"
    const schoolId = "school-1"
    const location = { lat: 24.7136, lon: 46.6753 }
    const timestamp = new Date("2025-01-19T07:30:00Z")

    // Mock geofence check returns SCHOOL_GROUNDS
    vi.mocked(db.geoFence.findMany).mockResolvedValue([
      {
        id: "fence-1",
        name: "Main Campus",
        type: "SCHOOL_GROUNDS",
        centerLat: 24.7136,
        centerLon: 46.6753,
        radiusMeters: 500,
        isActive: true,
      },
    ])

    // Mock no recent events (first entry)
    vi.mocked(db.geoAttendanceEvent.findFirst).mockResolvedValue(null)

    // Mock student classes
    vi.mocked(db.studentClass.findMany).mockResolvedValue([
      { classId: "class-1" },
      { classId: "class-2" },
    ])

    await processGeofenceEvents(studentId, schoolId, location, timestamp)

    // Verify ENTER event created
    expect(db.geoAttendanceEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "ENTER",
        geofenceId: "fence-1",
      }),
    })

    // Verify attendance marked PRESENT
    expect(db.attendance.upsert).toHaveBeenCalledTimes(2) // For 2 classes
    expect(db.attendance.upsert).toHaveBeenCalledWith({
      where: expect.any(Object),
      create: expect.objectContaining({ status: "PRESENT" }),
      update: expect.objectContaining({ status: "PRESENT" }),
    })
  })

  it("should auto-mark LATE when entering school at 8:30 AM", async () => {
    const timestamp = new Date("2025-01-19T08:30:00Z")

    // ... similar setup ...

    await processGeofenceEvents(studentId, schoolId, location, timestamp)

    // Verify attendance marked LATE
    expect(db.attendance.upsert).toHaveBeenCalledWith({
      where: expect.any(Object),
      create: expect.objectContaining({ status: "LATE" }),
      update: expect.objectContaining({ status: "LATE" }),
    })
  })

  it("should NOT auto-mark attendance outside window (10:00 AM)", async () => {
    const timestamp = new Date("2025-01-19T10:00:00Z")

    await processGeofenceEvents(studentId, schoolId, location, timestamp)

    // Verify ENTER event created but NO attendance update
    expect(db.geoAttendanceEvent.create).toHaveBeenCalled()
    expect(db.attendance.upsert).not.toHaveBeenCalled()
  })
})
```

### File: `src/components/platform/attendance/geofence/validation.test.ts`

Test Zod validation schemas.

```typescript
import { describe, expect, it } from "vitest"

import { geofenceSchema, locationSchema } from "./validation"

describe("locationSchema", () => {
  it("should validate valid location", () => {
    const input = {
      studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
      lat: 24.7136,
      lon: 46.6753,
      accuracy: 10,
      battery: 85,
    }

    const result = locationSchema.parse(input)

    expect(result).toEqual(input)
  })

  it("should reject invalid latitude (> 90)", () => {
    const input = {
      studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
      lat: 91, // Invalid
      lon: 46.6753,
    }

    expect(() => locationSchema.parse(input)).toThrow()
  })

  it("should reject invalid longitude (< -180)", () => {
    const input = {
      studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
      lat: 24.7136,
      lon: -181, // Invalid
    }

    expect(() => locationSchema.parse(input)).toThrow()
  })

  it("should reject invalid battery (> 100)", () => {
    const input = {
      studentId: "student_cm5a1b2c3d4e5f6g7h8i9",
      lat: 24.7136,
      lon: 46.6753,
      battery: 101, // Invalid
    }

    expect(() => locationSchema.parse(input)).toThrow()
  })
})

describe("geofenceSchema", () => {
  it("should validate circular geofence", () => {
    const input = {
      name: "Main Campus",
      type: "SCHOOL_GROUNDS",
      centerLat: 24.7136,
      centerLon: 46.6753,
      radiusMeters: 500,
    }

    const result = geofenceSchema.parse(input)

    expect(result).toEqual(input)
  })

  it("should validate polygon geofence", () => {
    const input = {
      name: "Irregular Boundary",
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
    }

    const result = geofenceSchema.parse(input)

    expect(result).toEqual(input)
  })

  it("should reject invalid geofence type", () => {
    const input = {
      name: "Test",
      type: "INVALID_TYPE",
      centerLat: 24.7136,
      centerLon: 46.6753,
      radiusMeters: 500,
    }

    expect(() => geofenceSchema.parse(input)).toThrow()
  })
})
```

**Run Unit Tests**:

```bash
pnpm test src/lib/geo-service.test.ts
pnpm test src/components/school-dashboard/attendance/geofence/
```

---

## Integration Tests

### File: `src/components/platform/attendance/geofence/actions.test.ts`

Test server actions with database.

```typescript
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { db } from "@/lib/db"

import {
  createGeofence,
  getLiveStudentLocations,
  submitLocation,
} from "./actions"

describe("Server Actions Integration", () => {
  let testSchoolId: string
  let testStudentId: string

  beforeAll(async () => {
    // Setup test database
    const school = await db.school.create({
      data: {
        id: "test-school-123",
        name: "Test School",
      },
    })
    testSchoolId = school.id

    const student = await db.student.create({
      data: {
        id: "test-student-123",
        schoolId: testSchoolId,
        givenName: "Test",
        surname: "Student",
      },
    })
    testStudentId = student.id
  })

  afterAll(async () => {
    // Cleanup
    await db.student.deleteMany({ where: { schoolId: testSchoolId } })
    await db.school.delete({ where: { id: testSchoolId } })
  })

  describe("submitLocation", () => {
    it("should save location trace to database", async () => {
      const result = await submitLocation({
        studentId: testStudentId,
        lat: 24.7136,
        lon: 46.6753,
        accuracy: 10,
        battery: 85,
      })

      expect(result.success).toBe(true)
      expect(result.timestamp).toBeDefined()

      // Verify database insert
      const trace = await db.locationTrace.findFirst({
        where: { studentId: testStudentId },
      })

      expect(trace).toBeDefined()
      expect(Number(trace!.lat)).toBeCloseTo(24.7136)
      expect(Number(trace!.lon)).toBeCloseTo(46.6753)
      expect(trace!.battery).toBe(85)
    })

    it("should reject invalid coordinates", async () => {
      await expect(
        submitLocation({
          studentId: testStudentId,
          lat: 999, // Invalid
          lon: 46.6753,
        })
      ).rejects.toThrow()
    })

    it("should handle concurrent submissions (no race condition)", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        submitLocation({
          studentId: testStudentId,
          lat: 24.7136 + i * 0.0001,
          lon: 46.6753 + i * 0.0001,
        })
      )

      const results = await Promise.all(promises)

      expect(results.every((r) => r.success)).toBe(true)

      // Verify all 10 traces inserted
      const traces = await db.locationTrace.findMany({
        where: { studentId: testStudentId },
      })

      expect(traces.length).toBeGreaterThanOrEqual(10)
    })
  })

  describe("createGeofence", () => {
    it("should create circular geofence", async () => {
      const result = await createGeofence({
        name: "Test Campus",
        type: "SCHOOL_GROUNDS",
        centerLat: 24.7136,
        centerLon: 46.6753,
        radiusMeters: 500,
        color: "#3b82f6",
      })

      expect(result.success).toBe(true)
      expect(result.geofenceId).toBeDefined()

      // Verify database insert
      const fence = await db.geoFence.findUnique({
        where: { id: result.geofenceId },
      })

      expect(fence).toBeDefined()
      expect(fence!.name).toBe("Test Campus")
      expect(fence!.type).toBe("SCHOOL_GROUNDS")
      expect(Number(fence!.centerLat)).toBeCloseTo(24.7136)
    })

    it("should reject geofence without circular or polygon data", async () => {
      await expect(
        createGeofence({
          name: "Invalid Fence",
          type: "SCHOOL_GROUNDS",
          // Missing centerLat, centerLon, radiusMeters OR polygonGeoJSON
        })
      ).rejects.toThrow("Must provide either circular or polygon geofence data")
    })
  })

  describe("getLiveStudentLocations", () => {
    it("should return students with recent locations", async () => {
      // Insert fresh location
      await submitLocation({
        studentId: testStudentId,
        lat: 24.7136,
        lon: 46.6753,
      })

      const { students } = await getLiveStudentLocations()

      expect(students.length).toBeGreaterThan(0)
      const student = students.find((s) => s.studentId === testStudentId)

      expect(student).toBeDefined()
      expect(student!.name).toContain("Test Student")
      expect(student!.lat).toBeCloseTo(24.7136)
    })

    it("should NOT return students with old locations (> 5 min)", async () => {
      // Insert old location
      await db.locationTrace.create({
        data: {
          schoolId: testSchoolId,
          studentId: testStudentId,
          lat: 24.7136,
          lon: 46.6753,
          timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        },
      })

      const { students } = await getLiveStudentLocations()

      const student = students.find((s) => s.studentId === testStudentId)

      expect(student).toBeUndefined() // Should not appear (> 5 min old)
    })
  })
})
```

**Run Integration Tests**:

```bash
pnpm test src/components/school-dashboard/attendance/geofence/actions.test.ts
```

---

## E2E Tests (Playwright)

### File: `tests/geo-tracking.spec.ts`

Test end-to-end user flows.

```typescript
import { expect, test } from "@playwright/test"

test.describe("Student Location Tracking", () => {
  test("student can enable location tracking", async ({ page, context }) => {
    // Grant geolocation permission
    await context.grantPermissions(["geolocation"])
    await context.setGeolocation({ latitude: 24.7136, longitude: 46.6753 })

    // Login as student
    await page.goto("/auth/signin")
    await page.fill('input[name="email"]', "student@test.com")
    await page.fill('input[name="password"]', "password123")
    await page.click('button[type="submit"]')

    // Navigate to attendance page
    await page.goto("/student/attendance")

    // Enable tracking
    await page.click('button:has-text("Enable Location Tracking")')

    // Verify status indicator shows active
    await expect(page.locator(".status-indicator")).toHaveClass(/active/)

    // Wait for location submission (check network request)
    const response = await page.waitForResponse(
      (response) =>
        response.url().includes("/api/geo/location") &&
        response.status() === 200
    )

    expect(response.ok()).toBe(true)
  })

  test("student receives error on location permission denied", async ({
    page,
    context,
  }) => {
    // Deny geolocation permission
    await context.grantPermissions([])

    await page.goto("/student/attendance")
    await page.click('button:has-text("Enable Location Tracking")')

    // Verify error message
    await expect(page.locator(".error-message")).toContainText(
      "Geolocation not supported"
    )
  })

  test("student location queued offline and retried online", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["geolocation"])
    await context.setGeolocation({ latitude: 24.7136, longitude: 46.6753 })

    await page.goto("/student/attendance")
    await page.click('button:has-text("Enable Location Tracking")')

    // Simulate offline
    await page.context().setOffline(true)

    // Wait for failed submission (network error)
    await page.waitForTimeout(5000)

    // Verify offline indicator
    await expect(page.locator(".offline-indicator")).toBeVisible()

    // Go back online
    await page.context().setOffline(false)

    // Verify queued location submitted
    const response = await page.waitForResponse(
      (response) =>
        response.url().includes("/api/geo/location") &&
        response.status() === 200
    )

    expect(response.ok()).toBe(true)
  })
})

test.describe("Admin Live Map", () => {
  test("admin can view live student locations", async ({ page }) => {
    // Login as admin
    await page.goto("/auth/signin")
    await page.fill('input[name="email"]', "admin@test.com")
    await page.fill('input[name="password"]', "admin123")
    await page.click('button[type="submit"]')

    // Navigate to live map
    await page.goto("/admin/attendance/live-map")

    // Wait for Leaflet map to load
    await page.waitForSelector(".leaflet-container")

    // Verify student markers appear
    const markers = page.locator(".leaflet-marker-icon")
    await expect(markers).toHaveCount(5) // Assume 5 active students in seed data

    // Click marker to view student info
    await markers.first().click()

    // Verify popup shows student details
    await expect(page.locator(".leaflet-popup")).toContainText("Battery:")
    await expect(page.locator(".leaflet-popup")).toContainText("Accuracy:")
  })

  test("admin can create circular geofence", async ({ page }) => {
    await page.goto("/admin/attendance/geofences")

    // Click "Create Geofence"
    await page.click('button:has-text("Create Geofence")')

    // Fill form
    await page.fill('input[name="name"]', "E2E Test Campus")
    await page.selectOption('select[name="type"]', "SCHOOL_GROUNDS")
    await page.fill('input[name="centerLat"]', "24.7136")
    await page.fill('input[name="centerLon"]', "46.6753")
    await page.fill('input[name="radiusMeters"]', "500")

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success message
    await expect(page.locator(".success-toast")).toContainText(
      "Geofence created"
    )

    // Verify geofence appears in list
    await expect(page.locator("table")).toContainText("E2E Test Campus")
  })
})

test.describe("Geofence Auto-Attendance", () => {
  test("student entering school grounds triggers attendance marking", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["geolocation"])

    // Set location OUTSIDE school grounds
    await context.setGeolocation({ latitude: 25.0, longitude: 47.0 })

    await page.goto("/student/attendance")
    await page.click('button:has-text("Enable Location Tracking")')

    // Wait for initial location submission
    await page.waitForResponse((r) => r.url().includes("/api/geo/location"))

    // Move student INSIDE school grounds (simulating arrival at 7:30 AM)
    await context.setGeolocation({ latitude: 24.7136, longitude: 46.6753 })

    // Wait for geofence event
    await page.waitForResponse(
      (r) => r.url().includes("/api/geo/location") && r.status() === 200
    )

    // Navigate to attendance page
    await page.goto("/student/attendance")

    // Verify attendance marked PRESENT
    await expect(page.locator(".attendance-status")).toHaveText("PRESENT")
    await expect(page.locator(".attendance-note")).toContainText(
      "Auto-marked via geofence"
    )
  })
})
```

**Run E2E Tests**:

```bash
pnpm test:e2e tests/geo-tracking.spec.ts
pnpm test:e2e:ui # Run with UI
pnpm test:e2e:debug # Debug mode
```

---

## Load Tests

### File: `tests/load/location-submission.js` (k6)

Test performance under load.

```javascript
import { check, sleep } from "k6"
import http from "k6/http"
import { Rate } from "k6/metrics"

const errorRate = new Rate("errors")

export const options = {
  stages: [
    { duration: "1m", target: 50 }, // Ramp up to 50 concurrent students
    { duration: "5m", target: 50 }, // Stay at 50 for 5 minutes
    { duration: "1m", target: 200 }, // Spike to 200 (burst load)
    { duration: "2m", target: 200 }, // Stay at 200 for 2 minutes
    { duration: "1m", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<200"], // 95% of requests < 200ms
    errors: ["rate<0.01"], // Error rate < 1%
  },
}

export default function () {
  // Generate random location near Riyadh
  const lat = 24.7136 + (Math.random() - 0.5) * 0.01
  const lon = 46.6753 + (Math.random() - 0.5) * 0.01

  const payload = JSON.stringify({
    studentId: `student_${__VU}`, // Virtual user ID as student ID
    lat,
    lon,
    accuracy: Math.random() * 50,
    battery: Math.floor(Math.random() * 100),
  })

  const params = {
    headers: {
      "Content-Type": "application/json",
      Cookie: `session-token=${__ENV.SESSION_TOKEN}`,
    },
  }

  const res = http.post(
    "https://ed.databayt.org/api/geo/location",
    payload,
    params
  )

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 200ms": (r) => r.timings.duration < 200,
  })

  errorRate.add(!success)

  sleep(30) // Simulate 30-second update interval
}
```

**Run Load Tests**:

```bash
# Install k6
brew install k6  # macOS
# OR
choco install k6  # Windows

# Run load test
k6 run tests/load/location-submission.js
```

**Expected Results**:

- **p95 latency**: < 200ms
- **Error rate**: < 1%
- **Throughput**: 300 req/s (10,000 students / 30s)

---

## Manual Testing

### Checklist

#### Phase 1: Database Setup

- [ ] PostGIS extension enabled (`SELECT PostGIS_version()` returns version)
- [ ] Prisma migrations applied (`pnpm prisma migrate deploy`)
- [ ] Spatial indexes created (`EXPLAIN ANALYZE` shows index usage)
- [ ] Database triggers installed (`SELECT * FROM pg_trigger` shows `geofence_event_trigger`)

#### Phase 2: Location Submission

- [ ] Student can submit location via PWA
- [ ] Location trace appears in `location_traces` table
- [ ] Geofence check runs (< 50ms)
- [ ] Battery level captured (if supported)
- [ ] Device fingerprint stored

#### Phase 3: Geofence Management

- [ ] Admin can create circular geofence
- [ ] Admin can create polygon geofence
- [ ] Geofence appears on live map
- [ ] Geofence color applied correctly
- [ ] Geofence can be updated/deleted

#### Phase 4: Auto-Attendance

- [ ] Student entering SCHOOL_GROUNDS at 7:30 AM → PRESENT
- [ ] Student entering SCHOOL_GROUNDS at 8:30 AM → LATE
- [ ] Student entering SCHOOL_GROUNDS at 10:00 AM → No auto-mark
- [ ] Student entering CLASSROOM → No auto-mark (only SCHOOL_GROUNDS)
- [ ] Multiple ENTER events don't create duplicate attendance (UPSERT)

#### Phase 5: Real-time Events

- [ ] WebSocket connection established
- [ ] ENTER event triggers WebSocket notification
- [ ] Admin live map updates automatically
- [ ] Polling fallback works when WebSocket fails
- [ ] 10-second polling interval maintained

#### Phase 6: Offline Support

- [ ] Location queued in IndexedDB when offline
- [ ] Queued locations submitted when online
- [ ] Offline indicator shown to user
- [ ] No duplicate submissions (deduplication)

#### Phase 7: Performance

- [ ] Location submission < 100ms (p95)
- [ ] Geofence check < 50ms
- [ ] Live map loads < 2s (500 students)
- [ ] WebSocket latency < 100ms
- [ ] Database queries use indexes (check `EXPLAIN ANALYZE`)

#### Phase 8: Security

- [ ] Unauthorized requests return 401
- [ ] Rate limiting blocks 21st request
- [ ] Student cannot view other students' locations
- [ ] Admin can view all students' locations
- [ ] schoolId scoping prevents cross-tenant access

#### Phase 9: Privacy

- [ ] Consent prompt shown before tracking
- [ ] Location data deleted after 30 days (cron job)
- [ ] Export data returns CSV with student locations
- [ ] Audit log tracks location data access

---

## Test Data Setup

### Seed Script: `prisma/seeds/geo-test-data.ts`

```typescript
import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function seedGeoTestData() {
  const school = await db.school.create({
    data: {
      id: "test-school-geo",
      name: "Test School (Geo)",
      slug: "test-school-geo",
    },
  })

  // Create test students
  const students = await Promise.all([
    db.student.create({
      data: {
        schoolId: school.id,
        givenName: "Ahmad",
        surname: "Al-Rashid",
        email: "ahmad@test.com",
      },
    }),
    db.student.create({
      data: {
        schoolId: school.id,
        givenName: "Fatima",
        surname: "Al-Zahrani",
        email: "fatima@test.com",
      },
    }),
  ])

  // Create test geofence (circular)
  const mainCampus = await db.geoFence.create({
    data: {
      schoolId: school.id,
      name: "Main Campus",
      type: "SCHOOL_GROUNDS",
      centerLat: 24.7136,
      centerLon: 46.6753,
      radiusMeters: 500,
      color: "#3b82f6",
    },
  })

  // Create test geofence (polygon)
  const classroom = await db.geoFence.create({
    data: {
      schoolId: school.id,
      name: "Classroom 101",
      type: "CLASSROOM",
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
    },
  })

  // Create test location traces
  for (const student of students) {
    await db.locationTrace.create({
      data: {
        schoolId: school.id,
        studentId: student.id,
        lat: 24.7136 + Math.random() * 0.001,
        lon: 46.6753 + Math.random() * 0.001,
        accuracy: 10,
        battery: Math.floor(Math.random() * 100),
        timestamp: new Date(),
      },
    })
  }

  console.log("✅ Geo test data seeded")
}

seedGeoTestData()
  .catch(console.error)
  .finally(() => db.$disconnect())
```

**Run Seed**:

```bash
pnpm tsx prisma/seeds/geo-test-data.ts
```

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Maintained By**: QA Team
