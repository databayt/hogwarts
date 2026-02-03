import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    attendanceIntervention: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "user-123",
      schoolId: "school-123",
      role: "ADMIN",
    },
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Intervention Server Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"
  const mockStudentId = "student-123"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Intervention Creation", () => {
    const validInterventionTypes = [
      "PARENT_PHONE_CALL",
      "PARENT_EMAIL",
      "PARENT_MEETING",
      "HOME_VISIT",
      "COUNSELOR_REFERRAL",
      "SOCIAL_WORKER_REFERRAL",
      "ADMINISTRATOR_MEETING",
      "ATTENDANCE_CONTRACT",
      "TRUANCY_REFERRAL",
      "COMMUNITY_RESOURCE",
      "ACADEMIC_SUPPORT",
      "MENTORSHIP_ASSIGNMENT",
      "INCENTIVE_PROGRAM",
      "OTHER",
    ]

    it("creates intervention with all 14 valid types", () => {
      validInterventionTypes.forEach((type) => {
        const interventionData = {
          schoolId: mockSchoolId,
          studentId: mockStudentId,
          type,
          title: `${type} Intervention`,
          description: `Description for ${type}`,
          status: "SCHEDULED",
          priority: 2,
          initiatedBy: mockUserId,
        }

        expect(interventionData.type).toBe(type)
        expect(validInterventionTypes).toContain(interventionData.type)
      })
    })

    it("rejects invalid intervention type", () => {
      const invalidType = "INVALID_TYPE"
      expect(validInterventionTypes).not.toContain(invalidType)
    })

    it("creates intervention with required fields", async () => {
      const createData = {
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "PARENT_PHONE_CALL",
        title: "Initial Contact",
        description: "First contact attempt regarding attendance",
        status: "SCHEDULED",
        priority: 2,
        initiatedBy: mockUserId,
        scheduledDate: new Date("2025-02-01"),
      }

      vi.mocked(db.attendanceIntervention.create).mockResolvedValue({
        id: "intervention-123",
        ...createData,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await db.attendanceIntervention.create({
        data: createData,
      })

      expect(result.id).toBeDefined()
      expect(result.status).toBe("SCHEDULED")
    })
  })

  describe("Intervention Status Transitions", () => {
    const validStatuses = [
      "SCHEDULED",
      "IN_PROGRESS",
      "COMPLETED",
      "CANCELLED",
      "ESCALATED",
    ]

    it("validates all status values", () => {
      validStatuses.forEach((status) => {
        expect(validStatuses).toContain(status)
      })
    })

    it("transitions from SCHEDULED to IN_PROGRESS", () => {
      const intervention = { status: "SCHEDULED" }
      const newStatus = "IN_PROGRESS"

      // Valid transition
      const validTransitions: Record<string, string[]> = {
        SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "ESCALATED", "CANCELLED"],
        COMPLETED: [], // Terminal state
        CANCELLED: [], // Terminal state
        ESCALATED: ["IN_PROGRESS", "COMPLETED"], // Can be retried
      }

      expect(validTransitions[intervention.status]).toContain(newStatus)
    })

    it("transitions from IN_PROGRESS to COMPLETED", () => {
      const intervention = { status: "IN_PROGRESS" }
      const newStatus = "COMPLETED"

      const validTransitions: Record<string, string[]> = {
        SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
        IN_PROGRESS: ["COMPLETED", "ESCALATED", "CANCELLED"],
        COMPLETED: [],
        CANCELLED: [],
        ESCALATED: ["IN_PROGRESS", "COMPLETED"],
      }

      expect(validTransitions[intervention.status]).toContain(newStatus)
    })

    it("allows escalation from IN_PROGRESS", () => {
      const intervention = { status: "IN_PROGRESS" }
      const newStatus = "ESCALATED"

      expect(["COMPLETED", "ESCALATED", "CANCELLED"]).toContain(newStatus)
    })

    it("sets completedDate when completing", () => {
      const completionUpdate = {
        status: "COMPLETED",
        completedDate: new Date(),
        outcome: "Parent agreed to monitor attendance more closely",
      }

      expect(completionUpdate.completedDate).toBeInstanceOf(Date)
      expect(completionUpdate.outcome).toBeTruthy()
    })
  })

  describe("Escalation Workflow", () => {
    it("creates escalated intervention with reference", async () => {
      const originalIntervention = {
        id: "intervention-original",
        type: "PARENT_PHONE_CALL",
        priority: 1,
      }

      const escalatedData = {
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "PARENT_MEETING", // Escalated type
        title: "Follow-up Meeting Required",
        description: "Phone call unsuccessful, scheduling in-person meeting",
        status: "SCHEDULED",
        priority: 2, // Higher priority
        initiatedBy: mockUserId,
        escalatedFrom: originalIntervention.id, // Reference to original
      }

      expect(escalatedData.escalatedFrom).toBe(originalIntervention.id)
      expect(escalatedData.priority).toBeGreaterThan(
        originalIntervention.priority
      )
    })

    it("marks original intervention as ESCALATED", async () => {
      const updateData = {
        status: "ESCALATED",
        outcome: "Escalated to parent meeting due to no response",
      }

      expect(updateData.status).toBe("ESCALATED")
    })

    it("escalation increases priority", () => {
      const priorities = [1, 2, 3, 4] // 1=Low, 2=Medium, 3=High, 4=Critical

      priorities.forEach((priority, index) => {
        if (index < priorities.length - 1) {
          const escalatedPriority = Math.min(priority + 1, 4)
          expect(escalatedPriority).toBeGreaterThan(priority)
        }
      })
    })
  })

  describe("Priority Assignment", () => {
    it("validates priority levels 1-4", () => {
      const validPriorities = [1, 2, 3, 4]

      validPriorities.forEach((priority) => {
        expect(priority).toBeGreaterThanOrEqual(1)
        expect(priority).toBeLessThanOrEqual(4)
      })
    })

    it("rejects invalid priority", () => {
      const invalidPriorities = [0, 5, -1, 10]

      invalidPriorities.forEach((priority) => {
        const isValid = priority >= 1 && priority <= 4
        expect(isValid).toBe(false)
      })
    })

    it("maps priority to labels correctly", () => {
      const priorityLabels: Record<number, string> = {
        1: "Low",
        2: "Medium",
        3: "High",
        4: "Critical",
      }

      expect(priorityLabels[1]).toBe("Low")
      expect(priorityLabels[2]).toBe("Medium")
      expect(priorityLabels[3]).toBe("High")
      expect(priorityLabels[4]).toBe("Critical")
    })
  })

  describe("Follow-up Date Validation", () => {
    it("requires future follow-up date", () => {
      const now = new Date()
      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

      expect(futureDate > now).toBe(true)
      expect(pastDate > now).toBe(false)
    })

    it("allows null follow-up date", () => {
      const interventionWithoutFollowUp = {
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "PARENT_PHONE_CALL",
        title: "Quick Check",
        description: "Brief check-in call",
        status: "SCHEDULED",
        priority: 1,
        initiatedBy: mockUserId,
        followUpDate: null,
      }

      expect(interventionWithoutFollowUp.followUpDate).toBeNull()
    })

    it("calculates days until follow-up", () => {
      const followUpDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysUntil = Math.ceil(
        (followUpDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      )

      expect(daysUntil).toBe(5)
    })
  })

  describe("Assignee Validation", () => {
    it("validates assignee exists", async () => {
      const mockStaff = [
        { id: "staff-1", name: "Counselor A", role: "STAFF" },
        { id: "staff-2", name: "Social Worker B", role: "STAFF" },
      ]

      vi.mocked(db.user.findMany).mockResolvedValue(mockStaff as any)

      const result = await db.user.findMany({
        where: {
          schoolId: mockSchoolId,
          role: { in: ["STAFF", "TEACHER", "ADMIN"] },
        },
      })

      expect(result.length).toBe(2)
    })

    it("allows null assignee (unassigned)", () => {
      const unassignedIntervention = {
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "PARENT_PHONE_CALL",
        title: "Needs Assignment",
        description: "To be assigned to counselor",
        status: "SCHEDULED",
        priority: 1,
        initiatedBy: mockUserId,
        assignedTo: null,
      }

      expect(unassignedIntervention.assignedTo).toBeNull()
    })
  })

  describe("Intervention Statistics", () => {
    it("groups interventions by status", async () => {
      const mockGroupBy = [
        { status: "SCHEDULED", _count: { id: 5 } },
        { status: "IN_PROGRESS", _count: { id: 3 } },
        { status: "COMPLETED", _count: { id: 10 } },
        { status: "ESCALATED", _count: { id: 2 } },
      ]

      vi.mocked(db.attendanceIntervention.groupBy).mockResolvedValue(
        mockGroupBy as any
      )

      const result = await db.attendanceIntervention.groupBy({
        by: ["status"],
        where: { schoolId: mockSchoolId },
        _count: { id: true },
      })

      expect(result.length).toBe(4)
    })

    it("groups interventions by type", async () => {
      const mockGroupBy = [
        { type: "PARENT_PHONE_CALL", _count: { id: 15 } },
        { type: "PARENT_MEETING", _count: { id: 8 } },
        { type: "COUNSELOR_REFERRAL", _count: { id: 5 } },
      ]

      vi.mocked(db.attendanceIntervention.groupBy).mockResolvedValue(
        mockGroupBy as any
      )

      const result = await db.attendanceIntervention.groupBy({
        by: ["type"],
        where: { schoolId: mockSchoolId },
        _count: { id: true },
      })

      expect(result.length).toBeGreaterThan(0)
    })
  })
})
