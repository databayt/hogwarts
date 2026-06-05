// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  notifyExamReminder,
  notifyExamScheduled,
  notifyRetakeAvailable,
  sendExamNotification,
} from "../actions"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    schoolExam: {
      findFirst: vi.fn(),
    },
    examResult: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    school: {
      findFirst: vi.fn().mockResolvedValue({ preferredLanguage: "ar" }),
    },
  },
}))

vi.mock("@/lib/dispatch-notification", () => ({
  dispatchNotification: vi.fn().mockResolvedValue({ id: "notif-1" }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Exam Notification Actions", () => {
  const SCHOOL_A = "school-1"
  const SCHOOL_B = "school-other"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: SCHOOL_A,
      requestId: "req-1",
      role: "ADMIN",
      isPlatformAdmin: false,
    } as any)
    vi.mocked(db.school.findFirst).mockResolvedValue({
      preferredLanguage: "ar",
    } as any)
  })

  describe("sendExamNotification", () => {
    it("uses findFirst with schoolId (not findUnique)", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        class: { studentClasses: [] },
        subject: { name: "Math" },
      } as any)

      await sendExamNotification({
        type: "EXAM_SCHEDULED",
        examId: "exam-1",
        examTitle: "Test Exam",
        name: "Math",
        className: "Class A",
        examDate: new Date(),
      })

      // Verify findFirst is called with schoolId in where clause
      expect(db.schoolExam.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "exam-1",
            schoolId: SCHOOL_A,
          }),
        })
      )
    })

    it("throws error when exam not in school", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue(null)

      await expect(
        sendExamNotification({
          type: "EXAM_SCHEDULED",
          examId: "exam-cross-tenant",
          examTitle: "Cross Tenant",
          name: "Math",
          className: "Class A",
          examDate: new Date(),
        })
      ).rejects.toThrow("Exam not found")
    })
  })

  describe("notifyExamScheduled", () => {
    it("reads exam with schoolId scope", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        title: "Midterm",
        subject: { name: "Science" },
        class: { name: "Grade 10", studentClasses: [] },
        examDate: new Date(),
        duration: 60,
        totalMarks: 100,
      } as any)
      vi.mocked(db.notification.create).mockResolvedValue({} as any)

      await notifyExamScheduled("exam-1")

      // The first findFirst call (from notifyExamScheduled) must include schoolId
      const firstCall = vi.mocked(db.schoolExam.findFirst).mock.calls[0]
      expect(firstCall[0]?.where).toEqual(
        expect.objectContaining({ id: "exam-1", schoolId: SCHOOL_A })
      )
    })
  })

  describe("notifyExamReminder", () => {
    it("reads exam with schoolId scope", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        title: "Final",
        subject: { name: "English" },
        class: { name: "Grade 11", studentClasses: [] },
        examDate: new Date(),
      } as any)
      vi.mocked(db.notification.create).mockResolvedValue({} as any)

      await notifyExamReminder("exam-1", 24)

      const firstCall = vi.mocked(db.schoolExam.findFirst).mock.calls[0]
      expect(firstCall[0]?.where).toEqual(
        expect.objectContaining({ id: "exam-1", schoolId: SCHOOL_A })
      )
    })
  })

  describe("notifyRetakeAvailable", () => {
    it("reads exam with schoolId scope", async () => {
      vi.mocked(db.schoolExam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        title: "Quiz 1",
        maxAttempts: 3,
        subject: { name: "Art" },
        class: { name: "Grade 9", studentClasses: [] },
      } as any)
      vi.mocked(db.examResult.findFirst).mockResolvedValue({
        percentage: 45,
      } as any)
      vi.mocked(db.notification.create).mockResolvedValue({} as any)

      await notifyRetakeAvailable("exam-1", "student-1", 2)

      const firstCall = vi.mocked(db.schoolExam.findFirst).mock.calls[0]
      expect(firstCall[0]?.where).toEqual(
        expect.objectContaining({ id: "exam-1", schoolId: SCHOOL_A })
      )
    })
  })
})
