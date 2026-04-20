// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../../lib/authenticate"

/**
 * POST /api/mobile/exams/:examId/violations — report proctor violation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { examId } = await params
    const body = await request.json()
    const { session_id, type, details } = body

    if (!session_id || !type) {
      return NextResponse.json(
        { error: "session_id and type required" },
        { status: 400 }
      )
    }

    const validTypes = [
      "FOCUS_LOST",
      "TAB_SWITCH",
      "COPY_ATTEMPT",
      "TIME_ANOMALY",
      "IP_CHANGE",
      "MULTIPLE_DEVICE",
    ]

    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid violation type" },
        { status: 400 }
      )
    }

    // Verify session exists and belongs to this exam
    const session = await db.examSession.findFirst({
      where: {
        id: session_id,
        examId,
        schoolId: auth.schoolId,
      },
    })

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Build updated security flags array
    const currentFlags =
      (session.securityFlags as Array<Record<string, unknown>>) || []
    const newFlag = {
      type,
      details: details || null,
      timestamp: new Date().toISOString(),
    }

    // Compute updated counters
    const focusLostCount =
      session.focusLostCount + (type === "FOCUS_LOST" ? 1 : 0)
    const tabSwitchCount =
      session.tabSwitchCount + (type === "TAB_SWITCH" ? 1 : 0)
    const copyAttempts =
      session.copyAttempts + (type === "COPY_ATTEMPT" ? 1 : 0)

    await db.examSession.update({
      where: { id: session_id },
      data: {
        securityFlags: [
          ...currentFlags,
          newFlag,
        ] as unknown as import("@prisma/client").Prisma.InputJsonValue,
        flagCount: session.flagCount + 1,
        focusLostCount,
        tabSwitchCount,
        copyAttempts,
        lastActivityAt: new Date(),
      },
    })

    return NextResponse.json({ recorded: true })
  } catch (error) {
    console.error("Mobile exam violation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
