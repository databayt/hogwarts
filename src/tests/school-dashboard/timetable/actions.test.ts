// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  applyTemplateToTerm,
  cancelSubstitution,
  deletePeriod,
  deleteScheduleException,
  detectTimetableConflicts,
  getWeeklyTimetable,
  moveTimetableSlot,
  respondToSubstitution,
  setActiveTerm,
  suggestFreeSlots,
  updatePeriod,
  updateScheduleException,
  updateTeacherAbsence,
  updateTermDates,
  upsertRoomConstraints,
  upsertTeacherConstraints,
  upsertTimetableSlot,
} from "@/components/school-dashboard/timetable/actions"

// ---------------------------------------------------------------------------
// Test CUIDs (c + 24 lowercase alphanumeric = 25 chars, matches /^c[a-z0-9]{24}$/)
// ---------------------------------------------------------------------------

const CTERM1 = "caaaaaaaaaaaaaaaaaaa00001"
const CPERIOD1 = "caaaaaaaaaaaaaaaaaaa00002"
const CPERIOD2 = "caaaaaaaaaaaaaaaaaaa00003"
const CCLASS1 = "caaaaaaaaaaaaaaaaaaa00004"
const CCLASS2 = "caaaaaaaaaaaaaaaaaaa00005"
const CTEACHER1 = "caaaaaaaaaaaaaaaaaaa00006"
const CROOM1 = "caaaaaaaaaaaaaaaaaaa00007"
const CROOM2 = "caaaaaaaaaaaaaaaaaaa00008"
const CSECTION1 = "caaaaaaaaaaaaaaaaaaa00009"
const CSUBJECT1 = "caaaaaaaaaaaaaaaaaaa00010"
const CGRADE1 = "caaaaaaaaaaaaaaaaaaa00011"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", schoolId: "school-123", role: "ADMIN" },
  }),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    timetable: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    term: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    period: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    schoolWeekConfig: {
      findFirst: vi.fn(),
    },
    scheduleException: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    teacherConstraint: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    roomConstraint: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    teacherAbsence: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    substitutionRecord: {
      findFirst: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    timetableTemplate: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    templateApplication: {
      create: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
    },
    classroom: {
      findFirst: vi.fn(),
    },
    section: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    subjectSelection: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    teacherSubjectExpertise: {
      findFirst: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    studentClass: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    school: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    teacherUnavailableBlock: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
  },
}))

// Mock permissions — let all permission guards pass by default
vi.mock("@/components/school-dashboard/timetable/permissions", () => ({
  requireAdminAccess: vi.fn().mockResolvedValue(undefined),
  requireReadAccess: vi.fn().mockResolvedValue(undefined),
  requirePermission: vi.fn().mockResolvedValue(undefined),
  getPermissionContext: vi.fn().mockResolvedValue({
    userId: "user-1",
    schoolId: "school-123",
    role: "ADMIN",
    canView: true,
    canModify: true,
  }),
  logTimetableAction: vi.fn().mockResolvedValue({}),
  filterTimetableByRole: vi.fn().mockImplementation((data: unknown) => data),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn(),
}))

vi.mock("@/components/school-dashboard/timetable/generate/algorithm", () => ({
  generateTimetable: vi.fn(),
}))

// NOTE: @/lib/prisma-guards is NOT mocked — the real getModel/getModelOrThrow
// reads from the mocked db above, so all model lookups work correctly.

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SCHOOL_ID = "school-123"

function mockTenantAdmin() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "test-school",
    role: "ADMIN",
    locale: "en",
  })
}

function mockNoSchool() {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null as any,
    subdomain: "",
    role: "ADMIN",
    locale: "en",
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Timetable Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTenantAdmin()
  })

  // =========================================================================
  // getWeeklyTimetable
  // =========================================================================

  describe("getWeeklyTimetable", () => {
    it("formats weekly timetable with days and lunchAfterPeriod", async () => {
      vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue({
        workingDays: [0, 1, 2, 3, 4],
        defaultLunchAfterPeriod: 2,
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        yearId: "year1",
      } as any)
      vi.mocked(db.period.findMany).mockResolvedValue([
        {
          id: CPERIOD1,
          name: "Period 1",
          startTime: new Date("1970-01-01T08:00:00Z"),
          endTime: new Date("1970-01-01T08:45:00Z"),
        },
        {
          id: CPERIOD2,
          name: "Period 2",
          startTime: new Date("1970-01-01T08:50:00Z"),
          endTime: new Date("1970-01-01T09:35:00Z"),
        },
      ] as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([
        {
          dayOfWeek: 0,
          periodId: CPERIOD1,
          class: {
            id: CCLASS1,
            name: "Math 10",
            subject: { name: "Math" },
            teacher: { firstName: "Alan", lastName: "Turing" },
          },
          teacher: { firstName: "Alan", lastName: "Turing" },
        },
      ] as any)

      const res = await getWeeklyTimetable({ termId: CTERM1 })

      expect(Array.isArray(res.days)).toBe(true)
      expect(res.day_time.length).toBe(2)
      expect(res.timetable.length).toBeGreaterThan(0)
      expect(
        typeof res.lunchAfterPeriod === "number" ||
          res.lunchAfterPeriod === null
      ).toBe(true)
    })

    it("scopes query by schoolId", async () => {
      vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue({
        workingDays: [0, 1, 2, 3, 4],
        defaultLunchAfterPeriod: 2,
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        yearId: "year1",
      } as any)
      vi.mocked(db.period.findMany).mockResolvedValue([
        {
          id: CPERIOD1,
          name: "Period 1",
          startTime: new Date("1970-01-01T08:00:00Z"),
          endTime: new Date("1970-01-01T08:45:00Z"),
        },
      ] as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([] as any)

      await getWeeklyTimetable({ termId: CTERM1 })

      const call = vi.mocked(db.timetable.findMany).mock.calls[0]?.[0] as any
      expect(call?.where?.schoolId).toBe(SCHOOL_ID)
    })

    it("STUDENT with only a section placement sees section-based slots", async () => {
      // Student role — no StudentClass enrollments, only Student.sectionId
      const { getPermissionContext } =
        await import("@/components/school-dashboard/timetable/permissions")
      vi.mocked(getPermissionContext).mockResolvedValueOnce({
        userId: "user-1",
        schoolId: SCHOOL_ID,
        role: "STUDENT",
        canView: true,
        canModify: false,
      } as any)

      vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue({
        workingDays: [0, 1, 2, 3, 4],
        defaultLunchAfterPeriod: 2,
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        yearId: "year1",
      } as any)
      vi.mocked(db.period.findMany).mockResolvedValue([
        {
          id: CPERIOD1,
          name: "Period 1",
          startTime: new Date("1970-01-01T08:00:00Z"),
          endTime: new Date("1970-01-01T08:45:00Z"),
        },
      ] as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
        sectionId: CSECTION1,
      } as any)
      vi.mocked(db.studentClass.findMany).mockResolvedValue([] as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([] as any)

      await getWeeklyTimetable({ termId: CTERM1 })

      const call = vi.mocked(db.timetable.findMany).mock.calls[0]?.[0] as any
      // Section-based slots must be reachable for section-placed students
      expect(call?.where?.OR).toEqual([{ sectionId: CSECTION1 }])
    })

    it("STUDENT with both enrollments and a section sees the union", async () => {
      const { getPermissionContext } =
        await import("@/components/school-dashboard/timetable/permissions")
      vi.mocked(getPermissionContext).mockResolvedValueOnce({
        userId: "user-1",
        schoolId: SCHOOL_ID,
        role: "STUDENT",
        canView: true,
        canModify: false,
      } as any)

      vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue({
        workingDays: [0, 1, 2, 3, 4],
        defaultLunchAfterPeriod: 2,
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        yearId: "year1",
      } as any)
      vi.mocked(db.period.findMany).mockResolvedValue([
        {
          id: CPERIOD1,
          name: "Period 1",
          startTime: new Date("1970-01-01T08:00:00Z"),
          endTime: new Date("1970-01-01T08:45:00Z"),
        },
      ] as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "student-1",
        sectionId: CSECTION1,
      } as any)
      vi.mocked(db.studentClass.findMany).mockResolvedValue([
        { classId: CCLASS1 },
        { classId: CCLASS2 },
      ] as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([] as any)

      await getWeeklyTimetable({ termId: CTERM1 })

      const call = vi.mocked(db.timetable.findMany).mock.calls[0]?.[0] as any
      expect(call?.where?.OR).toEqual([
        { classId: { in: [CCLASS1, CCLASS2] } },
        { sectionId: CSECTION1 },
      ])
    })

    it("resolves schedule config days and lunch correctly", async () => {
      vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue({
        workingDays: [0, 2, 4],
        defaultLunchAfterPeriod: 3,
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        yearId: "y1",
      } as any)
      vi.mocked(db.period.findMany).mockResolvedValue([
        {
          id: CPERIOD1,
          name: "P1",
          startTime: new Date("1970-01-01T07:00:00Z"),
          endTime: new Date("1970-01-01T07:45:00Z"),
        },
        {
          id: CPERIOD2,
          name: "P2",
          startTime: new Date("1970-01-01T07:50:00Z"),
          endTime: new Date("1970-01-01T08:35:00Z"),
        },
      ] as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([] as any)

      const res = await getWeeklyTimetable({ termId: CTERM1 })

      expect(res.days).toEqual([0, 2, 4])
      expect(res.lunchAfterPeriod).toBe(3)
    })
  })

  // =========================================================================
  // suggestFreeSlots
  // =========================================================================

  describe("suggestFreeSlots", () => {
    it("suggests free slots for a teacher", async () => {
      vi.mocked(db.schoolWeekConfig.findFirst).mockResolvedValue({
        workingDays: [0, 1, 2, 3, 4],
        defaultLunchAfterPeriod: null,
      } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        yearId: "year1",
      } as any)
      vi.mocked(db.period.findMany).mockResolvedValue([
        {
          id: CPERIOD1,
          name: "Period 1",
          startTime: new Date("1970-01-01T08:00:00Z"),
          endTime: new Date("1970-01-01T08:45:00Z"),
        },
        {
          id: CPERIOD2,
          name: "Period 2",
          startTime: new Date("1970-01-01T08:50:00Z"),
          endTime: new Date("1970-01-01T09:35:00Z"),
        },
      ] as any)
      vi.mocked(db.timetable.findMany).mockResolvedValue([
        { dayOfWeek: 0, periodId: CPERIOD1 },
      ] as any)

      const res = await suggestFreeSlots({
        termId: CTERM1,
        teacherId: CTEACHER1,
      })

      expect(res.suggestions.some((s: any) => s.periodId === CPERIOD2)).toBe(
        true
      )
    })
  })

  // =========================================================================
  // detectTimetableConflicts
  // =========================================================================

  describe("detectTimetableConflicts", () => {
    it("detects teacher conflict when same teacher occupies same time", async () => {
      // $queryRaw is called for teacher conflicts then classroom conflicts
      vi.mocked(db.$queryRaw)
        // First call: teacher conflicts — return a conflict row
        .mockResolvedValueOnce([
          {
            dayOfWeek: 0,
            periodId: CPERIOD1,
            teacherId: CTEACHER1,
            slot_count: BigInt(2),
          },
        ])
        // Second call: classroom conflicts — no conflicts
        .mockResolvedValueOnce([])

      // findMany is called for detailed slot data when conflicts are found
      vi.mocked(db.timetable.findMany).mockResolvedValueOnce([
        {
          dayOfWeek: 0,
          periodId: CPERIOD1,
          class: { id: CCLASS1, name: "Class 1" },
          teacherId: CTEACHER1,
          teacher: { firstName: "A", lastName: "B" },
          classroomId: CROOM1,
          classroom: { roomName: "R1" },
        },
        {
          dayOfWeek: 0,
          periodId: CPERIOD1,
          class: { id: CCLASS2, name: "Class 2" },
          teacherId: CTEACHER1,
          teacher: { firstName: "A", lastName: "B" },
          classroomId: CROOM2,
          classroom: { roomName: "R2" },
        },
      ] as any)

      const res = await detectTimetableConflicts({ termId: CTERM1 })

      expect(res.conflicts.some((c: any) => c.type === "TEACHER")).toBe(true)
    })
  })

  // =========================================================================
  // upsertTimetableSlot
  // =========================================================================

  describe("upsertTimetableSlot", () => {
    function mockSectionUpsertHappyPath() {
      // Section must exist in this school
      vi.mocked(db.section.findFirst).mockResolvedValue({
        id: CSECTION1,
        name: "Grade 1-A",
        gradeId: CGRADE1,
      } as any)
      // Subject is in the grade's active selection (no warning path)
      vi.mocked(db.subjectSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      // Teacher is qualified for the subject
      vi.mocked(db.teacherSubjectExpertise.findFirst).mockResolvedValue({
        id: "exp-1",
      } as any)
      // Constraint validation path
      vi.mocked(db.teacher.findFirst).mockResolvedValue({
        id: CTEACHER1,
        firstName: "A",
        lastName: "B",
      } as any)
      vi.mocked(db.teacherConstraint.findFirst).mockResolvedValue(null)
      vi.mocked(db.classroom.findFirst).mockResolvedValue({
        id: CROOM1,
        roomName: "Room 1",
        capacity: 30,
      } as any)
      vi.mocked(db.student.count).mockResolvedValue(20)
      vi.mocked(db.roomConstraint.findFirst).mockResolvedValue(null)
      // No conflicting slots
      vi.mocked(db.timetable.findMany).mockResolvedValue([] as any)
    }

    it("creates a section-based slot scoped by schoolId", async () => {
      mockSectionUpsertHappyPath()
      // No existing slot at this cell → create path
      vi.mocked(db.timetable.findFirst).mockResolvedValue(null)
      vi.mocked(db.timetable.create).mockResolvedValue({ id: "tt1" } as any)

      await upsertTimetableSlot({
        termId: CTERM1,
        dayOfWeek: 0,
        periodId: CPERIOD1,
        sectionId: CSECTION1,
        subjectId: CSUBJECT1,
        teacherId: CTEACHER1,
        classroomId: CROOM1,
        weekOffset: 0,
      })

      expect(db.timetable.create).toHaveBeenCalled()
      const call = vi.mocked(db.timetable.create).mock.calls[0]?.[0] as any
      expect(call?.data?.schoolId).toBe(SCHOOL_ID)
      expect(call?.data?.sectionId).toBe(CSECTION1)
      expect(call?.data?.subjectId).toBe(CSUBJECT1)
      // No legacy classId written on new slots
      expect(call?.data?.classId).toBeUndefined()
    })

    it("updates an existing slot in place, backfilling section fields on legacy rows", async () => {
      mockSectionUpsertHappyPath()
      // Existing legacy row at this cell (classId set, no sectionId)
      vi.mocked(db.timetable.findFirst).mockResolvedValue({
        id: "tt-legacy",
        classId: CCLASS1,
      } as any)
      vi.mocked(db.timetable.update).mockResolvedValue({
        id: "tt-legacy",
      } as any)

      await upsertTimetableSlot({
        termId: CTERM1,
        dayOfWeek: 0,
        periodId: CPERIOD1,
        sectionId: CSECTION1,
        subjectId: CSUBJECT1,
        teacherId: CTEACHER1,
        classroomId: CROOM1,
        weekOffset: 0,
      })

      expect(db.timetable.create).not.toHaveBeenCalled()
      const call = vi.mocked(db.timetable.update).mock.calls[0]?.[0] as any
      expect(call?.where?.id).toBe("tt-legacy")
      expect(call?.data?.sectionId).toBe(CSECTION1)
      expect(call?.data?.subjectId).toBe(CSUBJECT1)
      // classId is preserved (not nulled) — exams/results history keeps its axis
      expect(call?.data?.classId).toBeUndefined()
    })

    it("throws SECTION_NOT_FOUND when section is not in this school", async () => {
      vi.mocked(db.section.findFirst).mockResolvedValue(null)

      await expect(
        upsertTimetableSlot({
          termId: CTERM1,
          dayOfWeek: 0,
          periodId: CPERIOD1,
          sectionId: CSECTION1,
          subjectId: CSUBJECT1,
          teacherId: CTEACHER1,
          classroomId: CROOM1,
          weekOffset: 0,
        })
      ).rejects.toThrow("SECTION_NOT_FOUND")
    })
  })

  // =========================================================================
  // deleteTimetableSlot — id-based delete works for section-based slots
  // =========================================================================

  describe("deleteTimetableSlot", () => {
    it("deletes a section-based slot by id (no classId required)", async () => {
      vi.mocked(db.timetable.findFirst).mockResolvedValue({
        id: "tt-section",
        dayOfWeek: 0,
        teacher: null,
        class: null,
        section: { name: "Grade 1-A" },
      } as any)
      vi.mocked(db.timetable.delete).mockResolvedValue({} as any)

      const { deleteTimetableSlot } =
        await import("@/components/school-dashboard/timetable/actions")
      await deleteTimetableSlot({ id: "tt-section" })

      expect(db.timetable.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "tt-section", schoolId: SCHOOL_ID },
        })
      )
      expect(db.timetable.delete).toHaveBeenCalledWith({
        where: { id: "tt-section" },
      })
    })

    it("throws SLOT_NOT_FOUND when id does not exist in this school", async () => {
      vi.mocked(db.timetable.findFirst).mockResolvedValue(null)

      const { deleteTimetableSlot } =
        await import("@/components/school-dashboard/timetable/actions")
      await expect(deleteTimetableSlot({ id: "tt-other" })).rejects.toThrow(
        "SLOT_NOT_FOUND"
      )
    })
  })

  // =========================================================================
  // moveTimetableSlot
  // =========================================================================

  describe("moveTimetableSlot", () => {
    it("moves slot with schoolId-scoped updateMany", async () => {
      // First findFirst: lookup existing slot
      vi.mocked(db.timetable.findFirst)
        .mockResolvedValueOnce({
          id: "slot-1",
          schoolId: SCHOOL_ID,
          termId: CTERM1,
          dayOfWeek: 0,
          periodId: CPERIOD1,
          classroomId: CROOM1,
          teacherId: CTEACHER1,
          classId: CCLASS1,
          weekOffset: 0,
          class: { id: CCLASS1, name: "Math" },
          teacher: { id: CTEACHER1, firstName: "A", lastName: "B" },
          classroom: { id: CROOM1, roomName: "Room 1" },
        } as any)
        // Second findFirst: conflict check at target position → no conflict
        .mockResolvedValueOnce(null)
      // No teacher/room conflicts for target slot
      vi.mocked(db.timetable.findMany).mockResolvedValue([] as any)
      vi.mocked(db.timetable.updateMany).mockResolvedValue({ count: 1 })
      // Teacher constraint check
      vi.mocked(db.teacher.findFirst).mockResolvedValue({
        id: CTEACHER1,
        firstName: "A",
        lastName: "B",
      } as any)
      vi.mocked(db.teacherConstraint.findFirst).mockResolvedValue(null)
      // Room constraint check — class info for student count
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: CCLASS1,
        _count: { studentClasses: 0 },
      } as any)
      vi.mocked(db.classroom.findFirst).mockResolvedValue({
        id: CROOM1,
        roomName: "Room 1",
        capacity: 30,
      } as any)
      vi.mocked(db.roomConstraint.findFirst).mockResolvedValue(null)

      const result = await moveTimetableSlot({
        slotId: "slot-1",
        targetDayOfWeek: 1,
        targetPeriodId: CPERIOD2,
      })

      expect(result.success).toBe(true)
      expect(result.slotId).toBe("slot-1")
      expect(db.timetable.updateMany).toHaveBeenCalledWith({
        where: { id: "slot-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          dayOfWeek: 1,
          periodId: CPERIOD2,
        }),
      })
    })

    it("throws when slot not found in school", async () => {
      vi.mocked(db.timetable.findFirst).mockResolvedValue(null)

      await expect(
        moveTimetableSlot({
          slotId: "slot-other-school",
          targetDayOfWeek: 1,
          targetPeriodId: CPERIOD2,
        })
      ).rejects.toThrow("SLOT_NOT_FOUND")
    })
  })

  // =========================================================================
  // setActiveTerm
  // =========================================================================

  describe("setActiveTerm", () => {
    it("deactivates all terms then activates target with schoolId scope", async () => {
      vi.mocked(db.term.updateMany).mockResolvedValue({ count: 1 })

      const result = await setActiveTerm({ termId: "term-1" })

      expect(result.success).toBe(true)
      // First call: deactivate all
      expect(db.term.updateMany).toHaveBeenCalledWith({
        where: { schoolId: SCHOOL_ID },
        data: { isActive: false },
      })
      // Second call: activate target with schoolId
      expect(db.term.updateMany).toHaveBeenCalledWith({
        where: { id: "term-1", schoolId: SCHOOL_ID },
        data: { isActive: true },
      })
    })

    it("throws when no school context", async () => {
      mockNoSchool()

      await expect(setActiveTerm({ termId: "term-1" })).rejects.toThrow(
        "MISSING_SCHOOL_CONTEXT"
      )
    })
  })

  // =========================================================================
  // updateTermDates
  // =========================================================================

  describe("updateTermDates", () => {
    it("updates term with schoolId-scoped updateMany after ownership check", async () => {
      vi.mocked(db.term.findFirst).mockResolvedValue({
        id: "term-1",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.term.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateTermDates({
        termId: "term-1",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-06-30"),
      })

      expect(result.success).toBe(true)
      expect(db.term.findFirst).toHaveBeenCalledWith({
        where: { id: "term-1", schoolId: SCHOOL_ID },
      })
      expect(db.term.updateMany).toHaveBeenCalledWith({
        where: { id: "term-1", schoolId: SCHOOL_ID },
        data: {
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-06-30"),
        },
      })
    })

    it("throws when term not found in school", async () => {
      vi.mocked(db.term.findFirst).mockResolvedValue(null)

      await expect(
        updateTermDates({
          termId: "term-other-school",
          startDate: new Date("2026-01-01"),
          endDate: new Date("2026-06-30"),
        })
      ).rejects.toThrow("TERM_NOT_FOUND")
    })

    it("throws when start date >= end date", async () => {
      await expect(
        updateTermDates({
          termId: "term-1",
          startDate: new Date("2026-06-30"),
          endDate: new Date("2026-01-01"),
        })
      ).rejects.toThrow("INVALID_DATE_RANGE")
    })
  })

  // =========================================================================
  // updatePeriod
  // =========================================================================

  describe("updatePeriod", () => {
    it("updates period with schoolId-scoped updateMany", async () => {
      vi.mocked(db.period.findFirst).mockResolvedValue({
        id: "period-1",
        schoolId: SCHOOL_ID,
        yearId: "year-1",
        name: "Period 1",
        startTime: new Date("1970-01-01T08:00:00Z"),
        endTime: new Date("1970-01-01T08:45:00Z"),
      } as any)
      // No overlapping periods
      vi.mocked(db.period.findMany).mockResolvedValue([] as any)
      vi.mocked(db.period.updateMany).mockResolvedValue({ count: 1 })

      const result = await updatePeriod({
        periodId: "period-1",
        name: "Period 1 Updated",
      })

      expect(result.success).toBe(true)
      expect(db.period.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "period-1", schoolId: SCHOOL_ID },
        })
      )
    })

    it("throws when period not found in school", async () => {
      vi.mocked(db.period.findFirst).mockResolvedValue(null)

      await expect(
        updatePeriod({ periodId: "period-other-school", name: "Updated" })
      ).rejects.toThrow("PERIOD_NOT_FOUND")
    })
  })

  // =========================================================================
  // deletePeriod (already correct — uses schoolId)
  // =========================================================================

  describe("deletePeriod", () => {
    it("deletes period with schoolId in where", async () => {
      vi.mocked(db.timetable.count).mockResolvedValue(0)

      const result = await deletePeriod({ periodId: "period-1" })

      expect(result.success).toBe(true)
      expect(db.period.delete).toHaveBeenCalledWith({
        where: { id: "period-1", schoolId: SCHOOL_ID },
      })
    })

    it("throws when period has timetable slots", async () => {
      vi.mocked(db.timetable.count).mockResolvedValue(5)

      await expect(deletePeriod({ periodId: "period-1" })).rejects.toThrow(
        "PERIOD_IN_USE"
      )
    })
  })

  // =========================================================================
  // updateScheduleException
  // =========================================================================

  describe("updateScheduleException", () => {
    it("updates with schoolId-scoped updateMany", async () => {
      vi.mocked(db.scheduleException.findFirst).mockResolvedValue({
        id: "exc-1",
        schoolId: SCHOOL_ID,
        startDate: new Date("2026-03-01"),
        endDate: new Date("2026-03-01"),
      } as any)
      vi.mocked(db.scheduleException.updateMany).mockResolvedValue({
        count: 1,
      })

      const result = await updateScheduleException({
        id: "exc-1",
        title: "Updated Holiday",
      })

      expect(result.success).toBe(true)
      expect(db.scheduleException.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "exc-1", schoolId: SCHOOL_ID },
        })
      )
    })

    it("throws when not found in school", async () => {
      vi.mocked(db.scheduleException.findFirst).mockResolvedValue(null)

      await expect(
        updateScheduleException({ id: "exc-other", title: "X" })
      ).rejects.toThrow("EXCEPTION_NOT_FOUND")
    })
  })

  // =========================================================================
  // deleteScheduleException
  // =========================================================================

  describe("deleteScheduleException", () => {
    it("deletes with schoolId-scoped deleteMany", async () => {
      vi.mocked(db.scheduleException.findFirst).mockResolvedValue({
        id: "exc-1",
        schoolId: SCHOOL_ID,
        title: "Holiday",
      } as any)
      vi.mocked(db.scheduleException.deleteMany).mockResolvedValue({
        count: 1,
      })

      const result = await deleteScheduleException({ id: "exc-1" })

      expect(result.success).toBe(true)
      expect(db.scheduleException.deleteMany).toHaveBeenCalledWith({
        where: { id: "exc-1", schoolId: SCHOOL_ID },
      })
    })

    it("throws when not found in school", async () => {
      vi.mocked(db.scheduleException.findFirst).mockResolvedValue(null)

      await expect(
        deleteScheduleException({ id: "exc-other" })
      ).rejects.toThrow("EXCEPTION_NOT_FOUND")
    })
  })

  // =========================================================================
  // upsertTeacherConstraints
  // =========================================================================

  describe("upsertTeacherConstraints", () => {
    it("creates new constraint with schoolId", async () => {
      vi.mocked(db.teacherConstraint.findFirst).mockResolvedValue(null)
      vi.mocked(db.teacherConstraint.create).mockResolvedValue({
        id: "tc-new",
      } as any)

      const result = await upsertTeacherConstraints({
        teacherId: "teacher-1",
        maxPeriodsPerDay: 6,
      })

      expect(result.id).toBe("tc-new")
      expect(db.teacherConstraint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          teacherId: "teacher-1",
        }),
      })
    })

    it("updates existing with schoolId-scoped updateMany", async () => {
      vi.mocked(db.teacherConstraint.findFirst).mockResolvedValue({
        id: "tc-existing",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.teacherConstraint.updateMany).mockResolvedValue({
        count: 1,
      })

      const result = await upsertTeacherConstraints({
        teacherId: "teacher-1",
        maxPeriodsPerDay: 5,
      })

      expect(result.id).toBe("tc-existing")
      expect(db.teacherConstraint.updateMany).toHaveBeenCalledWith({
        where: { id: "tc-existing", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          teacherId: "teacher-1",
        }),
      })
    })
  })

  // =========================================================================
  // upsertRoomConstraints
  // =========================================================================

  describe("upsertRoomConstraints", () => {
    it("creates new constraint with schoolId", async () => {
      vi.mocked(db.roomConstraint.findFirst).mockResolvedValue(null)
      vi.mocked(db.roomConstraint.create).mockResolvedValue({
        id: "rc-new",
      } as any)

      const result = await upsertRoomConstraints({
        classroomId: "room-1",
      })

      expect(result.id).toBe("rc-new")
      expect(db.roomConstraint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          classroomId: "room-1",
        }),
      })
    })

    it("updates existing with schoolId-scoped updateMany", async () => {
      vi.mocked(db.roomConstraint.findFirst).mockResolvedValue({
        id: "rc-existing",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.roomConstraint.updateMany).mockResolvedValue({ count: 1 })

      const result = await upsertRoomConstraints({
        classroomId: "room-1",
        strictCapacityLimit: false,
      })

      expect(result.id).toBe("rc-existing")
      expect(db.roomConstraint.updateMany).toHaveBeenCalledWith({
        where: { id: "rc-existing", schoolId: SCHOOL_ID },
        data: expect.objectContaining({
          schoolId: SCHOOL_ID,
          classroomId: "room-1",
        }),
      })
    })
  })

  // =========================================================================
  // updateTeacherAbsence
  // =========================================================================

  describe("updateTeacherAbsence", () => {
    it("updates with schoolId-scoped updateMany", async () => {
      vi.mocked(db.teacherAbsence.findFirst).mockResolvedValue({
        id: "abs-1",
        schoolId: SCHOOL_ID,
      } as any)
      vi.mocked(db.teacherAbsence.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateTeacherAbsence({
        id: "abs-1",
        status: "APPROVED",
      })

      expect(result.success).toBe(true)
      expect(db.teacherAbsence.updateMany).toHaveBeenCalledWith({
        where: { id: "abs-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({ status: "APPROVED" }),
      })
    })

    it("throws when absence not found", async () => {
      vi.mocked(db.teacherAbsence.findFirst).mockResolvedValue(null)

      await expect(
        updateTeacherAbsence({ id: "abs-other", status: "APPROVED" })
      ).rejects.toThrow("ABSENCE_NOT_FOUND")
    })
  })

  // =========================================================================
  // respondToSubstitution
  // =========================================================================

  describe("respondToSubstitution", () => {
    it("updates with schoolId-scoped updateMany", async () => {
      vi.mocked(db.substitutionRecord.findFirst).mockResolvedValue({
        id: "sub-1",
        schoolId: SCHOOL_ID,
        status: "PENDING",
      } as any)
      vi.mocked(db.substitutionRecord.updateMany).mockResolvedValue({
        count: 1,
      })

      const result = await respondToSubstitution({
        id: "sub-1",
        response: "CONFIRMED",
      })

      expect(result.success).toBe(true)
      expect(db.substitutionRecord.updateMany).toHaveBeenCalledWith({
        where: { id: "sub-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({ status: "CONFIRMED" }),
      })
    })

    it("throws when record not found", async () => {
      vi.mocked(db.substitutionRecord.findFirst).mockResolvedValue(null)

      await expect(
        respondToSubstitution({ id: "sub-other", response: "CONFIRMED" })
      ).rejects.toThrow("SUBSTITUTION_NOT_FOUND")
    })

    it("throws when status is not PENDING", async () => {
      vi.mocked(db.substitutionRecord.findFirst).mockResolvedValue({
        id: "sub-1",
        schoolId: SCHOOL_ID,
        status: "COMPLETED",
      } as any)

      await expect(
        respondToSubstitution({ id: "sub-1", response: "CONFIRMED" })
      ).rejects.toThrow("SUBSTITUTION_NOT_PENDING")
    })
  })

  // =========================================================================
  // cancelSubstitution
  // =========================================================================

  describe("cancelSubstitution", () => {
    it("updates with schoolId-scoped updateMany", async () => {
      vi.mocked(db.substitutionRecord.findFirst).mockResolvedValue({
        id: "sub-1",
        schoolId: SCHOOL_ID,
        status: "PENDING",
        notes: null,
      } as any)
      vi.mocked(db.substitutionRecord.updateMany).mockResolvedValue({
        count: 1,
      })

      const result = await cancelSubstitution({ id: "sub-1" })

      expect(result.success).toBe(true)
      expect(db.substitutionRecord.updateMany).toHaveBeenCalledWith({
        where: { id: "sub-1", schoolId: SCHOOL_ID },
        data: expect.objectContaining({ status: "CANCELLED" }),
      })
    })

    it("throws when record not found", async () => {
      vi.mocked(db.substitutionRecord.findFirst).mockResolvedValue(null)

      await expect(cancelSubstitution({ id: "sub-other" })).rejects.toThrow(
        "SUBSTITUTION_NOT_FOUND"
      )
    })

    it("throws when status is COMPLETED", async () => {
      vi.mocked(db.substitutionRecord.findFirst).mockResolvedValue({
        id: "sub-1",
        schoolId: SCHOOL_ID,
        status: "COMPLETED",
      } as any)

      await expect(cancelSubstitution({ id: "sub-1" })).rejects.toThrow(
        "SUBSTITUTION_ALREADY_COMPLETED"
      )
    })
  })

  // =========================================================================
  // applyTemplateToTerm
  // =========================================================================

  describe("applyTemplateToTerm", () => {
    it("verifies template lookup includes schoolId", async () => {
      vi.mocked(db.timetableTemplate.findFirst).mockResolvedValue({
        slotPatterns: [],
        workingDays: [0, 1, 2, 3, 4],
      } as any)
      vi.mocked(db.templateApplication.create).mockResolvedValue({} as any)

      await applyTemplateToTerm({
        templateId: "tpl-1",
        targetTermId: "term-1",
      })

      expect(db.timetableTemplate.findFirst).toHaveBeenCalledWith({
        where: { id: "tpl-1", schoolId: SCHOOL_ID },
        select: { slotPatterns: true, workingDays: true },
      })
    })

    it("throws when template not found", async () => {
      vi.mocked(db.timetableTemplate.findFirst).mockResolvedValue(null)

      await expect(
        applyTemplateToTerm({
          templateId: "tpl-other-school",
          targetTermId: "term-1",
        })
      ).rejects.toThrow("TEMPLATE_NOT_FOUND")
    })
  })
})
