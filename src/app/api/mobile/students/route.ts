// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { provisionStudent } from "@/lib/student-provisioning"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * Mobile Students API
 *
 * GET  /api/mobile/students          — list students
 * POST /api/mobile/students          — create student (admin)
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || undefined
    const sectionId = searchParams.get("section_id") || undefined
    const status = searchParams.get("status") || "ACTIVE"
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "50")
    const skip = (page - 1) * perPage

    const where: Prisma.StudentWhereInput = {
      schoolId: auth.schoolId,
      ...(status ? { status: status as Prisma.EnumStudentStatusFilter } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { grNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [students, total] = await Promise.all([
      db.student.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { firstName: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          grNumber: true,
          gender: true,
          dateOfBirth: true,
          status: true,
          profilePhotoUrl: true,
          mobileNumber: true,
          section: {
            select: {
              id: true,
              name: true,
              grade: { select: { id: true, name: true } },
            },
          },
        },
      }),
      db.student.count({ where }),
    ])

    const data = students.map((s) => ({
      id: s.id,
      given_name: s.firstName,
      family_name: s.lastName,
      gr_number: s.grNumber,
      gender: s.gender,
      date_of_birth: s.dateOfBirth?.toISOString() || null,
      status: s.status,
      photo_url: s.profilePhotoUrl,
      phone: s.mobileNumber,
      section: s.section
        ? {
            id: s.section.id,
            name: s.section.name,
            grade: s.section.grade?.name,
          }
        : null,
    }))

    return NextResponse.json({ data, total, page, per_page: perPage })
  } catch (error) {
    console.error("Mobile students error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const {
      given_name,
      family_name,
      email,
      gender,
      section_id,
      date_of_birth,
    } = body

    if (!given_name) {
      return NextResponse.json(
        { error: "given_name is required" },
        { status: 400 }
      )
    }

    // Admin-authenticated creation from the mobile app is the same act as the
    // dashboard's single-student wizard, so it takes the same road: the shared
    // intake core, which mints the Application (channel ADMIN_DIRECT), the
    // per-school student code, the login and the fee assignments. A bare
    // `db.student.create` here produced a student none of those surfaces knew
    // about. See content/docs-en/admission.mdx, "four channels, one pipeline".
    const result = await db.$transaction(
      (tx) =>
        provisionStudent(
          {
            schoolId: auth.schoolId,
            firstName: given_name,
            lastName: family_name || "",
            gender: gender || null,
            email: email || null,
            sectionId: section_id || null,
            // Omitted DOB stays NULL. It used to default to `new Date()`,
            // stamping every mobile-created student as born today.
            dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
          },
          {
            notify: false,
            credentialDelivery: "temp-password",
            origin: "ADMIN_DIRECT",
          },
          tx
        ),
      { timeout: 30000 }
    )

    const student = await db.student.findUnique({
      where: { id: result.studentId },
      select: { id: true, firstName: true, lastName: true, status: true },
    })

    return NextResponse.json(
      {
        id: result.studentId,
        given_name: student?.firstName ?? given_name,
        family_name: student?.lastName ?? family_name ?? "",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Mobile create student error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
