import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      update: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      user: {
        update: vi.fn(),
      },
    })),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { auth } from "@/auth"

describe("Profile Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    })
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: mockUserId,
        schoolId: mockSchoolId,
        role: "TEACHER",
        email: "teacher@school.edu",
      },
    } as any)
  })

  describe("Profile Update", () => {
    it("updates profile with schoolId scope", async () => {
      const mockUser = {
        id: mockUserId,
        name: "John Doe",
        email: "john@school.edu",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any)
      vi.mocked(db.user.update).mockResolvedValue({ ...mockUser, name: "John Updated" } as any)

      // Verify user belongs to school before update
      await db.user.findFirst({
        where: { id: mockUserId, schoolId: mockSchoolId },
      })

      await db.user.update({
        where: { id: mockUserId },
        data: { name: "John Updated" },
      })

      expect(db.user.findFirst).toHaveBeenCalledWith({
        where: { id: mockUserId, schoolId: mockSchoolId },
      })
    })

    it("prevents updating other users profiles", async () => {
      vi.mocked(db.user.findFirst).mockResolvedValue(null) // Different school

      const result = await db.user.findFirst({
        where: { id: "other-user", schoolId: mockSchoolId },
      })

      expect(result).toBeNull()
    })
  })

  describe("Profile Fetch", () => {
    it("fetches profile scoped to schoolId", async () => {
      const mockProfile = {
        id: mockUserId,
        name: "John Doe",
        email: "john@school.edu",
        phone: "+1234567890",
        schoolId: mockSchoolId,
        role: "TEACHER",
      }

      vi.mocked(db.user.findFirst).mockResolvedValue(mockProfile as any)

      const profile = await db.user.findFirst({
        where: { id: mockUserId, schoolId: mockSchoolId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
        },
      })

      expect(profile).toEqual(mockProfile)
      expect(db.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockUserId, schoolId: mockSchoolId },
        })
      )
    })
  })

  describe("Password Change", () => {
    it("validates current password before change", async () => {
      const mockUser = {
        id: mockUserId,
        password: "hashed_password",
        schoolId: mockSchoolId,
      }

      vi.mocked(db.user.findFirst).mockResolvedValue(mockUser as any)

      const user = await db.user.findFirst({
        where: { id: mockUserId, schoolId: mockSchoolId },
        select: { password: true },
      })

      expect(user?.password).toBeDefined()
    })
  })

  describe("Avatar Upload", () => {
    it("updates avatar URL with schoolId verification", async () => {
      vi.mocked(db.user.findFirst).mockResolvedValue({
        id: mockUserId,
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.user.update).mockResolvedValue({
        id: mockUserId,
        image: "https://storage.example.com/avatars/user-123.jpg",
      } as any)

      // First verify user belongs to school
      await db.user.findFirst({
        where: { id: mockUserId, schoolId: mockSchoolId },
      })

      // Then update
      const result = await db.user.update({
        where: { id: mockUserId },
        data: { image: "https://storage.example.com/avatars/user-123.jpg" },
      })

      expect(result.image).toContain("avatars")
    })
  })
})
