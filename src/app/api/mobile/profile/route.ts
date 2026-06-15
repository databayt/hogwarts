// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

// Mirrors the web `updateGitHubProfileSchema` length guards. The mobile contract
// keys are `username` / `bio` (not `displayName`), so this is a dedicated schema.
const mobileProfileUpdateSchema = z.object({
  username: z.string().trim().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
})

/**
 * Mobile Profile API
 *
 * GET  /api/mobile/profile — returns current user profile
 * PUT  /api/mobile/profile — updates profile fields
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const user = await db.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        username: true,
        email: true,
        image: true,
        role: true,
        schoolId: true,
        bio: true,
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            dateOfBirth: true,
            mobileNumber: true,
            profilePhotoUrl: true,
            status: true,
            section: {
              select: {
                id: true,
                name: true,
                grade: { select: { name: true } },
              },
            },
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            gender: true,
            birthDate: true,
            emailAddress: true,
            profilePhotoUrl: true,
            employmentStatus: true,
            teacherDepartments: {
              where: { isPrimary: true },
              take: 1,
              select: { department: { select: { departmentName: true } } },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const school = await db.school.findUnique({
      where: { id: auth.schoolId },
      select: { id: true, name: true, nameEn: true, domain: true },
    })

    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
      avatar_url: user.image,
      role: user.role,
      bio: user.bio,
      school: school
        ? {
            id: school.id,
            name: school.name,
            name_en: school.nameEn,
            domain: school.domain,
          }
        : null,
      student: user.student
        ? {
            id: user.student.id,
            given_name: user.student.firstName,
            family_name: user.student.lastName,
            gender: user.student.gender,
            date_of_birth: user.student.dateOfBirth,
            phone: user.student.mobileNumber,
            photo_url: user.student.profilePhotoUrl,
            status: user.student.status,
            section: user.student.section
              ? {
                  id: user.student.section.id,
                  name: user.student.section.name,
                  grade: user.student.section.grade?.name,
                }
              : null,
          }
        : null,
      teacher: user.teacher
        ? {
            id: user.teacher.id,
            given_name: user.teacher.firstName,
            family_name: user.teacher.lastName,
            gender: user.teacher.gender,
            date_of_birth: user.teacher.birthDate,
            email: user.teacher.emailAddress,
            photo_url: user.teacher.profilePhotoUrl,
            status: user.teacher.employmentStatus,
            department:
              user.teacher.teacherDepartments[0]?.department?.departmentName ||
              null,
          }
        : null,
    })
  } catch (error) {
    console.error("Mobile profile error:", error)
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

    const body = await request.json().catch(() => null)
    const parsed = mobileProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      )
    }
    const { username, bio } = parsed.data

    const user = await db.user.update({
      where: { id: auth.userId },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(bio !== undefined ? { bio } : {}),
      },
      select: { id: true, username: true, email: true, image: true, bio: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Mobile profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
