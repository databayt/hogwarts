/**
 * Live Geolocation API - Real-Time Student Tracking
 *
 * Returns current locations of students who submitted GPS data within N minutes.
 *
 * USE CASES:
 * - Real-time map view of students on campus
 * - Bus route monitoring during pickup/dropoff
 * - Field trip tracking
 * - Emergency location verification
 *
 * PERMISSION MODEL:
 * - ADMIN: Can view all students in school
 * - TEACHER: Can view students in their classes (enforced in action)
 * - Others: 403 Forbidden
 *
 * PARAMETERS:
 * - maxAgeMinutes (default: 5): Only return locations updated within this window
 *   Lower values = fresher data but fewer results
 *   Higher values = more students but stale positions
 *
 * WHY FORCE-DYNAMIC:
 * - Location data changes constantly
 * - Must not be cached by Next.js or CDN
 * - Each request needs fresh database query
 *
 * MULTI-TENANT SAFETY:
 * - schoolId extracted from session (not URL params)
 * - Server action filters by schoolId automatically
 * - Cannot view students from other schools
 *
 * PRIVACY NOTES:
 * - Requires guardian consent before tracking
 * - Location data retention: configurable per school
 * - Not accessible to students or parents
 *
 * GOTCHAS:
 * - GPS accuracy varies (50m typical, 5m best case)
 * - Indoor locations are unreliable
 * - Battery saver mode reduces update frequency
 * - VPN/proxy may affect location accuracy
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getLiveStudentLocations } from '@/components/platform/attendance/geofencee/actions'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user?.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Check permissions (only ADMIN and TEACHER can view live locations)
    const role = session.user.role
    if (role !== 'ADMIN' && role !== 'TEACHER') {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // 3. Get query parameters
    const searchParams = request.nextUrl.searchParams
    const maxAgeMinutes = parseInt(searchParams.get('maxAgeMinutes') || '5')

    // 4. Call server action
    const result = await getLiveStudentLocations(maxAgeMinutes)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: result.data,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in /api/geo/live:', error)
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
