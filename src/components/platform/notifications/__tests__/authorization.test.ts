import { describe, expect, it } from "vitest"

import {
  assertNotificationPermission,
  canManageOthersPreferences,
  canSendBatchNotifications,
  canSendNotificationType,
  canTargetRecipients,
  checkNotificationPermission,
  getAllowedNotificationTypes,
  getAuthContext,
  validateNotificationType,
} from "../authorization"

describe("Notification Authorization", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"

  describe("checkNotificationPermission", () => {
    describe("DEVELOPER role", () => {
      const developerAuth = {
        userId: mockUserId,
        role: "DEVELOPER" as const,
        schoolId: null,
      }

      it("grants full access to all actions", () => {
        expect(
          checkNotificationPermission(developerAuth, "create", {
            type: "system_alert",
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(developerAuth, "read", {
            userId: mockUserId,
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(developerAuth, "delete", {
            userId: "other-user",
          })
        ).toBe(true)
        expect(checkNotificationPermission(developerAuth, "send_batch")).toBe(
          true
        )
      })
    })

    describe("ADMIN role", () => {
      const adminAuth = {
        userId: mockUserId,
        role: "ADMIN" as const,
        schoolId: mockSchoolId,
      }

      it("can create notifications", () => {
        expect(
          checkNotificationPermission(adminAuth, "create", {
            type: "announcement",
          })
        ).toBe(true)
      })

      it("can send batch notifications", () => {
        expect(checkNotificationPermission(adminAuth, "send_batch")).toBe(true)
      })

      it("can update notifications in their school", () => {
        expect(
          checkNotificationPermission(adminAuth, "update", {
            schoolId: mockSchoolId,
          })
        ).toBe(true)
      })

      it("cannot update notifications in another school", () => {
        expect(
          checkNotificationPermission(adminAuth, "update", {
            schoolId: "other-school",
          })
        ).toBe(false)
      })

      it("cannot create without schoolId", () => {
        const noSchoolAdmin = { ...adminAuth, schoolId: null }
        expect(
          checkNotificationPermission(noSchoolAdmin, "create", {
            type: "announcement",
          })
        ).toBe(false)
      })
    })

    describe("TEACHER role", () => {
      const teacherAuth = {
        userId: mockUserId,
        role: "TEACHER" as const,
        schoolId: mockSchoolId,
      }

      it("can create assignment notifications", () => {
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "assignment_created",
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "assignment_due",
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "assignment_graded",
          })
        ).toBe(true)
      })

      it("can create grade notifications", () => {
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "grade_posted",
          })
        ).toBe(true)
      })

      it("can create class notifications", () => {
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "class_cancelled",
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "class_rescheduled",
          })
        ).toBe(true)
      })

      it("cannot create fee notifications", () => {
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "fee_due",
          })
        ).toBe(false)
      })

      it("cannot create system notifications", () => {
        expect(
          checkNotificationPermission(teacherAuth, "create", {
            type: "system_alert",
          })
        ).toBe(false)
      })

      it("can send batch to classes (no role targeting)", () => {
        expect(
          checkNotificationPermission(teacherAuth, "send_batch", {
            targetRole: undefined,
          })
        ).toBe(true)
      })

      it("cannot send batch to roles", () => {
        expect(
          checkNotificationPermission(teacherAuth, "send_batch", {
            targetRole: "STUDENT",
          })
        ).toBe(false)
      })
    })

    describe("ACCOUNTANT role", () => {
      const accountantAuth = {
        userId: mockUserId,
        role: "ACCOUNTANT" as const,
        schoolId: mockSchoolId,
      }

      it("can create fee notifications", () => {
        expect(
          checkNotificationPermission(accountantAuth, "create", {
            type: "fee_due",
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(accountantAuth, "create", {
            type: "fee_overdue",
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(accountantAuth, "create", {
            type: "fee_paid",
          })
        ).toBe(true)
      })

      it("cannot create assignment notifications", () => {
        expect(
          checkNotificationPermission(accountantAuth, "create", {
            type: "assignment_created",
          })
        ).toBe(false)
      })

      it("can send batch notifications", () => {
        expect(checkNotificationPermission(accountantAuth, "send_batch")).toBe(
          true
        )
      })
    })

    describe("STAFF role", () => {
      const staffAuth = {
        userId: mockUserId,
        role: "STAFF" as const,
        schoolId: mockSchoolId,
      }

      it("can create document and event notifications", () => {
        expect(
          checkNotificationPermission(staffAuth, "create", {
            type: "document_shared",
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(staffAuth, "create", {
            type: "event_reminder",
          })
        ).toBe(true)
      })

      it("cannot create other notification types", () => {
        expect(
          checkNotificationPermission(staffAuth, "create", { type: "fee_due" })
        ).toBe(false)
        expect(
          checkNotificationPermission(staffAuth, "create", {
            type: "assignment_created",
          })
        ).toBe(false)
      })
    })

    describe("STUDENT role", () => {
      const studentAuth = {
        userId: mockUserId,
        role: "STUDENT" as const,
        schoolId: mockSchoolId,
      }

      it("can read own notifications", () => {
        expect(
          checkNotificationPermission(studentAuth, "read", {
            userId: mockUserId,
          })
        ).toBe(true)
      })

      it("cannot read others notifications", () => {
        expect(
          checkNotificationPermission(studentAuth, "read", {
            userId: "other-user",
          })
        ).toBe(false)
      })

      it("can mark own notifications as read", () => {
        expect(
          checkNotificationPermission(studentAuth, "mark_read", {
            userId: mockUserId,
          })
        ).toBe(true)
      })

      it("can manage own preferences", () => {
        expect(
          checkNotificationPermission(studentAuth, "manage_preferences")
        ).toBe(true)
      })

      it("can subscribe to entities", () => {
        expect(checkNotificationPermission(studentAuth, "subscribe")).toBe(true)
      })

      it("can delete own notifications", () => {
        expect(
          checkNotificationPermission(studentAuth, "delete", {
            userId: mockUserId,
          })
        ).toBe(true)
      })

      it("cannot delete others notifications", () => {
        expect(
          checkNotificationPermission(studentAuth, "delete", {
            userId: "other-user",
          })
        ).toBe(false)
      })

      it("cannot create notifications", () => {
        expect(
          checkNotificationPermission(studentAuth, "create", {
            type: "message",
          })
        ).toBe(false)
      })
    })

    describe("GUARDIAN role", () => {
      const guardianAuth = {
        userId: mockUserId,
        role: "GUARDIAN" as const,
        schoolId: mockSchoolId,
      }

      it("can manage own notifications", () => {
        expect(
          checkNotificationPermission(guardianAuth, "read", {
            userId: mockUserId,
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(guardianAuth, "delete", {
            userId: mockUserId,
          })
        ).toBe(true)
        expect(
          checkNotificationPermission(guardianAuth, "manage_preferences")
        ).toBe(true)
      })

      it("cannot create notifications", () => {
        expect(
          checkNotificationPermission(guardianAuth, "create", {
            type: "message",
          })
        ).toBe(false)
      })
    })
  })

  describe("assertNotificationPermission", () => {
    it("does not throw when authorized", () => {
      const auth = {
        userId: mockUserId,
        role: "ADMIN" as const,
        schoolId: mockSchoolId,
      }

      expect(() => {
        assertNotificationPermission(auth, "create", { type: "announcement" })
      }).not.toThrow()
    })

    it("throws when unauthorized", () => {
      const auth = {
        userId: mockUserId,
        role: "STUDENT" as const,
        schoolId: mockSchoolId,
      }

      expect(() => {
        assertNotificationPermission(auth, "create", { type: "fee_due" })
      }).toThrow("Unauthorized")
    })

    it("includes role and action in error message", () => {
      const auth = {
        userId: mockUserId,
        role: "STUDENT" as const,
        schoolId: mockSchoolId,
      }

      expect(() => {
        assertNotificationPermission(auth, "create", { type: "fee_due" })
      }).toThrow(/STUDENT.*create/)
    })
  })

  describe("getAuthContext", () => {
    it("returns null for no session", () => {
      expect(getAuthContext(null)).toBeNull()
    })

    it("returns null for session without user", () => {
      expect(getAuthContext({})).toBeNull()
    })

    it("extracts auth context from session", () => {
      const session = {
        user: {
          id: mockUserId,
          role: "TEACHER",
          schoolId: mockSchoolId,
        },
      }

      const context = getAuthContext(session)

      expect(context).toEqual({
        userId: mockUserId,
        role: "TEACHER",
        schoolId: mockSchoolId,
      })
    })

    it("handles missing schoolId", () => {
      const session = {
        user: {
          id: mockUserId,
          role: "DEVELOPER",
        },
      }

      const context = getAuthContext(session)

      expect(context?.schoolId).toBeNull()
    })
  })

  describe("canSendNotificationType", () => {
    it("DEVELOPER can send all types", () => {
      expect(canSendNotificationType("DEVELOPER", "system_alert")).toBe(true)
      expect(canSendNotificationType("DEVELOPER", "fee_due")).toBe(true)
    })

    it("ADMIN can send all types", () => {
      expect(canSendNotificationType("ADMIN", "system_alert")).toBe(true)
      expect(canSendNotificationType("ADMIN", "fee_due")).toBe(true)
    })

    it("TEACHER can send academic types", () => {
      expect(canSendNotificationType("TEACHER", "assignment_created")).toBe(
        true
      )
      expect(canSendNotificationType("TEACHER", "grade_posted")).toBe(true)
      expect(canSendNotificationType("TEACHER", "attendance_marked")).toBe(true)
    })

    it("TEACHER cannot send fee types", () => {
      expect(canSendNotificationType("TEACHER", "fee_due")).toBe(false)
    })

    it("ACCOUNTANT can send fee types", () => {
      expect(canSendNotificationType("ACCOUNTANT", "fee_due")).toBe(true)
      expect(canSendNotificationType("ACCOUNTANT", "fee_overdue")).toBe(true)
      expect(canSendNotificationType("ACCOUNTANT", "fee_paid")).toBe(true)
    })

    it("ACCOUNTANT cannot send academic types", () => {
      expect(canSendNotificationType("ACCOUNTANT", "assignment_created")).toBe(
        false
      )
    })

    it("STUDENT cannot send any notification types", () => {
      expect(canSendNotificationType("STUDENT", "message")).toBe(false)
      expect(canSendNotificationType("STUDENT", "fee_due")).toBe(false)
    })
  })

  describe("canSendBatchNotifications", () => {
    it("allows DEVELOPER, ADMIN, TEACHER, ACCOUNTANT", () => {
      expect(canSendBatchNotifications("DEVELOPER")).toBe(true)
      expect(canSendBatchNotifications("ADMIN")).toBe(true)
      expect(canSendBatchNotifications("TEACHER")).toBe(true)
      expect(canSendBatchNotifications("ACCOUNTANT")).toBe(true)
    })

    it("disallows STUDENT, GUARDIAN, STAFF, USER", () => {
      expect(canSendBatchNotifications("STUDENT")).toBe(false)
      expect(canSendBatchNotifications("GUARDIAN")).toBe(false)
      expect(canSendBatchNotifications("STAFF")).toBe(false)
      expect(canSendBatchNotifications("USER")).toBe(false)
    })
  })

  describe("canManageOthersPreferences", () => {
    it("allows only DEVELOPER and ADMIN", () => {
      expect(canManageOthersPreferences("DEVELOPER")).toBe(true)
      expect(canManageOthersPreferences("ADMIN")).toBe(true)
    })

    it("disallows other roles", () => {
      expect(canManageOthersPreferences("TEACHER")).toBe(false)
      expect(canManageOthersPreferences("STUDENT")).toBe(false)
      expect(canManageOthersPreferences("ACCOUNTANT")).toBe(false)
    })
  })

  describe("getAllowedNotificationTypes", () => {
    it("DEVELOPER gets all types", () => {
      const types = getAllowedNotificationTypes("DEVELOPER")
      expect(types.length).toBeGreaterThan(15)
      expect(types).toContain("system_alert")
    })

    it("ADMIN gets all types", () => {
      const types = getAllowedNotificationTypes("ADMIN")
      expect(types.length).toBeGreaterThan(15)
    })

    it("TEACHER gets academic types", () => {
      const types = getAllowedNotificationTypes("TEACHER")
      expect(types).toContain("assignment_created")
      expect(types).toContain("grade_posted")
      expect(types).toContain("attendance_marked")
      expect(types).not.toContain("fee_due")
    })

    it("ACCOUNTANT gets fee types", () => {
      const types = getAllowedNotificationTypes("ACCOUNTANT")
      expect(types).toContain("fee_due")
      expect(types).toContain("fee_overdue")
      expect(types).toContain("fee_paid")
      expect(types).not.toContain("assignment_created")
    })

    it("STUDENT gets empty array", () => {
      const types = getAllowedNotificationTypes("STUDENT")
      expect(types).toEqual([])
    })
  })

  describe("validateNotificationType", () => {
    it("does not throw for allowed type", () => {
      const auth = {
        userId: mockUserId,
        role: "TEACHER" as const,
        schoolId: mockSchoolId,
      }

      expect(() => {
        validateNotificationType(auth, "assignment_created")
      }).not.toThrow()
    })

    it("throws for disallowed type", () => {
      const auth = {
        userId: mockUserId,
        role: "TEACHER" as const,
        schoolId: mockSchoolId,
      }

      expect(() => {
        validateNotificationType(auth, "fee_due")
      }).toThrow(/cannot send fee_due/)
    })
  })

  describe("canTargetRecipients", () => {
    it("DEVELOPER can target anyone", () => {
      const auth = {
        userId: mockUserId,
        role: "DEVELOPER" as const,
        schoolId: null,
      }

      expect(canTargetRecipients(auth, ["u1", "u2"])).toBe(true)
    })

    it("ADMIN can target anyone in school", () => {
      const auth = {
        userId: mockUserId,
        role: "ADMIN" as const,
        schoolId: mockSchoolId,
      }

      expect(canTargetRecipients(auth, ["u1", "u2"])).toBe(true)
    })

    it("TEACHER can target students", () => {
      const auth = {
        userId: mockUserId,
        role: "TEACHER" as const,
        schoolId: mockSchoolId,
      }

      expect(canTargetRecipients(auth, ["s1", "s2"])).toBe(true)
    })

    it("STUDENT cannot target others", () => {
      const auth = {
        userId: mockUserId,
        role: "STUDENT" as const,
        schoolId: mockSchoolId,
      }

      expect(canTargetRecipients(auth, ["u1"])).toBe(false)
    })
  })
})
