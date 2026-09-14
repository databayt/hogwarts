// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import {
  isPickableMethod,
  readAttendanceMethods,
  writeAttendanceMethods,
} from "@/components/school-dashboard/attendance/settings/store"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/attendance/methods — list enabled attendance methods
 * PUT /api/mobile/attendance/methods — update enabled methods (ADMIN only)
 *
 * Backed by the school's default AttendancePolicy row — the same row the web
 * /attendance/settings page edits. School.enabledModules is never touched:
 * it is the sidebar's string[] of module keys.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const methods = await readAttendanceMethods(auth.schoolId)
    return NextResponse.json({ methods })
  } catch (error) {
    console.error("Mobile get methods error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    // Authorization: manage_settings is ADMIN-only per the central matrix.
    if (auth.role !== "ADMIN" && auth.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const methods: unknown = body?.methods

    if (
      !Array.isArray(methods) ||
      methods.length === 0 ||
      !methods.every((m) => typeof m === "string" && isPickableMethod(m))
    ) {
      return NextResponse.json(
        { error: "methods must be a non-empty array of known methods" },
        { status: 400 }
      )
    }

    const unique = [...new Set(methods)]
    await writeAttendanceMethods(auth.schoolId, unique)

    return NextResponse.json({ methods: unique })
  } catch (error) {
    console.error("Mobile update methods error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
