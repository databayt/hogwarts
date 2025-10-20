/**
 * API Route: GET /api/geo/live
 * Get live student locations (last N minutes)
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
