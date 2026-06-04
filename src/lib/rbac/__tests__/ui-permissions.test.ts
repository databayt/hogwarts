// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ALL_ROLES, type Role } from "../types"
import {
  ACADEMIC_WRITE_ROLES,
  ADMIN_ROLES,
  FINANCE_WRITE_ROLES,
  FULL_UI_PERMISSIONS,
  intersectPermissions,
  isRoleIn,
  NO_UI_PERMISSIONS,
  READ_ONLY_UI_PERMISSIONS,
  STAFF_WRITE_ROLES,
  type UIPermissions,
} from "../ui-permissions"

// ---------------------------------------------------------------------------
// Role × bucket matrix — one source of truth for "who's in what bucket"
// ---------------------------------------------------------------------------

const ROLE_BUCKETS = {
  ADMIN_ROLES,
  STAFF_WRITE_ROLES,
  ACADEMIC_WRITE_ROLES,
  FINANCE_WRITE_ROLES,
} as const

// Expected membership per role × bucket. Reading this table answers
// "which roles can write what" without grepping the codebase.
const EXPECTED_MEMBERSHIP: Record<
  Role,
  Record<keyof typeof ROLE_BUCKETS, boolean>
> = {
  DEVELOPER: {
    ADMIN_ROLES: true,
    STAFF_WRITE_ROLES: true,
    ACADEMIC_WRITE_ROLES: true,
    FINANCE_WRITE_ROLES: true,
  },
  ADMIN: {
    ADMIN_ROLES: true,
    STAFF_WRITE_ROLES: true,
    ACADEMIC_WRITE_ROLES: true,
    FINANCE_WRITE_ROLES: true,
  },
  TEACHER: {
    ADMIN_ROLES: false,
    STAFF_WRITE_ROLES: false,
    ACADEMIC_WRITE_ROLES: true,
    FINANCE_WRITE_ROLES: false,
  },
  STUDENT: {
    ADMIN_ROLES: false,
    STAFF_WRITE_ROLES: false,
    ACADEMIC_WRITE_ROLES: false,
    FINANCE_WRITE_ROLES: false,
  },
  GUARDIAN: {
    ADMIN_ROLES: false,
    STAFF_WRITE_ROLES: false,
    ACADEMIC_WRITE_ROLES: false,
    FINANCE_WRITE_ROLES: false,
  },
  ACCOUNTANT: {
    ADMIN_ROLES: false,
    STAFF_WRITE_ROLES: false,
    ACADEMIC_WRITE_ROLES: false,
    FINANCE_WRITE_ROLES: true,
  },
  STAFF: {
    ADMIN_ROLES: false,
    STAFF_WRITE_ROLES: true,
    ACADEMIC_WRITE_ROLES: false,
    FINANCE_WRITE_ROLES: false,
  },
  USER: {
    ADMIN_ROLES: false,
    STAFF_WRITE_ROLES: false,
    ACADEMIC_WRITE_ROLES: false,
    FINANCE_WRITE_ROLES: false,
  },
}

// ---------------------------------------------------------------------------
// isRoleIn — null-safety + matrix
// ---------------------------------------------------------------------------

describe("isRoleIn", () => {
  it("returns false for null or undefined (never blow up on a missing session)", () => {
    expect(isRoleIn(null, ADMIN_ROLES)).toBe(false)
    expect(isRoleIn(undefined, ADMIN_ROLES)).toBe(false)
  })

  it("returns false for a string that isn't a known Role", () => {
    expect(isRoleIn("SUPER_USER" as Role, ADMIN_ROLES)).toBe(false)
  })

  it("matches the EXPECTED_MEMBERSHIP table for every (role, bucket) pair", () => {
    for (const role of ALL_ROLES) {
      for (const bucketName of Object.keys(ROLE_BUCKETS) as Array<
        keyof typeof ROLE_BUCKETS
      >) {
        const bucket = ROLE_BUCKETS[bucketName]
        const expected = EXPECTED_MEMBERSHIP[role][bucketName]
        expect(
          isRoleIn(role, bucket),
          `role=${role} bucket=${bucketName}`
        ).toBe(expected)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// Canned permission constants — pin the shape so a future flag addition
// is intentional, not accidental.
// ---------------------------------------------------------------------------

describe("permission constants", () => {
  it("NO_UI_PERMISSIONS denies every action and marks readOnlyMode true", () => {
    expect(NO_UI_PERMISSIONS).toEqual({
      showAddButton: false,
      showImportButton: false,
      showExportButton: false,
      showBulkActions: false,
      showEditAction: false,
      showDeleteAction: false,
      showArchiveAction: false,
      showRestoreAction: false,
      showToggleStatus: false,
      readOnlyMode: true,
    })
  })

  it("FULL_UI_PERMISSIONS allows every action and clears readOnlyMode", () => {
    expect(FULL_UI_PERMISSIONS).toEqual({
      showAddButton: true,
      showImportButton: true,
      showExportButton: true,
      showBulkActions: true,
      showEditAction: true,
      showDeleteAction: true,
      showArchiveAction: true,
      showRestoreAction: true,
      showToggleStatus: true,
      readOnlyMode: false,
    })
  })

  it("READ_ONLY_UI_PERMISSIONS extends NONE with export only", () => {
    expect(READ_ONLY_UI_PERMISSIONS).toEqual({
      ...NO_UI_PERMISSIONS,
      showExportButton: true,
    })
    expect(READ_ONLY_UI_PERMISSIONS.readOnlyMode).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// intersectPermissions — AND for flags, OR for readOnlyMode
// ---------------------------------------------------------------------------

describe("intersectPermissions", () => {
  it("returns NO_UI_PERMISSIONS when ANDing NONE with FULL (deny wins)", () => {
    const out = intersectPermissions(NO_UI_PERMISSIONS, FULL_UI_PERMISSIONS)
    expect(out).toEqual(NO_UI_PERMISSIONS)
  })

  it("returns FULL_UI_PERMISSIONS when ANDing FULL with FULL", () => {
    const out = intersectPermissions(FULL_UI_PERMISSIONS, FULL_UI_PERMISSIONS)
    expect(out).toEqual(FULL_UI_PERMISSIONS)
  })

  it("AND-s the action flags (deny in either side denies the result)", () => {
    const a: UIPermissions = { ...FULL_UI_PERMISSIONS, showDeleteAction: false }
    const b: UIPermissions = { ...FULL_UI_PERMISSIONS, showImportButton: false }
    const out = intersectPermissions(a, b)
    expect(out.showDeleteAction).toBe(false)
    expect(out.showImportButton).toBe(false)
    expect(out.showAddButton).toBe(true)
    expect(out.showEditAction).toBe(true)
  })

  it("OR-s readOnlyMode (read-only in either side makes the result read-only)", () => {
    const writable: UIPermissions = {
      ...FULL_UI_PERMISSIONS,
      readOnlyMode: false,
    }
    const readonly: UIPermissions = {
      ...FULL_UI_PERMISSIONS,
      readOnlyMode: true,
    }
    expect(intersectPermissions(writable, readonly).readOnlyMode).toBe(true)
    expect(intersectPermissions(readonly, writable).readOnlyMode).toBe(true)
    expect(intersectPermissions(writable, writable).readOnlyMode).toBe(false)
  })

  it("is commutative — intersect(a,b) == intersect(b,a)", () => {
    const a: UIPermissions = {
      ...FULL_UI_PERMISSIONS,
      showDeleteAction: false,
      readOnlyMode: false,
    }
    const b: UIPermissions = {
      ...NO_UI_PERMISSIONS,
      showExportButton: true,
      readOnlyMode: true,
    }
    expect(intersectPermissions(a, b)).toEqual(intersectPermissions(b, a))
  })
})
