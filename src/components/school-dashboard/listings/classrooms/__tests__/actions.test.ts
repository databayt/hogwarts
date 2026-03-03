// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  createClassroom,
  deleteClassroom,
  getClassroom,
  getClassrooms,
  getClassroomTypes,
  updateClassroom,
} from "../actions"

// Mock dependencies
vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    classroom: {
      create: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    classroomType: {
      findMany: vi.fn(),
    },
    class: {
      count: vi.fn(),
    },
    timetable: {
      count: vi.fn(),
    },
    roomConstraint: {
      count: vi.fn(),
    },
    school: {
      findUnique: vi.fn(),
    },
    academicGrade: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Classroom Actions", () => {
  const mockSchoolId = "school-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: { id: "admin-1", role: "ADMIN", schoolId: mockSchoolId },
    } as any)
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "ADMIN",
      locale: "en",
    })
  })

  // ===========================================================================
  // getClassrooms
  // ===========================================================================

  describe("getClassrooms", () => {
    it("fetches classrooms scoped to schoolId", async () => {
      const mockRows = [
        {
          id: "room-1",
          roomName: "Lab A",
          capacity: 30,
          typeId: "type-1",
          classroomType: { id: "type-1", name: "Laboratory" },
          _count: { classes: 2, timetables: 5 },
          createdAt: new Date("2025-01-01"),
        },
        {
          id: "room-2",
          roomName: "Hall B",
          capacity: 100,
          typeId: "type-2",
          classroomType: { id: "type-2", name: "Lecture Hall" },
          _count: { classes: 0, timetables: 1 },
          createdAt: new Date("2025-02-01"),
        },
      ]

      vi.mocked(db.classroom.findMany).mockResolvedValue(mockRows as any)
      vi.mocked(db.classroom.count).mockResolvedValue(2)

      const result = await getClassrooms({})

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)

      // Verify schoolId was passed in the where clause
      const findManyCall = vi.mocked(db.classroom.findMany).mock.calls[0][0]
      expect(findManyCall?.where).toHaveProperty("schoolId", mockSchoolId)
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getClassrooms({})

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing school")
    })

    it("maps response fields correctly", async () => {
      const mockRow = {
        id: "room-1",
        roomName: "Lab A",
        capacity: 30,
        typeId: "type-1",
        classroomType: { id: "type-1", name: "Laboratory" },
        _count: { classes: 3, timetables: 7 },
        createdAt: new Date("2025-06-15"),
      }

      vi.mocked(db.classroom.findMany).mockResolvedValue([mockRow] as any)
      vi.mocked(db.classroom.count).mockResolvedValue(1)

      const result = await getClassrooms({})

      expect(result.success).toBe(true)
      const item = result.data![0]
      expect(item.id).toBe("room-1")
      expect(item.roomName).toBe("Lab A")
      expect(item.capacity).toBe(30)
      expect(item.typeName).toBe("Laboratory")
      expect(item.classCount).toBe(3)
      expect(item.timetableCount).toBe(7)
      expect(item.createdAt).toBe(new Date("2025-06-15").toISOString())
    })
  })

  // ===========================================================================
  // getClassroomTypes
  // ===========================================================================

  describe("getClassroomTypes", () => {
    it("fetches types scoped to schoolId", async () => {
      const mockTypes = [
        { id: "type-1", name: "Classroom" },
        { id: "type-2", name: "Laboratory" },
      ]

      vi.mocked(db.classroomType.findMany).mockResolvedValue(mockTypes as any)

      const result = await getClassroomTypes()

      expect(result).toHaveLength(2)
      expect(vi.mocked(db.classroomType.findMany)).toHaveBeenCalledWith({
        where: { schoolId: mockSchoolId },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    })

    it("returns empty array when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getClassroomTypes()

      expect(result).toEqual([])
    })
  })

  // ===========================================================================
  // getClassroom
  // ===========================================================================

  describe("getClassroom", () => {
    it("fetches single classroom scoped to schoolId", async () => {
      const mockClassroom = {
        id: "room-1",
        roomName: "Lab A",
        capacity: 30,
        typeId: "type-1",
        classroomType: { id: "type-1", name: "Laboratory" },
      }

      vi.mocked(db.classroom.findFirst).mockResolvedValue(mockClassroom as any)

      const result = await getClassroom({ id: "room-1" })

      expect(result).toBeDefined()
      expect(result!.roomName).toBe("Lab A")
      expect(vi.mocked(db.classroom.findFirst)).toHaveBeenCalledWith({
        where: { id: "room-1", schoolId: mockSchoolId },
        select: {
          id: true,
          roomName: true,
          capacity: true,
          typeId: true,
          gradeId: true,
          classroomType: { select: { id: true, name: true } },
          grade: { select: { id: true, name: true } },
        },
      })
    })

    it("returns null for classroom from different school", async () => {
      vi.mocked(db.classroom.findFirst).mockResolvedValue(null)

      const result = await getClassroom({ id: "room-from-other-school" })

      expect(result).toBeNull()
    })

    it("returns null when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await getClassroom({ id: "room-1" })

      expect(result).toBeNull()
    })
  })

  // ===========================================================================
  // createClassroom
  // ===========================================================================

  describe("createClassroom", () => {
    it("creates classroom with schoolId for multi-tenant isolation", async () => {
      const mockCreated = {
        id: "room-new",
        roomName: "Room 101",
        typeId: "type-1",
        capacity: 25,
        schoolId: mockSchoolId,
      }

      vi.mocked(db.classroom.create).mockResolvedValue(mockCreated as any)
      vi.mocked(db.school.findUnique).mockResolvedValue({
        maxClasses: 100,
      } as any)
      vi.mocked(db.classroom.count).mockResolvedValue(5)

      const result = await createClassroom({
        roomName: "Room 101",
        typeId: "type-1",
        capacity: 25,
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "room-new" })

      expect(vi.mocked(db.classroom.create)).toHaveBeenCalledWith({
        data: {
          schoolId: mockSchoolId,
          roomName: "Room 101",
          typeId: "type-1",
          capacity: 25,
          gradeId: null,
        },
      })
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await createClassroom({
        roomName: "Room 101",
        typeId: "type-1",
        capacity: 25,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing school")
    })

    it("handles duplicate room name (P2002 unique constraint)", async () => {
      const prismaError = new Error("Unique constraint failed")
      ;(prismaError as any).code = "P2002"

      vi.mocked(db.classroom.create).mockRejectedValue(prismaError)

      const result = await createClassroom({
        roomName: "Duplicate Room",
        typeId: "type-1",
        capacity: 30,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("A room with this name already exists")
    })
  })

  // ===========================================================================
  // updateClassroom
  // ===========================================================================

  describe("updateClassroom", () => {
    it("updates classroom with schoolId scope", async () => {
      const mockExisting = {
        id: "room-1",
        roomName: "Old Name",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.classroom.findFirst).mockResolvedValue(mockExisting as any)
      vi.mocked(db.classroom.updateMany).mockResolvedValue({ count: 1 })

      const result = await updateClassroom({
        id: "room-1",
        roomName: "New Name",
        capacity: 40,
      })

      expect(result.success).toBe(true)

      expect(vi.mocked(db.classroom.findFirst)).toHaveBeenCalledWith({
        where: { id: "room-1", schoolId: mockSchoolId },
      })

      expect(vi.mocked(db.classroom.updateMany)).toHaveBeenCalledWith({
        where: { id: "room-1", schoolId: mockSchoolId },
        data: { roomName: "New Name", capacity: 40 },
      })
    })

    it("prevents updating classroom from different school", async () => {
      vi.mocked(db.classroom.findFirst).mockResolvedValue(null)

      const result = await updateClassroom({
        id: "room-from-other-school",
        roomName: "Hacked Room",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Classroom not found")
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await updateClassroom({
        id: "room-1",
        roomName: "Updated",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing school")
    })

    it("handles duplicate room name on update (P2002)", async () => {
      vi.mocked(db.classroom.findFirst).mockResolvedValue({
        id: "room-1",
        schoolId: mockSchoolId,
      } as any)

      const prismaError = new Error("Unique constraint failed")
      ;(prismaError as any).code = "P2002"
      vi.mocked(db.classroom.updateMany).mockRejectedValue(prismaError)

      const result = await updateClassroom({
        id: "room-1",
        roomName: "Already Taken Name",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("A room with this name already exists")
    })
  })

  // ===========================================================================
  // deleteClassroom
  // ===========================================================================

  describe("deleteClassroom", () => {
    it("deletes classroom when no references exist", async () => {
      vi.mocked(db.class.count).mockResolvedValue(0)
      vi.mocked(db.timetable.count).mockResolvedValue(0)
      vi.mocked(db.roomConstraint.count).mockResolvedValue(0)
      vi.mocked(db.classroom.deleteMany).mockResolvedValue({ count: 1 })

      const result = await deleteClassroom({ id: "room-1" })

      expect(result.success).toBe(true)

      // Verify all reference checks use schoolId
      expect(vi.mocked(db.class.count)).toHaveBeenCalledWith({
        where: { classroomId: "room-1", schoolId: mockSchoolId },
      })
      expect(vi.mocked(db.timetable.count)).toHaveBeenCalledWith({
        where: { classroomId: "room-1", schoolId: mockSchoolId },
      })
      expect(vi.mocked(db.roomConstraint.count)).toHaveBeenCalledWith({
        where: { classroomId: "room-1", schoolId: mockSchoolId },
      })

      // Verify delete is scoped
      expect(vi.mocked(db.classroom.deleteMany)).toHaveBeenCalledWith({
        where: { id: "room-1", schoolId: mockSchoolId },
      })
    })

    it("blocks delete when classes reference the room", async () => {
      vi.mocked(db.class.count).mockResolvedValue(3)

      const result = await deleteClassroom({ id: "room-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Cannot delete: 3 class(es) are assigned to this room"
      )
      expect(vi.mocked(db.classroom.deleteMany)).not.toHaveBeenCalled()
    })

    it("blocks delete when timetable slots reference the room", async () => {
      vi.mocked(db.class.count).mockResolvedValue(0)
      vi.mocked(db.timetable.count).mockResolvedValue(5)

      const result = await deleteClassroom({ id: "room-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Cannot delete: 5 timetable slot(s) reference this room"
      )
      expect(vi.mocked(db.classroom.deleteMany)).not.toHaveBeenCalled()
    })

    it("blocks delete when room constraints reference the room", async () => {
      vi.mocked(db.class.count).mockResolvedValue(0)
      vi.mocked(db.timetable.count).mockResolvedValue(0)
      vi.mocked(db.roomConstraint.count).mockResolvedValue(2)

      const result = await deleteClassroom({ id: "room-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe(
        "Cannot delete: 2 room constraint(s) reference this room"
      )
      expect(vi.mocked(db.classroom.deleteMany)).not.toHaveBeenCalled()
    })

    it("returns error when not authenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null as any,
        subdomain: "test",
        role: "ADMIN",
        locale: "en",
      })

      const result = await deleteClassroom({ id: "room-1" })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing school")
    })
  })
})
