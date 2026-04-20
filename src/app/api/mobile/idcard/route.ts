// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { db } from "@/lib/db"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * GET /api/mobile/idcard — school ID card data for the current user
 *
 * Composes from User + Student/Teacher + School records.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const [user, school] = await Promise.all([
      db.user.findUnique({
        where: { id: auth.userId },
        select: {
          id: true,
          username: true,
          email: true,
          image: true,
          role: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              studentId: true,
              grNumber: true,
              admissionNumber: true,
              profilePhotoUrl: true,
              idCardNumber: true,
              bloodGroup: true,
              section: {
                select: {
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
              employeeId: true,
              profilePhotoUrl: true,
              teacherDepartments: {
                where: { isPrimary: true },
                take: 1,
                select: { department: { select: { departmentName: true } } },
              },
            },
          },
          staffMember: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
              position: true,
              profilePhotoUrl: true,
            },
          },
        },
      }),
      db.school.findUnique({
        where: { id: auth.schoolId },
        select: {
          id: true,
          name: true,
          nameEn: true,
          logoUrl: true,
          address: true,
          phoneNumber: true,
          email: true,
          website: true,
        },
      }),
    ])

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Determine name, photo, and ID based on role
    let givenName = user.username || ""
    let familyName = ""
    let photoUrl = user.image
    let idNumber: string | null = null
    let bloodGroup: string | null = null
    let section: string | null = null
    let grade: string | null = null
    let department: string | null = null
    let position: string | null = null

    if (user.student) {
      givenName = user.student.firstName
      familyName = user.student.lastName
      photoUrl = user.student.profilePhotoUrl || user.image
      idNumber =
        user.student.idCardNumber ||
        user.student.studentId ||
        user.student.grNumber ||
        user.student.admissionNumber
      bloodGroup = user.student.bloodGroup
      section = user.student.section?.name || null
      grade = user.student.section?.grade?.name || null
    } else if (user.teacher) {
      givenName = user.teacher.firstName
      familyName = user.teacher.lastName
      photoUrl = user.teacher.profilePhotoUrl || user.image
      idNumber = user.teacher.employeeId
      department =
        user.teacher.teacherDepartments[0]?.department?.departmentName || null
    } else if (user.staffMember) {
      givenName = user.staffMember.firstName
      familyName = user.staffMember.lastName
      photoUrl = user.staffMember.profilePhotoUrl || user.image
      idNumber = user.staffMember.employeeId
      position = user.staffMember.position
    }

    return NextResponse.json({
      user: {
        id: user.id,
        given_name: givenName,
        family_name: familyName,
        email: user.email,
        role: user.role,
        photo_url: photoUrl,
        id_number: idNumber,
        blood_group: bloodGroup,
        section,
        grade,
        department,
        position,
      },
      school: school
        ? {
            id: school.id,
            name: school.name,
            name_en: school.nameEn,
            logo_url: school.logoUrl,
            address: school.address,
            phone: school.phoneNumber,
            email: school.email,
            website: school.website,
          }
        : null,
    })
  } catch (error) {
    console.error("Mobile idcard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
