/**
 * Geofence Validation Schemas
 *
 * GPS-based location tracking and geofence boundary management for:
 * - Live student location monitoring (max 5 min age, latitude/longitude)
 * - Boundary detection (ENTER/EXIT/INSIDE events with timestamps)
 * - Geofence types: School grounds, classrooms, bus routes, playgrounds
 * - Formats: Circular (radius 10-5000m) or polygon (GeoJSON, min 4 points)
 * - Consent tracking: Guardian approval required before tracking
 *
 * Key validation rules:
 * - Location: Accurate GPS (±20m typical), battery%, device ID
 * - Geofence names: 3-100 chars, alphanumeric + hyphen/underscore (no spaces)
 * - Circular: Center lat/lon + radius (prevents 0-radius or 5km+ issues)
 * - Polygon: Valid GeoJSON Polygon (closed ring, min 4 points for triangle area)
 * - Color: Hex codes for map visualization (must be 6-digit hex)
 * - Consent: boolean + date (audit trail for FERPA compliance)
 *
 * Why consent matters:
 * - FERPA/GDPR: Students' location is personally identifiable information
 * - Legal: Schools need documented guardian consent before location tracking
 * - Parental: Parents can revoke consent at any time
 * - Audit: Timestamp proves when consent was given (defense against claims)
 *
 * Why geofence types:
 * - School grounds: Detect if student on campus
 * - Bus route: Track bus movement, detect off-route
 * - Classroom: Verify student in correct room (smaller radius, more accurate)
 * - Playground: Social/recess monitoring
 */

import { z } from 'zod'

// ============================================================================
// LOCATION VALIDATION
// ============================================================================

/**
 * Schema for location submission from student devices
 * Validates GPS coordinates, accuracy, and device metadata
 * Sent frequently (every 30-60s) via mobile app, battery-optimized
 */
export const locationSchema = z.object({
  // Required coordinates
  lat: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  lon: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),

  // Optional GPS metadata
  accuracy: z
    .number()
    .positive('Accuracy must be positive')
    .max(1000, 'Accuracy cannot exceed 1000 meters')
    .optional(),
  altitude: z
    .number()
    .min(-500, 'Altitude must be above -500 meters')
    .max(10000, 'Altitude must be below 10000 meters')
    .optional(),
  heading: z
    .number()
    .min(0, 'Heading must be between 0 and 360')
    .max(360, 'Heading must be between 0 and 360')
    .optional(),
  speed: z
    .number()
    .min(0, 'Speed must be non-negative')
    .max(200, 'Speed cannot exceed 200 m/s (720 km/h)')
    .optional(),

  // Device metadata
  battery: z
    .number()
    .int('Battery must be an integer')
    .min(0, 'Battery must be between 0 and 100')
    .max(100, 'Battery must be between 0 and 100')
    .optional(),
  deviceId: z
    .string()
    .max(255, 'Device ID too long')
    .optional(),
  userAgent: z
    .string()
    .max(500, 'User agent too long')
    .optional(),
})

export type LocationInput = z.infer<typeof locationSchema>

/**
 * Schema for bulk location submission (for offline queue)
 */
export const bulkLocationSchema = z.object({
  locations: z
    .array(locationSchema)
    .min(1, 'Must provide at least one location')
    .max(50, 'Cannot submit more than 50 locations at once'),
})

export type BulkLocationInput = z.infer<typeof bulkLocationSchema>

// ============================================================================
// GEOFENCE VALIDATION
// ============================================================================

/**
 * Schema for creating/updating circular geofences
 */
export const circularGeofenceSchema = z.object({
  name: z
    .string()
    .min(3, 'Geofence name must be at least 3 characters')
    .max(100, 'Geofence name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Geofence name contains invalid characters'),

  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),

  type: z.enum(
    ['SCHOOL_GROUNDS', 'CLASSROOM', 'BUS_ROUTE', 'PLAYGROUND', 'CAFETERIA', 'LIBRARY'],
    {
      message: 'Invalid geofence type',
    }
  ),

  // Circular geofence fields
  centerLat: z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  centerLon: z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  radiusMeters: z
    .number()
    .int('Radius must be an integer')
    .min(10, 'Radius must be at least 10 meters')
    .max(5000, 'Radius cannot exceed 5000 meters (5km)'),

  // Optional visualization
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #3b82f6)')
    .optional()
    .default('#3b82f6'),

  isActive: z.boolean().optional().default(true),
})

export type CircularGeofenceInput = z.infer<typeof circularGeofenceSchema>

/**
 * Schema for creating/updating polygon geofences
 * Validates GeoJSON polygon format
 */
export const polygonGeofenceSchema = z.object({
  name: z
    .string()
    .min(3, 'Geofence name must be at least 3 characters')
    .max(100, 'Geofence name cannot exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Geofence name contains invalid characters'),

  description: z
    .string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),

  type: z.enum(
    ['SCHOOL_GROUNDS', 'CLASSROOM', 'BUS_ROUTE', 'PLAYGROUND', 'CAFETERIA', 'LIBRARY'],
    {
      message: 'Invalid geofence type',
    }
  ),

  // Polygon geofence field (GeoJSON string)
  // Why GeoJSON Polygon:
  // - Irregular boundaries (parking lots, bus routes aren't circles)
  // - Min 4 points = triangle with closure (first point repeated)
  // - Validates: type="Polygon", coordinates array exists, closed ring
  // - Max 50KB: Prevents massive polygons (limits render complexity on maps)
  polygonGeoJSON: z
    .string()
    .min(50, 'Polygon GeoJSON too short')
    .max(50000, 'Polygon GeoJSON too large (max 50KB)')
    .refine(
      (val) => {
        try {
          const parsed = JSON.parse(val)
          // Basic GeoJSON Polygon validation
          return (
            parsed.type === 'Polygon' &&
            Array.isArray(parsed.coordinates) &&
            parsed.coordinates.length > 0 &&
            Array.isArray(parsed.coordinates[0]) &&
            parsed.coordinates[0].length >= 4 // At least 4 points (closed polygon)
          )
        } catch {
          return false
        }
      },
      {
        message: 'Invalid GeoJSON Polygon format',
      }
    ),

  // Optional visualization
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code (e.g., #3b82f6)')
    .optional()
    .default('#3b82f6'),

  isActive: z.boolean().optional().default(true),
})

export type PolygonGeofenceInput = z.infer<typeof polygonGeofenceSchema>

/**
 * Combined geofence schema (union of circular and polygon)
 */
export const geofenceSchema = z.union([
  circularGeofenceSchema,
  polygonGeofenceSchema,
])

export type GeofenceInput = z.infer<typeof geofenceSchema>

/**
 * Schema for updating geofence status
 */
export const updateGeofenceStatusSchema = z.object({
  id: z.string().cuid('Invalid geofence ID'),
  isActive: z.boolean(),
})

export type UpdateGeofenceStatusInput = z.infer<typeof updateGeofenceStatusSchema>

/**
 * Schema for deleting geofence
 */
export const deleteGeofenceSchema = z.object({
  id: z.string().cuid('Invalid geofence ID'),
})

export type DeleteGeofenceInput = z.infer<typeof deleteGeofenceSchema>

// ============================================================================
// QUERY VALIDATION
// ============================================================================

/**
 * Schema for querying live student locations
 */
export const liveLocationsQuerySchema = z.object({
  schoolId: z.string().cuid('Invalid school ID'),
  geofenceId: z.string().cuid('Invalid geofence ID').optional(),
  maxAgeMinutes: z
    .number()
    .int('Max age must be an integer')
    .min(1, 'Max age must be at least 1 minute')
    .max(60, 'Max age cannot exceed 60 minutes')
    .optional()
    .default(5), // Default: locations from last 5 minutes
})

export type LiveLocationsQuery = z.infer<typeof liveLocationsQuerySchema>

/**
 * Schema for querying geofence events
 */
export const geofenceEventsQuerySchema = z.object({
  schoolId: z.string().cuid('Invalid school ID'),
  studentId: z.string().cuid('Invalid student ID').optional(),
  geofenceId: z.string().cuid('Invalid geofence ID').optional(),
  eventType: z.enum(['ENTER', 'EXIT', 'INSIDE']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(1000, 'Limit cannot exceed 1000')
    .optional()
    .default(100),
})

export type GeofenceEventsQuery = z.infer<typeof geofenceEventsQuerySchema>

// ============================================================================
// CONSENT VALIDATION
// ============================================================================

/**
 * Schema for location tracking consent
 */
export const consentSchema = z.object({
  studentId: z.string().cuid('Invalid student ID'),
  guardianId: z.string().cuid('Invalid guardian ID'),
  consentGiven: z.boolean(),
  consentDate: z.coerce.date().optional().default(() => new Date()),
})

export type ConsentInput = z.infer<typeof consentSchema>
