// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  canEditSection,
  canViewField,
  filterProfileData,
  getPermissionLevel,
} from "../permissions"
import type { ProfileContext, ProfileData } from "../types"

const baseContext: Omit<ProfileContext, "viewerId" | "viewerRole"> = {
  viewerSchoolId: "school-1",
  profileUserId: "user-target",
  profileSchoolId: "school-1",
  profileType: "STUDENT",
}

const baseProfile: ProfileData = {
  id: "user-target",
  username: "alice",
  email: "alice@school.edu",
  emailVerified: null,
  image: null,
  role: "STUDENT" as never,
  schoolId: "school-1",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-02"),
  profileType: "STUDENT",
}

describe("getPermissionLevel", () => {
  it("returns PUBLIC when viewer is unauthenticated", () => {
    const level = getPermissionLevel({
      ...baseContext,
      viewerId: null,
      viewerRole: null,
    })
    expect(level).toBe("PUBLIC")
  })

  it("returns OWNER when viewer is the profile user", () => {
    const level = getPermissionLevel({
      ...baseContext,
      viewerId: "user-target",
      viewerRole: "STUDENT" as never,
    })
    expect(level).toBe("OWNER")
  })

  it("returns ADMIN for school admin viewing a peer", () => {
    const level = getPermissionLevel({
      ...baseContext,
      viewerId: "admin-1",
      viewerRole: "ADMIN" as never,
    })
    expect(level).toBe("ADMIN")
  })

  it("returns ADMIN for platform DEVELOPER", () => {
    const level = getPermissionLevel({
      ...baseContext,
      viewerId: "dev-1",
      viewerRole: "DEVELOPER" as never,
    })
    expect(level).toBe("ADMIN")
  })

  it("returns STAFF for teachers viewing other users", () => {
    for (const role of ["TEACHER", "STAFF", "ACCOUNTANT"] as const) {
      const level = getPermissionLevel({
        ...baseContext,
        viewerId: "staff-1",
        viewerRole: role as never,
      })
      expect(level).toBe("STAFF")
    }
  })

  it("returns RELATED for students viewing peers in the same school", () => {
    const level = getPermissionLevel({
      ...baseContext,
      viewerId: "student-2",
      viewerRole: "STUDENT" as never,
    })
    expect(level).toBe("RELATED")
  })

  it("returns PUBLIC for students from a different school", () => {
    const level = getPermissionLevel({
      ...baseContext,
      viewerId: "student-2",
      viewerRole: "STUDENT" as never,
      viewerSchoolId: "school-other",
    })
    expect(level).toBe("PUBLIC")
  })
})

describe("filterProfileData", () => {
  it("returns the full profile to OWNER", () => {
    const result = filterProfileData(baseProfile, "OWNER")
    expect(result.canViewFullProfile).toBe(true)
    expect(result.email).toBe("alice@school.edu")
  })

  it("returns the full profile to ADMIN", () => {
    const result = filterProfileData(baseProfile, "ADMIN")
    expect(result.canViewFullProfile).toBe(true)
    expect(result.email).toBe("alice@school.edu")
  })

  it("hides email from RELATED viewers", () => {
    const result = filterProfileData(baseProfile, "RELATED")
    expect(result.canViewFullProfile).toBe(false)
    expect(result.email).toBeUndefined()
  })

  it("returns minimal data for PUBLIC viewers", () => {
    const result = filterProfileData(baseProfile, "PUBLIC")
    expect(result.canViewFullProfile).toBe(false)
    expect(result.email).toBeUndefined()
    expect(result.username).toBe("alice")
  })

  it("preserves identifying fields for every level", () => {
    for (const level of [
      "OWNER",
      "ADMIN",
      "STAFF",
      "RELATED",
      "PUBLIC",
    ] as const) {
      const result = filterProfileData(baseProfile, level)
      expect(result.id).toBe("user-target")
      expect(result.role).toBe(baseProfile.role)
    }
  })
})

describe("canViewField", () => {
  it("allows OWNER to view every field", () => {
    expect(canViewField("medicalConditions", "OWNER")).toBe(true)
    expect(canViewField("dateOfBirth", "OWNER")).toBe(true)
  })

  it("allows ADMIN to view every field", () => {
    expect(canViewField("medicalConditions", "ADMIN")).toBe(true)
    expect(canViewField("anyField", "ADMIN")).toBe(true)
  })

  it("limits STAFF to known staff fields", () => {
    expect(canViewField("medicalConditions", "STAFF")).toBe(true)
    expect(canViewField("dateOfBirth", "STAFF")).toBe(true)
    expect(canViewField("password", "STAFF")).toBe(false)
  })

  it("hides sensitive fields from RELATED viewers", () => {
    expect(canViewField("medicalConditions", "RELATED")).toBe(false)
    expect(canViewField("email", "RELATED")).toBe(true)
  })

  it("limits PUBLIC viewers to identifying fields only", () => {
    expect(canViewField("username", "PUBLIC")).toBe(true)
    expect(canViewField("email", "PUBLIC")).toBe(false)
    expect(canViewField("medicalConditions", "PUBLIC")).toBe(false)
  })
})

describe("canEditSection", () => {
  it("lets a teacher self-edit contact, qualifications, experience", () => {
    expect(canEditSection(true, false, "teacher", "contact")).toBe(true)
    expect(canEditSection(true, false, "teacher", "qualifications")).toBe(true)
    expect(canEditSection(true, false, "teacher", "experience")).toBe(true)
  })

  it("blocks teachers from self-editing employment", () => {
    expect(canEditSection(true, false, "teacher", "employment")).toBe(false)
  })

  it("lets a student self-edit contact only", () => {
    expect(canEditSection(true, false, "student", "contact")).toBe(true)
    expect(canEditSection(true, false, "student", "personal")).toBe(false)
    expect(canEditSection(true, false, "student", "health")).toBe(false)
  })

  it("lets an admin edit every documented section", () => {
    const teacherSections = [
      "information",
      "contact",
      "employment",
      "qualifications",
      "experience",
      "expertise",
    ]
    for (const s of teacherSections) {
      expect(canEditSection(false, true, "teacher", s)).toBe(true)
    }
    const studentSections = [
      "personal",
      "enrollment",
      "contact",
      "location",
      "health",
      "previous-education",
    ]
    for (const s of studentSections) {
      expect(canEditSection(false, true, "student", s)).toBe(true)
    }
  })

  it("denies edits when neither owner nor admin", () => {
    expect(canEditSection(false, false, "teacher", "contact")).toBe(false)
    expect(canEditSection(false, false, "student", "contact")).toBe(false)
  })

  it("denies edits for unknown roles", () => {
    expect(canEditSection(true, true, "guardian", "contact")).toBe(false)
  })
})
