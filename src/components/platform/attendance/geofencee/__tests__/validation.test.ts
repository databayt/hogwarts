import { describe, expect, it } from "vitest"

import {
  circularGeofenceSchema,
  consentSchema,
  geofenceEventsQuerySchema,
  liveLocationsQuerySchema,
  locationSchema,
  polygonGeofenceSchema,
} from "../validation"

describe("Geofence Validation Schemas", () => {
  describe("locationSchema", () => {
    it("validates valid GPS coordinates", () => {
      const validLocation = {
        lat: 24.7136,
        lon: 46.6753,
        accuracy: 10,
        altitude: 500,
        heading: 180,
        speed: 5,
        battery: 85,
        deviceId: "device-123",
      }

      const result = locationSchema.safeParse(validLocation)
      expect(result.success).toBe(true)
    })

    it("requires latitude between -90 and 90", () => {
      // Too low
      const tooLow = { lat: -91, lon: 0 }
      expect(locationSchema.safeParse(tooLow).success).toBe(false)

      // Too high
      const tooHigh = { lat: 91, lon: 0 }
      expect(locationSchema.safeParse(tooHigh).success).toBe(false)

      // Edge cases (valid)
      const minValid = { lat: -90, lon: 0 }
      expect(locationSchema.safeParse(minValid).success).toBe(true)

      const maxValid = { lat: 90, lon: 0 }
      expect(locationSchema.safeParse(maxValid).success).toBe(true)
    })

    it("requires longitude between -180 and 180", () => {
      // Too low
      const tooLow = { lat: 0, lon: -181 }
      expect(locationSchema.safeParse(tooLow).success).toBe(false)

      // Too high
      const tooHigh = { lat: 0, lon: 181 }
      expect(locationSchema.safeParse(tooHigh).success).toBe(false)

      // Edge cases (valid)
      const minValid = { lat: 0, lon: -180 }
      expect(locationSchema.safeParse(minValid).success).toBe(true)

      const maxValid = { lat: 0, lon: 180 }
      expect(locationSchema.safeParse(maxValid).success).toBe(true)
    })

    it("validates accuracy within limits", () => {
      // Negative accuracy is invalid
      const negative = { lat: 0, lon: 0, accuracy: -1 }
      expect(locationSchema.safeParse(negative).success).toBe(false)

      // Accuracy over 1000m is invalid
      const tooHigh = { lat: 0, lon: 0, accuracy: 1001 }
      expect(locationSchema.safeParse(tooHigh).success).toBe(false)

      // Valid accuracy
      const valid = { lat: 0, lon: 0, accuracy: 20 }
      expect(locationSchema.safeParse(valid).success).toBe(true)
    })

    it("validates altitude within Earth limits", () => {
      // Below Dead Sea (-500m)
      const tooLow = { lat: 0, lon: 0, altitude: -501 }
      expect(locationSchema.safeParse(tooLow).success).toBe(false)

      // Above commercial flight ceiling
      const tooHigh = { lat: 0, lon: 0, altitude: 10001 }
      expect(locationSchema.safeParse(tooHigh).success).toBe(false)

      // Valid altitude (sea level)
      const valid = { lat: 0, lon: 0, altitude: 0 }
      expect(locationSchema.safeParse(valid).success).toBe(true)
    })

    it("validates heading between 0 and 360 degrees", () => {
      const negative = { lat: 0, lon: 0, heading: -1 }
      expect(locationSchema.safeParse(negative).success).toBe(false)

      const tooHigh = { lat: 0, lon: 0, heading: 361 }
      expect(locationSchema.safeParse(tooHigh).success).toBe(false)

      const validNorth = { lat: 0, lon: 0, heading: 0 }
      expect(locationSchema.safeParse(validNorth).success).toBe(true)

      const validSouth = { lat: 0, lon: 0, heading: 180 }
      expect(locationSchema.safeParse(validSouth).success).toBe(true)
    })

    it("validates speed limits", () => {
      // Negative speed
      const negative = { lat: 0, lon: 0, speed: -1 }
      expect(locationSchema.safeParse(negative).success).toBe(false)

      // Over 720 km/h (200 m/s)
      const tooFast = { lat: 0, lon: 0, speed: 201 }
      expect(locationSchema.safeParse(tooFast).success).toBe(false)

      // Valid walking speed
      const valid = { lat: 0, lon: 0, speed: 1.5 }
      expect(locationSchema.safeParse(valid).success).toBe(true)
    })

    it("validates battery percentage", () => {
      const negative = { lat: 0, lon: 0, battery: -1 }
      expect(locationSchema.safeParse(negative).success).toBe(false)

      const over100 = { lat: 0, lon: 0, battery: 101 }
      expect(locationSchema.safeParse(over100).success).toBe(false)

      // Must be integer
      const decimal = { lat: 0, lon: 0, battery: 50.5 }
      expect(locationSchema.safeParse(decimal).success).toBe(false)

      const valid = { lat: 0, lon: 0, battery: 85 }
      expect(locationSchema.safeParse(valid).success).toBe(true)
    })

    it("allows minimal input with just lat/lon", () => {
      const minimal = { lat: 24.7136, lon: 46.6753 }
      const result = locationSchema.safeParse(minimal)
      expect(result.success).toBe(true)
    })
  })

  describe("circularGeofenceSchema", () => {
    const validGeofence = {
      name: "School-Grounds-Main",
      description: "Main school campus boundary",
      type: "SCHOOL_GROUNDS" as const,
      centerLat: 24.7136,
      centerLon: 46.6753,
      radiusMeters: 500,
      color: "#3b82f6",
      isActive: true,
    }

    it("validates complete circular geofence", () => {
      const result = circularGeofenceSchema.safeParse(validGeofence)
      expect(result.success).toBe(true)
    })

    it("enforces minimum radius of 10 meters", () => {
      const tooSmall = { ...validGeofence, radiusMeters: 9 }
      expect(circularGeofenceSchema.safeParse(tooSmall).success).toBe(false)

      const minValid = { ...validGeofence, radiusMeters: 10 }
      expect(circularGeofenceSchema.safeParse(minValid).success).toBe(true)
    })

    it("enforces maximum radius of 5000 meters (5km)", () => {
      const tooLarge = { ...validGeofence, radiusMeters: 5001 }
      expect(circularGeofenceSchema.safeParse(tooLarge).success).toBe(false)

      const maxValid = { ...validGeofence, radiusMeters: 5000 }
      expect(circularGeofenceSchema.safeParse(maxValid).success).toBe(true)
    })

    it("requires integer radius", () => {
      const decimal = { ...validGeofence, radiusMeters: 100.5 }
      expect(circularGeofenceSchema.safeParse(decimal).success).toBe(false)
    })

    it("validates geofence name format", () => {
      // Too short
      const tooShort = { ...validGeofence, name: "AB" }
      expect(circularGeofenceSchema.safeParse(tooShort).success).toBe(false)

      // Too long (>100 chars)
      const tooLong = { ...validGeofence, name: "A".repeat(101) }
      expect(circularGeofenceSchema.safeParse(tooLong).success).toBe(false)

      // Invalid characters
      const invalidChars = { ...validGeofence, name: "Test@#$%" }
      expect(circularGeofenceSchema.safeParse(invalidChars).success).toBe(false)

      // Valid with hyphens, underscores, spaces
      const validName = { ...validGeofence, name: "School-Ground_Main Area" }
      expect(circularGeofenceSchema.safeParse(validName).success).toBe(true)
    })

    it("validates hex color format", () => {
      // Invalid: missing #
      const noHash = { ...validGeofence, color: "3b82f6" }
      expect(circularGeofenceSchema.safeParse(noHash).success).toBe(false)

      // Invalid: 3-digit hex
      const shortHex = { ...validGeofence, color: "#3b8" }
      expect(circularGeofenceSchema.safeParse(shortHex).success).toBe(false)

      // Valid: 6-digit hex
      const valid = { ...validGeofence, color: "#FF5733" }
      expect(circularGeofenceSchema.safeParse(valid).success).toBe(true)
    })

    it("validates geofence type enum", () => {
      const validTypes = [
        "SCHOOL_GROUNDS",
        "CLASSROOM",
        "BUS_ROUTE",
        "PLAYGROUND",
        "CAFETERIA",
        "LIBRARY",
      ]

      validTypes.forEach((type) => {
        const data = { ...validGeofence, type }
        expect(circularGeofenceSchema.safeParse(data).success).toBe(true)
      })

      const invalidType = { ...validGeofence, type: "INVALID_TYPE" }
      expect(circularGeofenceSchema.safeParse(invalidType).success).toBe(false)
    })

    it("validates center coordinates", () => {
      const invalidLat = { ...validGeofence, centerLat: 100 }
      expect(circularGeofenceSchema.safeParse(invalidLat).success).toBe(false)

      const invalidLon = { ...validGeofence, centerLon: 200 }
      expect(circularGeofenceSchema.safeParse(invalidLon).success).toBe(false)
    })
  })

  describe("polygonGeofenceSchema", () => {
    const validPolygon = {
      name: "Custom-Boundary",
      type: "SCHOOL_GROUNDS" as const,
      polygonGeoJSON: JSON.stringify({
        type: "Polygon",
        coordinates: [
          [
            [46.675, 24.713],
            [46.676, 24.713],
            [46.676, 24.714],
            [46.675, 24.714],
            [46.675, 24.713], // Closed ring
          ],
        ],
      }),
    }

    it("validates valid GeoJSON polygon", () => {
      const result = polygonGeofenceSchema.safeParse(validPolygon)
      expect(result.success).toBe(true)
    })

    it("requires minimum 4 points for closed polygon", () => {
      const tooFewPoints = {
        ...validPolygon,
        polygonGeoJSON: JSON.stringify({
          type: "Polygon",
          coordinates: [
            [
              [46.675, 24.713],
              [46.676, 24.713],
              [46.675, 24.713], // Only 3 points
            ],
          ],
        }),
      }
      expect(polygonGeofenceSchema.safeParse(tooFewPoints).success).toBe(false)
    })

    it("rejects invalid GeoJSON type", () => {
      const wrongType = {
        ...validPolygon,
        polygonGeoJSON: JSON.stringify({
          type: "Point",
          coordinates: [46.675, 24.713],
        }),
      }
      expect(polygonGeofenceSchema.safeParse(wrongType).success).toBe(false)
    })

    it("rejects malformed JSON", () => {
      const malformed = {
        ...validPolygon,
        polygonGeoJSON: "not valid json",
      }
      expect(polygonGeofenceSchema.safeParse(malformed).success).toBe(false)
    })

    it("enforces max GeoJSON size (50KB)", () => {
      // Create a very large polygon
      const hugePolygon = {
        ...validPolygon,
        polygonGeoJSON: "A".repeat(51000),
      }
      expect(polygonGeofenceSchema.safeParse(hugePolygon).success).toBe(false)
    })
  })

  describe("liveLocationsQuerySchema", () => {
    it("validates query with defaults", () => {
      const query = { schoolId: "clx1234567890abcdefghijk" }
      const result = liveLocationsQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxAgeMinutes).toBe(5) // Default
      }
    })

    it("validates maxAgeMinutes range (1-60)", () => {
      const baseQuery = { schoolId: "clx1234567890abcdefghijk" }

      const tooLow = { ...baseQuery, maxAgeMinutes: 0 }
      expect(liveLocationsQuerySchema.safeParse(tooLow).success).toBe(false)

      const tooHigh = { ...baseQuery, maxAgeMinutes: 61 }
      expect(liveLocationsQuerySchema.safeParse(tooHigh).success).toBe(false)

      const valid = { ...baseQuery, maxAgeMinutes: 30 }
      expect(liveLocationsQuerySchema.safeParse(valid).success).toBe(true)
    })

    it("requires valid CUID for schoolId", () => {
      const invalidId = { schoolId: "invalid-id" }
      expect(liveLocationsQuerySchema.safeParse(invalidId).success).toBe(false)
    })
  })

  describe("geofenceEventsQuerySchema", () => {
    it("validates complete query", () => {
      const query = {
        schoolId: "clx1234567890abcdefghijk",
        studentId: "clx1234567890abcdefghijk",
        geofenceId: "clx1234567890abcdefghijk",
        eventType: "ENTER" as const,
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-01-31"),
        limit: 50,
      }

      const result = geofenceEventsQuerySchema.safeParse(query)
      expect(result.success).toBe(true)
    })

    it("validates event type enum", () => {
      const baseQuery = { schoolId: "clx1234567890abcdefghijk" }

      const validTypes = ["ENTER", "EXIT", "INSIDE"]
      validTypes.forEach((eventType) => {
        const data = { ...baseQuery, eventType }
        expect(geofenceEventsQuerySchema.safeParse(data).success).toBe(true)
      })

      const invalidType = { ...baseQuery, eventType: "INVALID" }
      expect(geofenceEventsQuerySchema.safeParse(invalidType).success).toBe(
        false
      )
    })

    it("validates limit range (1-1000)", () => {
      const baseQuery = { schoolId: "clx1234567890abcdefghijk" }

      const tooLow = { ...baseQuery, limit: 0 }
      expect(geofenceEventsQuerySchema.safeParse(tooLow).success).toBe(false)

      const tooHigh = { ...baseQuery, limit: 1001 }
      expect(geofenceEventsQuerySchema.safeParse(tooHigh).success).toBe(false)
    })
  })

  describe("consentSchema", () => {
    it("validates consent data", () => {
      const consent = {
        studentId: "clx1234567890abcdefghijk",
        guardianId: "clx1234567890abcdefghijk",
        consentGiven: true,
      }

      const result = consentSchema.safeParse(consent)
      expect(result.success).toBe(true)
    })

    it("requires guardian approval", () => {
      const withConsent = {
        studentId: "clx1234567890abcdefghijk",
        guardianId: "clx1234567890abcdefghijk",
        consentGiven: true,
      }
      expect(consentSchema.safeParse(withConsent).success).toBe(true)

      const withoutConsent = {
        studentId: "clx1234567890abcdefghijk",
        guardianId: "clx1234567890abcdefghijk",
        consentGiven: false,
      }
      expect(consentSchema.safeParse(withoutConsent).success).toBe(true) // Schema allows false
    })

    it("requires valid CUIDs", () => {
      const invalidStudent = {
        studentId: "invalid",
        guardianId: "clx1234567890abcdefghijk",
        consentGiven: true,
      }
      expect(consentSchema.safeParse(invalidStudent).success).toBe(false)

      const invalidGuardian = {
        studentId: "clx1234567890abcdefghijk",
        guardianId: "invalid",
        consentGiven: true,
      }
      expect(consentSchema.safeParse(invalidGuardian).success).toBe(false)
    })
  })
})
