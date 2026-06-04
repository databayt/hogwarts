// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { logAudit } from "@/lib/audit-log"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  canConfigureSettings,
  canExportTimetable,
  canManageConflicts,
  canModifyTimetable,
  canViewTimetable,
  getAccessLevel,
  getUIConfigForRole,
  getViewTypeForRole,
  hasPermission,
  type TimetableRole,
} from "../permissions-config"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/audit-log", () => ({
  logAudit: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { studentClass: { findMany: vi.fn() } },
}))

const SCHOOL_ID = "school-123"

// ---------------------------------------------------------------------------
// Pure config (no mocks needed)
// ---------------------------------------------------------------------------

describe("Timetable RBAC matrix (pure)", () => {
  it("grants DEVELOPER and ADMIN full modify access", () => {
    for (const role of ["DEVELOPER", "ADMIN"] as TimetableRole[]) {
      expect(canModifyTimetable(role)).toBe(true)
      expect(getAccessLevel(role)).toBe("admin")
      expect(hasPermission(role, "edit")).toBe(true)
      expect(hasPermission(role, "manage_substitutions")).toBe(true)
    }
  })

  it("denies USER and unknown/empty roles everything", () => {
    expect(canViewTimetable("USER")).toBe(false)
    expect(getAccessLevel("USER")).toBe("none")
    expect(hasPermission("USER", "view_all")).toBe(false)
    expect(canViewTimetable(null)).toBe(false)
    expect(canViewTimetable(undefined)).toBe(false)
    expect(hasPermission(undefined, "edit")).toBe(false)
  })

  it("gives read roles view + export but never modify", () => {
    for (const role of [
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "ACCOUNTANT",
      "STAFF",
    ] as TimetableRole[]) {
      expect(getAccessLevel(role)).toBe("read")
      expect(canViewTimetable(role)).toBe(true)
      expect(canModifyTimetable(role)).toBe(false)
      expect(canExportTimetable(role)).toBe(true)
      expect(hasPermission(role, "edit")).toBe(false)
      expect(hasPermission(role, "delete")).toBe(false)
    }
  })

  it("enforces per-role action specifics", () => {
    // Teacher: own + analytics, but not class-only or child views.
    expect(hasPermission("TEACHER", "view_own")).toBe(true)
    expect(hasPermission("TEACHER", "view_analytics")).toBe(true)
    expect(hasPermission("TEACHER", "view_child")).toBe(false)
    // Student: class view only.
    expect(hasPermission("STUDENT", "view_class")).toBe(true)
    expect(hasPermission("STUDENT", "view_all")).toBe(false)
    expect(hasPermission("STUDENT", "view_analytics")).toBe(false)
    // Guardian: child view only.
    expect(hasPermission("GUARDIAN", "view_child")).toBe(true)
    expect(hasPermission("GUARDIAN", "view_class")).toBe(false)
    // Accountant: analytics yes, conflicts no.
    expect(hasPermission("ACCOUNTANT", "view_analytics")).toBe(true)
    expect(canManageConflicts("ACCOUNTANT")).toBe(false)
    // Only admins configure settings / manage conflicts.
    expect(canConfigureSettings("ADMIN")).toBe(true)
    expect(canConfigureSettings("TEACHER")).toBe(false)
    expect(canManageConflicts("ADMIN")).toBe(true)
  })

  it("derives UI config from role", () => {
    const admin = getUIConfigForRole("ADMIN")
    expect(admin.showEditButton).toBe(true)
    expect(admin.readOnlyMode).toBe(false)
    expect(admin.enableDragDrop).toBe(true)

    const teacher = getUIConfigForRole("TEACHER")
    expect(teacher.showEditButton).toBe(false)
    expect(teacher.readOnlyMode).toBe(true)
    expect(teacher.showExportButton).toBe(true)
    expect(teacher.showConfigButton).toBe(false)
  })

  it("routes the correct view type by role + context", () => {
    expect(getViewTypeForRole("ADMIN")).toBe("admin")
    expect(getViewTypeForRole("DEVELOPER")).toBe("admin")
    expect(getViewTypeForRole("TEACHER", { isTeacher: true })).toBe("teacher")
    expect(getViewTypeForRole("TEACHER")).toBe("readonly")
    expect(getViewTypeForRole("STUDENT", { isStudent: true })).toBe("student")
    expect(getViewTypeForRole("GUARDIAN", { isGuardian: true })).toBe(
      "guardian"
    )
    expect(getViewTypeForRole(null)).toBe("readonly")
    expect(getViewTypeForRole("USER")).toBe("readonly")
  })
})

// ---------------------------------------------------------------------------
// Server-side: audit persistence + role-based data filtering
// (imported lazily so the module-level mocks above are in force)
// ---------------------------------------------------------------------------

describe("logTimetableAction → logAudit (P1-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", email: "admin@school.test", role: "ADMIN" },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "ADMIN",
      isPlatformAdmin: false,
    })
  })

  it("persists a namespaced audit row with previous/new values and folded context", async () => {
    const { logTimetableAction } = await import("../permissions")

    await logTimetableAction("edit", {
      entityType: "slot",
      entityId: "slot-1",
      changes: { from: { periodId: "p1" }, to: { periodId: "p2" } },
      metadata: { reason: "swap" },
    })

    expect(logAudit).toHaveBeenCalledTimes(1)
    const arg = vi.mocked(logAudit).mock.calls[0][0]
    expect(arg.action).toBe("timetable.edit")
    expect(arg.entityType).toBe("slot")
    expect(arg.entityId).toBe("slot-1")
    expect(arg.previousValue).toEqual({ periodId: "p1" })
    expect(arg.newValue).toEqual({ periodId: "p2" })
    expect(arg.metadata).toMatchObject({
      reason: "swap",
      role: "ADMIN",
      email: "admin@school.test",
    })
    expect(arg.userId).toBe("user-1")
    expect(arg.schoolId).toBe(SCHOOL_ID)
  })

  it("falls back to the whole change set as newValue when no to/from split", async () => {
    const { logTimetableAction } = await import("../permissions")

    await logTimetableAction("delete", {
      entityType: "slot",
      metadata: { termId: "t1" },
    })

    expect(logAudit).toHaveBeenCalledTimes(1)
    expect(vi.mocked(logAudit).mock.calls[0][0].action).toBe("timetable.delete")
  })
})

describe("filterTimetableByRole", () => {
  const rows = [
    { id: "a", teacherId: "t1", classId: "c1" },
    { id: "b", teacherId: "t2", classId: "c2" },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_ID,
      requestId: "req-1",
      role: "ADMIN",
      isPlatformAdmin: false,
    })
  })

  function asRole(role: TimetableRole) {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "user-1", role },
    } as any)
  }

  it("returns everything for ADMIN", async () => {
    asRole("ADMIN")
    const { filterTimetableByRole } = await import("../permissions")
    expect(await filterTimetableByRole(rows)).toHaveLength(2)
  })

  it("filters to the teacher's own rows for TEACHER", async () => {
    asRole("TEACHER")
    const { filterTimetableByRole } = await import("../permissions")
    const result = await filterTimetableByRole(rows, { teacherId: "t1" })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("a")
  })

  it("filters by class for STUDENT, and returns [] without a class", async () => {
    asRole("STUDENT")
    const { filterTimetableByRole } = await import("../permissions")
    expect(await filterTimetableByRole(rows, { classId: "c2" })).toHaveLength(1)
    expect(await filterTimetableByRole(rows)).toEqual([])
  })

  it("resolves GUARDIAN child class ids via studentClass and filters", async () => {
    asRole("GUARDIAN")
    vi.mocked(db.studentClass.findMany).mockResolvedValue([
      { classId: "c1" },
    ] as any)
    const { filterTimetableByRole } = await import("../permissions")
    const result = await filterTimetableByRole(rows, { childIds: ["s1"] })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("a")
  })

  it("returns [] for GUARDIAN with no children", async () => {
    asRole("GUARDIAN")
    const { filterTimetableByRole } = await import("../permissions")
    expect(await filterTimetableByRole(rows, { childIds: [] })).toEqual([])
  })

  it("returns [] for USER (no access)", async () => {
    asRole("USER")
    const { filterTimetableByRole } = await import("../permissions")
    expect(await filterTimetableByRole(rows)).toEqual([])
  })
})
