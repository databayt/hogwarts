// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/events/:id — event detail
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id } = await params

    const event = await db.event.findFirst({
      where: { id, schoolId: auth.schoolId },
      select: {
        id: true,
        title: true,
        description: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
        eventType: true,
        isPublic: true,
        registrationRequired: true,
        maxAttendees: true,
        currentAttendees: true,
        organizer: true,
        targetAudience: true,
        notes: true,
        status: true,
        createdAt: true,
        _count: {
          select: { registrations: true },
        },
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Check if current user is registered
    const registration = await db.eventRegistration.findFirst({
      where: {
        eventId: id,
        userId: auth.userId,
        schoolId: auth.schoolId,
      },
      select: { id: true, status: true },
    })

    return NextResponse.json({
      id: event.id,
      title: event.title,
      description: event.description,
      start_date: event.eventDate?.toISOString() || null,
      start_time: event.startTime,
      end_time: event.endTime,
      location: event.location,
      type: event.eventType,
      is_public: event.isPublic,
      registration_required: event.registrationRequired,
      max_attendees: event.maxAttendees,
      current_attendees: event.currentAttendees,
      registration_count: event._count.registrations,
      organizer_name: event.organizer || null,
      target_audience: event.targetAudience,
      notes: event.notes,
      status: event.status,
      created_at: event.createdAt.toISOString(),
      is_registered: !!registration,
      registration_status: registration?.status || null,
    })
  } catch (error) {
    console.error("Mobile event detail error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
