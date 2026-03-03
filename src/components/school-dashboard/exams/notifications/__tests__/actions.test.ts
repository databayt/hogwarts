// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  notifyExamReminder,
  notifyExamScheduled,
  notifyRetakeAvailable,
  sendExamNotification,
} from "../actions"

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", schoolId: "school-1", role: "ADMIN" },
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    exam: {
      findFirst: vi.fn(),
    },
    examResult: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Exam Notification Actions", () => {
  const SCHOOL_A = "school-1"
  const SCHOOL_B = "school-other"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("sendExamNotification", () => {
    it("uses findFirst with schoolId (not findUnique)", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        class: { studentClasses: [] },
        subject: { subjectName: "Math" },
      } as any)

      await sendExamNotification({
        type: "EXAM_SCHEDULED",
        examId: "exam-1",
        examTitle: "Test Exam",
        subjectName: "Math",
        className: "Class A",
        examDate: new Date(),
      })

      // Verify findFirst is called with schoolId in where clause
      expect(db.exam.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "exam-1",
            schoolId: SCHOOL_A,
          }),
        })
      )
    })

    it("throws error when exam not in school", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue(null)

      await expect(
        sendExamNotification({
          type: "EXAM_SCHEDULED",
          examId: "exam-cross-tenant",
          examTitle: "Cross Tenant",
          subjectName: "Math",
          className: "Class A",
          examDate: new Date(),
        })
      ).rejects.toThrow("Exam not found")
    })
  })

  describe("notifyExamScheduled", () => {
    it("reads exam with schoolId scope", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        title: "Midterm",
        subject: { subjectName: "Science" },
        class: { name: "Grade 10", studentClasses: [] },
        examDate: new Date(),
        duration: 60,
        totalMarks: 100,
      } as any)
      vi.mocked(db.notification.create).mockResolvedValue({} as any)

      await notifyExamScheduled("exam-1")

      // The first findFirst call (from notifyExamScheduled) must include schoolId
      const firstCall = vi.mocked(db.exam.findFirst).mock.calls[0]
      expect(firstCall[0]?.where).toEqual(
        expect.objectContaining({ id: "exam-1", schoolId: SCHOOL_A })
      )
    })
  })

  describe("notifyExamReminder", () => {
    it("reads exam with schoolId scope", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        title: "Final",
        subject: { subjectName: "English" },
        class: { name: "Grade 11", studentClasses: [] },
        examDate: new Date(),
      } as any)
      vi.mocked(db.notification.create).mockResolvedValue({} as any)

      await notifyExamReminder("exam-1", 24)

      const firstCall = vi.mocked(db.exam.findFirst).mock.calls[0]
      expect(firstCall[0]?.where).toEqual(
        expect.objectContaining({ id: "exam-1", schoolId: SCHOOL_A })
      )
    })
  })

  describe("notifyRetakeAvailable", () => {
    it("reads exam with schoolId scope", async () => {
      vi.mocked(db.exam.findFirst).mockResolvedValue({
        id: "exam-1",
        schoolId: SCHOOL_A,
        title: "Quiz 1",
        maxAttempts: 3,
        subject: { subjectName: "Art" },
        class: { name: "Grade 9", studentClasses: [] },
      } as any)
      vi.mocked(db.examResult.findFirst).mockResolvedValue({
        percentage: 45,
      } as any)
      vi.mocked(db.notification.create).mockResolvedValue({} as any)

      await notifyRetakeAvailable("exam-1", "student-1", 2)

      const firstCall = vi.mocked(db.exam.findFirst).mock.calls[0]
      expect(firstCall[0]?.where).toEqual(
        expect.objectContaining({ id: "exam-1", schoolId: SCHOOL_A })
      )
    })
  })
})
