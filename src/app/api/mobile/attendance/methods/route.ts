// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

const DEFAULT_METHODS = ["MANUAL", "QR_CODE", "BARCODE"]

/**
 * GET /api/mobile/attendance/methods — list enabled attendance methods
 * PUT /api/mobile/attendance/methods — update enabled methods (ADMIN only)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const school = await db.school.findUnique({
      where: { id: auth.schoolId },
      select: { enabledModules: true },
    })

    // enabledModules is a Json field; extract attendance methods if present
    const modules = school?.enabledModules as Record<string, unknown> | null
    const methods =
      modules && Array.isArray(modules.attendanceMethods)
        ? (modules.attendanceMethods as string[])
        : DEFAULT_METHODS

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
    // "SUPER_ADMIN" is dead code → "DEVELOPER".
    if (auth.role !== "ADMIN" && auth.role !== "DEVELOPER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { methods } = body

    if (!Array.isArray(methods) || methods.length === 0) {
      return NextResponse.json(
        { error: "methods must be a non-empty array" },
        { status: 400 }
      )
    }

    // Read current enabledModules, merge in attendanceMethods
    const school = await db.school.findUnique({
      where: { id: auth.schoolId },
      select: { enabledModules: true },
    })

    const existingModules =
      (school?.enabledModules as Record<string, unknown> | null) || {}

    await db.school.update({
      where: { id: auth.schoolId },
      data: {
        enabledModules: {
          ...existingModules,
          attendanceMethods: methods,
        },
      },
    })

    return NextResponse.json({ methods })
  } catch (error) {
    console.error("Mobile update methods error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
