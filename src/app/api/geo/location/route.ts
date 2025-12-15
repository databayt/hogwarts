/**
 * GPS Location Submission API - Geofence Attendance
 *
 * Receives student device location for automatic attendance tracking.
 *
 * USE CASES:
 * - Automatic check-in when student enters school geofence
 * - Bus route tracking during pickup/dropoff
 * - Field trip location monitoring
 * - Verify student is on campus during school hours
 *
 * RATE LIMITING:
 * - 20 requests per 10 seconds per student
 * - WHY: Balance real-time updates vs server load
 * - GPS typically updates every 1-5 seconds
 * - 20 req/10s allows burst without abuse
 *
 * LOCATION DATA:
 * - latitude, longitude: GPS coordinates
 * - accuracy: Horizontal accuracy in meters
 * - timestamp: Device time (for offline sync)
 *
 * MULTI-TENANT SAFETY:
 * - schoolId from session (not request body)
 * - Location stored scoped to school
 * - Cannot submit for another school
 *
 * WHY force-dynamic:
 * - Location data is real-time
 * - Cannot be cached or precomputed
 * - Each submission must hit database
 *
 * PRIVACY CONSIDERATIONS:
 * - Requires guardian consent
 * - Data retention policy per school
 * - Not accessible to students/parents
 *
 * GOTCHAS:
 * - GPS accuracy varies (5m-100m typical)
 * - Indoor locations unreliable
 * - Battery saver mode reduces updates
 * - VPN/proxy affects accuracy
 *
 * @see /components/platform/attendance/geofencee/actions.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { submitLocation } from '@/components/platform/attendance/geofencee/actions'
import { RATE_LIMITS, rateLimit, createRateLimitHeaders } from '@/lib/rate-limit'
import type { LocationInput } from '@/components/platform/attendance/geofencee/validation'

export async function POST(request: NextRequest) {
  try {
    // 1. Check rate limit (20 requests per 10 seconds)
    const rateLimitResponse = await rateLimit(
      request,
      RATE_LIMITS.GEO_LOCATION,
      'geo-location'
    )

    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // 2. Authenticate user
    const session = await auth()
    if (!session?.user?.schoolId || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Parse request body
    const body = await request.json()

    // 4. Call server action
    const result = await submitLocation(body as LocationInput)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // 5. Return success response with rate limit headers
    const headers = createRateLimitHeaders(
      RATE_LIMITS.GEO_LOCATION.maxRequests,
      0, // Will be set by rate limit middleware
      Date.now() + RATE_LIMITS.GEO_LOCATION.windowMs
    )

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers }
    )
  } catch (error) {
    console.error('Error in /api/geo/location:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Disable static generation for this route
export const dynamic = 'force-dynamic'
