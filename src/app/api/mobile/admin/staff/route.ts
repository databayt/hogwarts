// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../../lib/authenticate"

/**
 * GET /api/mobile/admin/staff — list staff (teachers + staff members)
 *
 * Admin/Super Admin only.
 * Query params: role ("teacher"|"staff"), search, page, per_page
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    if (
      auth.role !== "ADMIN" &&
      auth.role !== "SUPER_ADMIN" &&
      auth.role !== "DEVELOPER"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get("role") || undefined
    const search = searchParams.get("search") || undefined
    const page = parseInt(searchParams.get("page") || "1")
    const perPage = parseInt(searchParams.get("per_page") || "30")
    const skip = (page - 1) * perPage

    const results: Array<{
      id: string
      given_name: string
      family_name: string
      email: string
      role: string
      status: string
      photo_url: string | null
      employee_id: string | null
      department: string | null
      position: string | null
    }> = []

    let totalTeachers = 0
    let totalStaff = 0

    // Fetch teachers (unless role filter is "staff")
    if (!roleFilter || roleFilter === "teacher") {
      const teacherWhere = {
        schoolId: auth.schoolId,
        ...(search
          ? {
              OR: [
                {
                  firstName: { contains: search, mode: "insensitive" as const },
                },
                {
                  lastName: { contains: search, mode: "insensitive" as const },
                },
                {
                  emailAddress: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      }

      const [teachers, count] = await Promise.all([
        db.teacher.findMany({
          where: teacherWhere,
          orderBy: { firstName: "asc" },
          skip: roleFilter === "teacher" ? skip : 0,
          take: roleFilter === "teacher" ? perPage : 100,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            emailAddress: true,
            employeeId: true,
            employmentStatus: true,
            profilePhotoUrl: true,
            teacherDepartments: {
              where: { isPrimary: true },
              take: 1,
              select: { department: { select: { departmentName: true } } },
            },
          },
        }),
        db.teacher.count({ where: teacherWhere }),
      ])

      totalTeachers = count
      for (const t of teachers) {
        results.push({
          id: t.id,
          given_name: t.firstName,
          family_name: t.lastName,
          email: t.emailAddress,
          role: "TEACHER",
          status: t.employmentStatus,
          photo_url: t.profilePhotoUrl,
          employee_id: t.employeeId,
          department:
            t.teacherDepartments[0]?.department?.departmentName || null,
          position: null,
        })
      }
    }

    // Fetch staff members (unless role filter is "teacher")
    if (!roleFilter || roleFilter === "staff") {
      const staffWhere = {
        schoolId: auth.schoolId,
        ...(search
          ? {
              OR: [
                {
                  firstName: { contains: search, mode: "insensitive" as const },
                },
                {
                  lastName: { contains: search, mode: "insensitive" as const },
                },
                {
                  emailAddress: {
                    contains: search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      }

      const [staffMembers, count] = await Promise.all([
        db.staffMember.findMany({
          where: staffWhere,
          orderBy: { firstName: "asc" },
          skip: roleFilter === "staff" ? skip : 0,
          take: roleFilter === "staff" ? perPage : 100,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            emailAddress: true,
            employeeId: true,
            employmentStatus: true,
            profilePhotoUrl: true,
            position: true,
            department: { select: { departmentName: true } },
          },
        }),
        db.staffMember.count({ where: staffWhere }),
      ])

      totalStaff = count
      for (const s of staffMembers) {
        results.push({
          id: s.id,
          given_name: s.firstName,
          family_name: s.lastName,
          email: s.emailAddress,
          role: "STAFF",
          status: s.employmentStatus,
          photo_url: s.profilePhotoUrl,
          employee_id: s.employeeId,
          department: s.department?.departmentName || null,
          position: s.position,
        })
      }
    }

    const total =
      roleFilter === "teacher"
        ? totalTeachers
        : roleFilter === "staff"
          ? totalStaff
          : totalTeachers + totalStaff

    return NextResponse.json({
      data: results,
      total,
      total_teachers: totalTeachers,
      total_staff: totalStaff,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("Mobile admin staff error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
