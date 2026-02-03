import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  assertMessagingPermission,
  canManageParticipants,
  canSendMessage,
  getAuthContext,
  validateConversationType,
} from "../authorization"

describe("Messaging Authorization", () => {
  describe("getAuthContext", () => {
    it("returns null when session is null", () => {
      expect(getAuthContext(null)).toBeNull()
    })

    it("returns null when user is missing", () => {
      expect(getAuthContext({} as any)).toBeNull()
    })

    it("returns null when userId is missing", () => {
      expect(getAuthContext({ user: {} } as any)).toBeNull()
    })

    it("returns auth context with valid session", () => {
      const session = {
        user: {
          id: "user-123",
          schoolId: "school-123",
          role: "TEACHER",
        },
      }

      const context = getAuthContext(session as any)

      expect(context).toEqual({
        userId: "user-123",
        schoolId: "school-123",
        role: "TEACHER",
      })
    })

    it("defaults role to USER if not provided", () => {
      const session = {
        user: {
          id: "user-123",
          schoolId: "school-123",
        },
      }

      const context = getAuthContext(session as any)

      expect(context?.role).toBe("USER")
    })
  })

  describe("validateConversationType", () => {
    const mockAuthContext = {
      userId: "user-123",
      schoolId: "school-123",
      role: "TEACHER" as const,
    }

    it("allows TEACHER to create direct conversations", () => {
      expect(() =>
        validateConversationType(mockAuthContext, "direct")
      ).not.toThrow()
    })

    it("allows TEACHER to create group conversations", () => {
      expect(() =>
        validateConversationType(mockAuthContext, "group")
      ).not.toThrow()
    })

    it("throws when STUDENT tries to create announcement", () => {
      const studentContext = { ...mockAuthContext, role: "STUDENT" as const }

      expect(() =>
        validateConversationType(studentContext, "announcement")
      ).toThrow()
    })

    it("allows ADMIN to create any conversation type", () => {
      const adminContext = { ...mockAuthContext, role: "ADMIN" as const }

      expect(() =>
        validateConversationType(adminContext, "announcement")
      ).not.toThrow()
      expect(() =>
        validateConversationType(adminContext, "class")
      ).not.toThrow()
      expect(() =>
        validateConversationType(adminContext, "department")
      ).not.toThrow()
    })
  })

  describe("canManageParticipants", () => {
    it("returns true for owner role", () => {
      expect(canManageParticipants("owner")).toBe(true)
    })

    it("returns true for admin role", () => {
      expect(canManageParticipants("admin")).toBe(true)
    })

    it("returns false for member role", () => {
      expect(canManageParticipants("member")).toBe(false)
    })

    it("returns false for undefined role", () => {
      expect(canManageParticipants(undefined)).toBe(false)
    })
  })

  describe("canSendMessage", () => {
    it("returns true for member role", () => {
      expect(canSendMessage("member")).toBe(true)
    })

    it("returns true for owner role", () => {
      expect(canSendMessage("owner")).toBe(true)
    })

    it("returns true for admin role", () => {
      expect(canSendMessage("admin")).toBe(true)
    })

    it("returns false for undefined role", () => {
      expect(canSendMessage(undefined)).toBe(false)
    })
  })

  describe("assertMessagingPermission - Multi-tenant isolation", () => {
    const mockAuthContext = {
      userId: "user-123",
      schoolId: "school-123",
      role: "TEACHER" as const,
    }

    it("throws when user is not a participant", () => {
      const conversation = {
        id: "conv-1",
        type: "direct" as const,
        createdById: "user-456",
        participantIds: ["user-456", "user-789"], // user-123 is not included
      }

      expect(() =>
        assertMessagingPermission(
          mockAuthContext,
          "send_message",
          conversation,
          undefined,
          undefined
        )
      ).toThrow()
    })

    it("allows sending message when user is participant", () => {
      const conversation = {
        id: "conv-1",
        type: "direct" as const,
        createdById: "user-456",
        participantIds: ["user-123", "user-456"],
      }

      expect(() =>
        assertMessagingPermission(
          mockAuthContext,
          "send_message",
          conversation,
          undefined,
          "member"
        )
      ).not.toThrow()
    })
  })

  describe("Permission matrix - Role-based access", () => {
    // Test each action for each role
    const roles = ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN"] as const

    describe("create_conversation", () => {
      roles.forEach((role) => {
        it(`${role} can create direct conversations`, () => {
          const context = {
            userId: "user-123",
            schoolId: "school-123",
            role,
          }

          expect(() =>
            assertMessagingPermission(context, "create_conversation", undefined)
          ).not.toThrow()
        })
      })
    })

    describe("delete_message", () => {
      it("allows owner to delete any message in conversation", () => {
        const context = {
          userId: "user-123",
          schoolId: "school-123",
          role: "TEACHER" as const,
        }

        const conversation = {
          id: "conv-1",
          type: "direct" as const,
          createdById: "user-123",
          participantIds: ["user-123", "user-456"],
        }

        const message = {
          id: "msg-1",
          senderId: "user-456", // Not the current user
        }

        expect(() =>
          assertMessagingPermission(
            context,
            "delete_message",
            conversation,
            message,
            "owner" // But user is owner
          )
        ).not.toThrow()
      })

      it("allows sender to delete their own message", () => {
        const context = {
          userId: "user-123",
          schoolId: "school-123",
          role: "STUDENT" as const,
        }

        const conversation = {
          id: "conv-1",
          type: "group" as const,
          createdById: "user-456",
          participantIds: ["user-123", "user-456"],
        }

        const message = {
          id: "msg-1",
          senderId: "user-123", // Current user is sender
        }

        expect(() =>
          assertMessagingPermission(
            context,
            "delete_message",
            conversation,
            message,
            "member"
          )
        ).not.toThrow()
      })

      it("denies non-sender non-admin from deleting message", () => {
        const context = {
          userId: "user-123",
          schoolId: "school-123",
          role: "STUDENT" as const,
        }

        const conversation = {
          id: "conv-1",
          type: "group" as const,
          createdById: "user-456",
          participantIds: ["user-123", "user-456"],
        }

        const message = {
          id: "msg-1",
          senderId: "user-456", // Not the current user
        }

        expect(() =>
          assertMessagingPermission(
            context,
            "delete_message",
            conversation,
            message,
            "member" // And not an admin/owner
          )
        ).toThrow()
      })
    })
  })
})
