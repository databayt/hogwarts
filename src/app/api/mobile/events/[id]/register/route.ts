// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * POST /api/mobile/events/:id/register — register for an event
 * DELETE /api/mobile/events/:id/register — unregister from an event
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id: eventId } = await params

    // Verify event exists and belongs to this school
    const event = await db.event.findFirst({
      where: { id: eventId, schoolId: auth.schoolId },
      select: {
        id: true,
        maxAttendees: true,
        currentAttendees: true,
        status: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (event.status === "CANCELLED") {
      return NextResponse.json({ error: "Event is cancelled" }, { status: 400 })
    }

    // Check capacity
    if (event.maxAttendees && event.currentAttendees >= event.maxAttendees) {
      // Register as waitlisted
      const registration = await db.eventRegistration.upsert({
        where: {
          eventId_userId: {
            eventId,
            userId: auth.userId,
          },
        },
        update: {
          status: "WAITLISTED",
          cancelledAt: null,
        },
        create: {
          schoolId: auth.schoolId,
          eventId,
          userId: auth.userId,
          status: "WAITLISTED",
        },
      })

      return NextResponse.json({
        success: true,
        status: registration.status,
        message: "Added to waitlist",
      })
    }

    // Register normally
    const registration = await db.eventRegistration.upsert({
      where: {
        eventId_userId: {
          eventId,
          userId: auth.userId,
        },
      },
      update: {
        status: "REGISTERED",
        cancelledAt: null,
      },
      create: {
        schoolId: auth.schoolId,
        eventId,
        userId: auth.userId,
        status: "REGISTERED",
      },
    })

    // Increment attendee count
    await db.event.update({
      where: { id: eventId },
      data: { currentAttendees: { increment: 1 } },
    })

    return NextResponse.json({
      success: true,
      status: registration.status,
    })
  } catch (error) {
    console.error("Mobile event register error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { id: eventId } = await params

    const registration = await db.eventRegistration.findFirst({
      where: {
        eventId,
        userId: auth.userId,
        schoolId: auth.schoolId,
      },
      select: { id: true, status: true },
    })

    if (!registration) {
      return NextResponse.json(
        { error: "Not registered for this event" },
        { status: 404 }
      )
    }

    await db.eventRegistration.update({
      where: { id: registration.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    })

    // Decrement attendee count if was registered (not waitlisted)
    if (registration.status === "REGISTERED") {
      await db.event.update({
        where: { id: eventId },
        data: { currentAttendees: { decrement: 1 } },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Mobile event unregister error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
