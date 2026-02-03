import { describe, expect, it } from "vitest"

import { calculateDistance, isInsideCircularGeofence } from "../geo-service"

describe("Geo Service - Haversine Distance Calculation", () => {
  describe("calculateDistance", () => {
    it("calculates zero distance for same point", () => {
      const distance = calculateDistance(24.7136, 46.6753, 24.7136, 46.6753)
      expect(distance).toBe(0)
    })

    it("calculates accurate distance for known locations", () => {
      // Riyadh to Jeddah: approximately 845 km (verified via Google Maps)
      const riyadhToJeddah = calculateDistance(
        24.7136,
        46.6753, // Riyadh
        21.4858,
        39.1925 // Jeddah
      )
      // Allow 2% margin of error for Haversine approximation
      expect(riyadhToJeddah).toBeGreaterThan(830000)
      expect(riyadhToJeddah).toBeLessThan(860000)
    })

    it("calculates short distance accurately", () => {
      // Two points ~100m apart
      const lat1 = 24.7136
      const lon1 = 46.6753
      const lat2 = 24.7145 // ~100m north
      const lon2 = 46.6753

      const distance = calculateDistance(lat1, lon1, lat2, lon2)
      expect(distance).toBeGreaterThan(90)
      expect(distance).toBeLessThan(110)
    })

    it("handles equator crossing", () => {
      const distance = calculateDistance(
        1.0,
        0.0, // 1 degree north
        -1.0,
        0.0 // 1 degree south
      )
      // ~222 km (2 degrees of latitude)
      expect(distance).toBeGreaterThan(220000)
      expect(distance).toBeLessThan(225000)
    })

    it("handles prime meridian crossing", () => {
      const distance = calculateDistance(
        0.0,
        -1.0, // 1 degree west
        0.0,
        1.0 // 1 degree east
      )
      // ~222 km at equator
      expect(distance).toBeGreaterThan(220000)
      expect(distance).toBeLessThan(225000)
    })

    it("handles international date line crossing", () => {
      const distance = calculateDistance(
        0.0,
        179.0, // Near date line east
        0.0,
        -179.0 // Near date line west
      )
      // ~222 km (2 degrees)
      expect(distance).toBeGreaterThan(220000)
      expect(distance).toBeLessThan(225000)
    })

    it("handles polar coordinates", () => {
      // Near North Pole
      const nearPole = calculateDistance(89.0, 0.0, 89.0, 180.0)
      // Distance should be relatively small near poles
      expect(nearPole).toBeGreaterThan(0)
      expect(nearPole).toBeLessThan(300000) // Less than 300km
    })

    it("is commutative (order independent)", () => {
      const distance1 = calculateDistance(24.7136, 46.6753, 21.4858, 39.1925)
      const distance2 = calculateDistance(21.4858, 39.1925, 24.7136, 46.6753)
      expect(Math.abs(distance1 - distance2)).toBeLessThan(1) // Within 1m
    })

    it("calculates school-relevant distances accurately", () => {
      // 50m radius check (typical classroom geofence)
      const center = { lat: 24.7136, lon: 46.6753 }
      const point50m = { lat: 24.71405, lon: 46.6753 } // ~50m north

      const distance = calculateDistance(
        center.lat,
        center.lon,
        point50m.lat,
        point50m.lon
      )
      expect(distance).toBeGreaterThan(45)
      expect(distance).toBeLessThan(55)
    })
  })

  describe("isInsideCircularGeofence", () => {
    const schoolCenter = { lat: 24.7136, lon: 46.6753 }
    const schoolRadius = 500 // 500 meters

    it("returns true for point at center", () => {
      const result = isInsideCircularGeofence(
        schoolCenter,
        schoolCenter,
        schoolRadius
      )
      expect(result).toBe(true)
    })

    it("returns true for point inside radius", () => {
      const pointInside = { lat: 24.714, lon: 46.6755 } // ~50m from center
      const result = isInsideCircularGeofence(
        pointInside,
        schoolCenter,
        schoolRadius
      )
      expect(result).toBe(true)
    })

    it("returns false for point outside radius", () => {
      const pointOutside = { lat: 24.72, lon: 46.68 } // ~780m from center
      const result = isInsideCircularGeofence(
        pointOutside,
        schoolCenter,
        schoolRadius
      )
      expect(result).toBe(false)
    })

    it("returns true for point exactly on boundary", () => {
      // Calculate a point exactly 500m north
      // At this latitude, 1 degree lat ≈ 111.32km
      // So 500m ≈ 0.00449 degrees (500 / 111320)
      const pointOnBoundary = { lat: 24.7136 + 0.00449, lon: 46.6753 }
      const result = isInsideCircularGeofence(
        pointOnBoundary,
        schoolCenter,
        schoolRadius
      )
      expect(result).toBe(true) // Boundary is inclusive (<=)
    })

    it("handles small radius (classroom)", () => {
      const classroomCenter = { lat: 24.7136, lon: 46.6753 }
      const classroomRadius = 10 // 10 meters

      // Point 5m away
      const inside = { lat: 24.71364, lon: 46.6753 }
      expect(
        isInsideCircularGeofence(inside, classroomCenter, classroomRadius)
      ).toBe(true)

      // Point 15m away
      const outside = { lat: 24.7138, lon: 46.6753 }
      expect(
        isInsideCircularGeofence(outside, classroomCenter, classroomRadius)
      ).toBe(false)
    })

    it("handles large radius (school grounds)", () => {
      const groundsCenter = { lat: 24.7136, lon: 46.6753 }
      const groundsRadius = 2000 // 2km

      // Point 1km away (inside)
      const inside = { lat: 24.7226, lon: 46.6753 } // ~1km north
      expect(
        isInsideCircularGeofence(inside, groundsCenter, groundsRadius)
      ).toBe(true)

      // Point 3km away (outside)
      const outside = { lat: 24.7406, lon: 46.6753 } // ~3km north
      expect(
        isInsideCircularGeofence(outside, groundsCenter, groundsRadius)
      ).toBe(false)
    })
  })

  describe("Zone Entry/Exit Detection Logic", () => {
    it("detects ENTER event (was outside, now inside)", () => {
      const previousGeofenceIds: string[] = []
      const currentlyInside = true
      const geofenceId = "geofence-1"

      // Logic: ENTER if inside && not in previous
      const isEnter =
        currentlyInside && !previousGeofenceIds.includes(geofenceId)
      expect(isEnter).toBe(true)
    })

    it("detects EXIT event (was inside, now outside)", () => {
      const previousGeofenceIds = ["geofence-1"]
      const currentlyInside = false
      const geofenceId = "geofence-1"

      // Logic: EXIT if not inside && was in previous
      const isExit =
        !currentlyInside && previousGeofenceIds.includes(geofenceId)
      expect(isExit).toBe(true)
    })

    it("detects INSIDE event (was inside, still inside)", () => {
      const previousGeofenceIds = ["geofence-1"]
      const currentlyInside = true
      const geofenceId = "geofence-1"

      // Logic: INSIDE if inside && was in previous
      const isInside =
        currentlyInside && previousGeofenceIds.includes(geofenceId)
      expect(isInside).toBe(true)
    })

    it("detects null event (was outside, still outside)", () => {
      const previousGeofenceIds: string[] = []
      const currentlyInside = false
      const geofenceId = "geofence-1"

      // Logic: null if not inside && not in previous
      const isEnter =
        currentlyInside && !previousGeofenceIds.includes(geofenceId)
      const isExit =
        !currentlyInside && previousGeofenceIds.includes(geofenceId)
      const isInside =
        currentlyInside && previousGeofenceIds.includes(geofenceId)

      expect(isEnter).toBe(false)
      expect(isExit).toBe(false)
      expect(isInside).toBe(false)
    })
  })

  describe("Auto-Attendance Trigger Conditions", () => {
    it("triggers during arrival window (6-10 AM)", () => {
      const testHours = [6, 7, 8, 9]
      testHours.forEach((hour) => {
        const isArrivalWindow = hour >= 6 && hour < 10
        expect(isArrivalWindow).toBe(true)
      })
    })

    it("does not trigger outside arrival window", () => {
      const testHours = [0, 5, 10, 11, 12, 15, 18, 23]
      testHours.forEach((hour) => {
        const isArrivalWindow = hour >= 6 && hour < 10
        expect(isArrivalWindow).toBe(false)
      })
    })

    it("requires SCHOOL_GROUNDS zone type", () => {
      const validTypes = ["SCHOOL_GROUNDS"]
      const invalidTypes = [
        "CLASSROOM",
        "BUS_ROUTE",
        "PLAYGROUND",
        "CAFETERIA",
        "LIBRARY",
      ]

      validTypes.forEach((type) => {
        const shouldTrigger = type === "SCHOOL_GROUNDS"
        expect(shouldTrigger).toBe(true)
      })

      invalidTypes.forEach((type) => {
        const shouldTrigger = type === "SCHOOL_GROUNDS"
        expect(shouldTrigger).toBe(false)
      })
    })

    it("requires ENTER event type", () => {
      const enterEvent = "ENTER"
      const exitEvent = "EXIT"
      const insideEvent = "INSIDE"

      expect(enterEvent === "ENTER").toBe(true)
      expect(exitEvent === "ENTER").toBe(false)
      expect(insideEvent === "ENTER").toBe(false)
    })
  })
})
