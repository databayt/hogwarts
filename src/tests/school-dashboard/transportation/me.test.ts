// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getMyTransportationView } from "@/components/school-dashboard/transportation/actions/me"

// Mock dependencies. Only @/auth + @/lib/tenant-context drive requireContext;
// authorization.ts is pure and intentionally NOT mocked.
vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    guardian: {
      findFirst: vi.fn(),
    },
    studentGuardian: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const SCHOOL_A = "school-A"
const SCHOOL_B = "school-B"

function mockUser(
  role: string,
  schoolId: string | null = SCHOOL_A,
  userId = "user-1"
) {
  vi.mocked(auth).mockResolvedValue({ user: { id: userId, role } } as never)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId,
    requestId: null,
    role,
    isPlatformAdmin: role === "DEVELOPER",
  } as never)
}

// A fully-populated student row in the shape db.student.findMany selects.
function studentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "stu-1",
    firstName: "Harry",
    lastName: "Potter",
    routeAssignments: [
      {
        id: "asg-1",
        routeId: "route-1",
        direction: "PICKUP",
        status: "ACTIVE",
        route: {
          name: "North Loop",
          code: "NL-01",
          vehicle: { id: "veh-1", plateNumber: "ABC-123" },
          driver: {
            id: "drv-1",
            firstName: "Hagrid",
            lastName: "Keeper",
            phone: "555-0100",
          },
        },
        stop: { name: "Privet Drive", stopOrder: 2 },
      },
    ],
    tripBoardings: [
      {
        status: "BOARDED",
        trip: {
          id: "trip-1",
          scheduledDate: new Date("2026-05-01T00:00:00Z"),
          scheduledTime: "07:30",
          status: "COMPLETED",
        },
      },
    ],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getMyTransportationView", () => {
  // --------------------------------------------------------------------------
  // Auth / tenant guards (from requireContext)
  // --------------------------------------------------------------------------
  describe("auth + tenant guards", () => {
    it("returns NOT_AUTHENTICATED when there is no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as never)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL_A,
        requestId: null,
        role: null,
        isPlatformAdmin: false,
      } as never)

      const result = await getMyTransportationView()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("NOT_AUTHENTICATED")
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.student.findMany).not.toHaveBeenCalled()
    })

    it("returns MISSING_SCHOOL when session exists but no schoolId", async () => {
      mockUser("STUDENT", null)

      const result = await getMyTransportationView()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("MISSING_SCHOOL")
      expect(db.student.findFirst).not.toHaveBeenCalled()
    })

    it("returns UNAUTHORIZED when role lacks read_own (ACCOUNTANT)", async () => {
      // ACCOUNTANT is absent from the read_own matrix row entirely.
      mockUser("ACCOUNTANT")

      const result = await getMyTransportationView()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.guardian.findFirst).not.toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // STUDENT branch
  // --------------------------------------------------------------------------
  describe("STUDENT role", () => {
    it("resolves the student row scoped by schoolId+userId and returns one mapped child", async () => {
      mockUser("STUDENT", SCHOOL_A, "user-student")
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "stu-1",
      } as never)
      vi.mocked(db.student.findMany).mockResolvedValue([studentRow()] as never)

      const result = await getMyTransportationView()

      // findFirst is schoolId + userId scoped, selecting only id
      expect(db.student.findFirst).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_A, userId: "user-student" },
        select: { id: true },
      })

      // final findMany is schoolId-scoped and filtered to the resolved id
      expect(db.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_A,
            id: { in: ["stu-1"] },
          }),
        })
      )
      // never queries the other tenant
      expect(db.student.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_B }),
        })
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(1)
        expect(result.data[0]).toMatchObject({
          studentId: "stu-1",
          firstName: "Harry",
          lastName: "Potter",
        })
      }
    })

    it("maps assignments and recentTrips exactly from the selected relations", async () => {
      mockUser("STUDENT", SCHOOL_A, "user-student")
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "stu-1",
      } as never)
      vi.mocked(db.student.findMany).mockResolvedValue([studentRow()] as never)

      const result = await getMyTransportationView()

      expect(result.success).toBe(true)
      if (!result.success) return
      const child = result.data[0]

      expect(child.assignments).toEqual([
        {
          id: "asg-1",
          routeId: "route-1",
          routeName: "North Loop",
          routeCode: "NL-01",
          stopName: "Privet Drive",
          stopOrder: 2,
          direction: "PICKUP",
          status: "ACTIVE",
          vehicle: { id: "veh-1", plateNumber: "ABC-123" },
          driver: {
            id: "drv-1",
            firstName: "Hagrid",
            lastName: "Keeper",
            phone: "555-0100",
          },
        },
      ])

      expect(child.recentTrips).toEqual([
        {
          tripId: "trip-1",
          scheduledDate: new Date("2026-05-01T00:00:00Z"),
          scheduledTime: "07:30",
          status: "COMPLETED",
          boardingStatus: "BOARDED",
        },
      ])
    })

    it("coalesces a missing vehicle/driver on the route to null", async () => {
      mockUser("STUDENT", SCHOOL_A, "user-student")
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "stu-1",
      } as never)
      vi.mocked(db.student.findMany).mockResolvedValue([
        studentRow({
          routeAssignments: [
            {
              id: "asg-2",
              routeId: "route-2",
              direction: "DROPOFF",
              status: "ACTIVE",
              route: {
                name: "South Loop",
                code: null,
                vehicle: null,
                driver: null,
              },
              stop: { name: "Hogsmeade", stopOrder: 1 },
            },
          ],
          tripBoardings: [],
        }),
      ] as never)

      const result = await getMyTransportationView()

      expect(result.success).toBe(true)
      if (!result.success) return
      const child = result.data[0]
      expect(child.assignments[0].vehicle).toBeNull()
      expect(child.assignments[0].driver).toBeNull()
      expect(child.assignments[0].routeCode).toBeNull()
      expect(child.recentTrips).toEqual([])
    })

    it("returns an empty array (no findMany) when the user has no student row", async () => {
      mockUser("STUDENT", SCHOOL_A, "user-student")
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await getMyTransportationView()

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual([])
      // studentIds stayed empty → short-circuit before the heavy findMany
      expect(db.student.findMany).not.toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // GUARDIAN branch
  // --------------------------------------------------------------------------
  describe("GUARDIAN role", () => {
    it("resolves guardian → links → students, scoping every query by schoolId", async () => {
      mockUser("GUARDIAN", SCHOOL_A, "user-guardian")
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "grd-1",
      } as never)
      vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
        { studentId: "stu-1" },
        { studentId: "stu-2" },
      ] as never)
      vi.mocked(db.student.findMany).mockResolvedValue([
        studentRow({ id: "stu-1", firstName: "Harry", lastName: "Potter" }),
        studentRow({
          id: "stu-2",
          firstName: "Ron",
          lastName: "Weasley",
          routeAssignments: [],
          tripBoardings: [],
        }),
      ] as never)

      const result = await getMyTransportationView()

      // guardian lookup scoped by schoolId + userId
      expect(db.guardian.findFirst).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_A, userId: "user-guardian" },
        select: { id: true },
      })
      // link lookup scoped by schoolId + the resolved guardianId
      expect(db.studentGuardian.findMany).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_A, guardianId: "grd-1" },
        select: { studentId: true },
      })
      // final student fetch scoped by schoolId, filtered to the linked ids
      expect(db.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_A,
            id: { in: ["stu-1", "stu-2"] },
          }),
        })
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toHaveLength(2)
        expect(result.data.map((c) => c.studentId)).toEqual(["stu-1", "stu-2"])
        expect(result.data[1]).toMatchObject({
          studentId: "stu-2",
          firstName: "Ron",
          lastName: "Weasley",
          assignments: [],
          recentTrips: [],
        })
      }
    })

    it("returns an empty array when the user has no guardian row", async () => {
      mockUser("GUARDIAN", SCHOOL_A, "user-guardian")
      vi.mocked(db.guardian.findFirst).mockResolvedValue(null)

      const result = await getMyTransportationView()

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual([])
      expect(db.studentGuardian.findMany).not.toHaveBeenCalled()
      expect(db.student.findMany).not.toHaveBeenCalled()
    })

    it("returns an empty array when the guardian has no linked children", async () => {
      mockUser("GUARDIAN", SCHOOL_A, "user-guardian")
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "grd-1",
      } as never)
      vi.mocked(db.studentGuardian.findMany).mockResolvedValue([] as never)

      const result = await getMyTransportationView()

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual([])
      // links resolved to empty → short-circuit before findMany
      expect(db.student.findMany).not.toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // DEVELOPER / ADMIN QA path
  // --------------------------------------------------------------------------
  describe("DEVELOPER / ADMIN QA path", () => {
    it("DEVELOPER returns success with empty data and touches no db", async () => {
      mockUser("DEVELOPER", SCHOOL_A, "dev-1")

      const result = await getMyTransportationView()

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual([])
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.student.findMany).not.toHaveBeenCalled()
      expect(db.guardian.findFirst).not.toHaveBeenCalled()
    })

    it("ADMIN returns success with empty data and touches no db", async () => {
      mockUser("ADMIN", SCHOOL_A, "admin-1")

      const result = await getMyTransportationView()

      expect(result.success).toBe(true)
      if (result.success) expect(result.data).toEqual([])
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.student.findMany).not.toHaveBeenCalled()
      expect(db.guardian.findFirst).not.toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // Allowed-but-unhandled roles (read_own permits them, but the role branch
  // has no handler → falls through to the UNAUTHORIZED else).
  // --------------------------------------------------------------------------
  describe("allowed-but-unhandled roles fall through to UNAUTHORIZED", () => {
    it("STAFF passes read_own permission but hits the UNAUTHORIZED else branch", async () => {
      mockUser("STAFF", SCHOOL_A, "staff-1")

      const result = await getMyTransportationView()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
      // never reaches any data resolution
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.guardian.findFirst).not.toHaveBeenCalled()
      expect(db.student.findMany).not.toHaveBeenCalled()
    })

    it("TEACHER passes read_own permission but hits the UNAUTHORIZED else branch", async () => {
      mockUser("TEACHER", SCHOOL_A, "teacher-1")

      const result = await getMyTransportationView()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("UNAUTHORIZED")
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.student.findMany).not.toHaveBeenCalled()
    })
  })

  // --------------------------------------------------------------------------
  // Error path
  // --------------------------------------------------------------------------
  describe("error handling", () => {
    it("returns LOAD_FAILED when the final findMany throws", async () => {
      mockUser("STUDENT", SCHOOL_A, "user-student")
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "stu-1",
      } as never)
      vi.mocked(db.student.findMany).mockRejectedValue(new Error("db down"))

      const result = await getMyTransportationView()

      expect(result.success).toBe(false)
      if (!result.success) expect(result.error).toBe("LOAD_FAILED")
    })
  })
})
