// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * formatExamNotification — i18n behaviour tests.
 *
 * Locks in the contract that the school's preferred language flows through
 * to every notification template. A regression here would mean a school
 * configured for Arabic starts receiving English notifications (or vice
 * versa) — the bug we fixed in this pass.
 */

import { describe, expect, it } from "vitest"

import { formatExamNotification } from "../formatter"
import type { ExamNotificationData } from "../types"

const examDate = new Date("2026-05-01T09:00:00Z")
const endTime = new Date("2026-05-01T11:00:00Z")

const baseFields = {
  examId: "exam-1",
  examTitle: "Midterm Math",
  name: "Mathematics",
  className: "Grade 10",
}

describe("formatExamNotification — language routing", () => {
  describe("EXAM_SCHEDULED", () => {
    const data: ExamNotificationData = {
      ...baseFields,
      type: "EXAM_SCHEDULED",
      examDate,
      duration: 60,
      totalMarks: 100,
    }

    it("returns Arabic when lang='ar'", () => {
      const { title, body } = formatExamNotification(data, "STUDENT", "ar")
      expect(title).toContain("امتحان جديد")
      expect(title).toContain(baseFields.examTitle)
      expect(body).toContain("تم جدولة")
      expect(body).toContain("60")
      expect(body).toContain("دقيقة")
    })

    it("returns English when lang='en'", () => {
      const { title, body } = formatExamNotification(data, "STUDENT", "en")
      expect(title).toContain("New Exam")
      expect(title).toContain(baseFields.examTitle)
      expect(body).toContain("scheduled")
      expect(body).toContain("60 minutes")
    })

    it("falls back to English for unknown locales (e.g. 'fr')", () => {
      const { title } = formatExamNotification(data, "STUDENT", "fr")
      expect(title).toContain("New Exam")
    })

    it("defaults to Arabic when no lang provided", () => {
      const { title } = formatExamNotification(data, "STUDENT")
      expect(title).toContain("امتحان")
    })
  })

  describe("EXAM_REMINDER", () => {
    const data: ExamNotificationData = {
      ...baseFields,
      type: "EXAM_REMINDER",
      examDate,
      hoursUntil: 24,
    }

    it("returns Arabic when lang='ar'", () => {
      const { title, body } = formatExamNotification(data, "STUDENT", "ar")
      expect(title).toContain("تذكير")
      expect(body).toContain("24")
      expect(body).toContain("ساعة")
    })

    it("returns English when lang='en'", () => {
      const { title, body } = formatExamNotification(data, "STUDENT", "en")
      expect(title).toContain("Exam Reminder")
      expect(body).toContain("24 hours")
    })
  })

  describe("EXAM_STARTED", () => {
    const data: ExamNotificationData = {
      ...baseFields,
      type: "EXAM_STARTED",
      startTime: examDate,
      endTime,
      duration: 120,
    }

    it("returns Arabic when lang='ar'", () => {
      const { title, body } = formatExamNotification(data, "PARENT", "ar")
      expect(title).toContain("بدأ الامتحان")
      expect(body).toContain("بدأ امتحان")
    })

    it("returns English when lang='en'", () => {
      const { title, body } = formatExamNotification(data, "PARENT", "en")
      expect(title).toContain("Exam Started")
      expect(body).toContain("has started")
    })
  })

  describe("EXAM_COMPLETED", () => {
    const data: ExamNotificationData = {
      ...baseFields,
      type: "EXAM_COMPLETED",
      submittedAt: examDate,
      questionsAnswered: 18,
      totalQuestions: 20,
    }

    it("Arabic body includes answer count fraction", () => {
      const { title, body } = formatExamNotification(data, "PARENT", "ar")
      expect(title).toContain("اكتمل")
      expect(body).toContain("18/20")
    })

    it("English body includes answer count fraction", () => {
      const { body } = formatExamNotification(data, "PARENT", "en")
      expect(body).toContain("18/20")
    })
  })

  describe("RESULTS_PUBLISHED", () => {
    const passing: ExamNotificationData = {
      ...baseFields,
      type: "RESULTS_PUBLISHED",
      percentage: 87.5,
      grade: "A",
      passed: true,
    }
    const failing: ExamNotificationData = {
      ...passing,
      percentage: 35,
      grade: "F",
      passed: false,
    }

    it("Arabic — passed message", () => {
      const { body } = formatExamNotification(passing, "STUDENT", "ar")
      expect(body).toContain("87.5%")
      expect(body).toContain("ناجح!")
    })

    it("Arabic — failed message", () => {
      const { body } = formatExamNotification(failing, "STUDENT", "ar")
      expect(body).toContain("غير ناجح")
    })

    it("English — passed message", () => {
      const { body } = formatExamNotification(passing, "STUDENT", "en")
      expect(body).toContain("87.5%")
      expect(body).toContain("Passed!")
    })

    it("English — failed message", () => {
      const { body } = formatExamNotification(failing, "STUDENT", "en")
      expect(body).toContain("Did not pass")
    })
  })

  describe("RETAKE_AVAILABLE", () => {
    const data: ExamNotificationData = {
      ...baseFields,
      type: "RETAKE_AVAILABLE",
      attemptNumber: 2,
      maxAttempts: 3,
      previousScore: 55,
    }

    it("Arabic includes attempt count and previous score", () => {
      const { title, body } = formatExamNotification(data, "STUDENT", "ar")
      expect(title).toContain("إعادة")
      expect(body).toContain("2/3")
      expect(body).toContain("55%")
    })

    it("English includes attempt count and previous score", () => {
      const { body } = formatExamNotification(data, "STUDENT", "en")
      expect(body).toContain("2/3")
      expect(body).toContain("55")
    })
  })

  describe("GRADE_UPDATED", () => {
    const data: ExamNotificationData = {
      ...baseFields,
      type: "GRADE_UPDATED",
      previousGrade: "B",
      newGrade: "A",
    }

    it("Arabic mentions both grades", () => {
      const { body } = formatExamNotification(data, "STUDENT", "ar")
      expect(body).toContain("B")
      expect(body).toContain("A")
    })

    it("English mentions both grades", () => {
      const { title, body } = formatExamNotification(data, "STUDENT", "en")
      expect(title).toContain("Grade Updated")
      expect(body).toContain("B")
      expect(body).toContain("A")
    })
  })

  describe("Locale normalization", () => {
    it("treats 'ar-SA' as Arabic", () => {
      const data: ExamNotificationData = {
        ...baseFields,
        type: "EXAM_REMINDER",
        examDate,
        hoursUntil: 1,
      }
      const { title } = formatExamNotification(data, "STUDENT", "ar-SA")
      expect(title).toContain("تذكير")
    })

    it("treats 'AR' as Arabic (case-insensitive)", () => {
      const data: ExamNotificationData = {
        ...baseFields,
        type: "EXAM_REMINDER",
        examDate,
        hoursUntil: 1,
      }
      const { title } = formatExamNotification(data, "STUDENT", "AR")
      expect(title).toContain("تذكير")
    })
  })

  describe("Default branch (unrecognised type)", () => {
    it("returns Arabic generic message", () => {
      const bad = { type: "UNKNOWN" as any, ...baseFields } as any
      const { title, body } = formatExamNotification(bad, "STUDENT", "ar")
      expect(title).toContain("إشعار")
      expect(body).toContain("إشعار")
    })

    it("returns English generic message", () => {
      const bad = { type: "UNKNOWN" as any, ...baseFields } as any
      const { title } = formatExamNotification(bad, "STUDENT", "en")
      expect(title).toBe("Exam Notification")
    })
  })
})
