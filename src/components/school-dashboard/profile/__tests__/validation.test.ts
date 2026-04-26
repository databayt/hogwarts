// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  pinnedItemSchema,
  updateBioSchema,
  updateGitHubProfileSchema,
  updateProfileSchema,
  updateSettingsSchema,
} from "../validation"

describe("Profile Validation Schemas", () => {
  describe("updateProfileSchema", () => {
    it("accepts a valid display name", () => {
      const result = updateProfileSchema.safeParse({ displayName: "Alice" })
      expect(result.success).toBe(true)
      if (result.success) expect(result.data.locale).toBe("ar")
    })

    it("rejects an empty display name", () => {
      const result = updateProfileSchema.safeParse({ displayName: "" })
      expect(result.success).toBe(false)
    })

    it("accepts an avatar URL", () => {
      const result = updateProfileSchema.safeParse({
        displayName: "Alice",
        avatarUrl: "https://cdn.example.com/a.jpg",
      })
      expect(result.success).toBe(true)
    })

    it("treats empty string avatar as a clear-image signal", () => {
      const result = updateProfileSchema.safeParse({
        displayName: "Alice",
        avatarUrl: "",
      })
      expect(result.success).toBe(true)
    })

    it("rejects a malformed avatar URL", () => {
      const result = updateProfileSchema.safeParse({
        displayName: "Alice",
        avatarUrl: "not-a-url",
      })
      expect(result.success).toBe(false)
    })

    it("locks locale to ar or en", () => {
      const ok = updateProfileSchema.safeParse({
        displayName: "Alice",
        locale: "en",
      })
      const bad = updateProfileSchema.safeParse({
        displayName: "Alice",
        locale: "fr",
      })
      expect(ok.success).toBe(true)
      expect(bad.success).toBe(false)
    })
  })

  describe("updateBioSchema", () => {
    it("accepts an empty bio (clear)", () => {
      expect(updateBioSchema.safeParse({}).success).toBe(true)
    })

    it("accepts a 500-character bio", () => {
      const bio = "a".repeat(500)
      expect(updateBioSchema.safeParse({ bio }).success).toBe(true)
    })

    it("rejects a bio over 500 characters", () => {
      const bio = "a".repeat(501)
      expect(updateBioSchema.safeParse({ bio }).success).toBe(false)
    })
  })

  describe("updateSettingsSchema", () => {
    it("accepts an empty payload (no changes)", () => {
      expect(updateSettingsSchema.safeParse({}).success).toBe(true)
    })

    it("accepts all known theme values", () => {
      for (const theme of ["light", "dark", "system"] as const) {
        expect(updateSettingsSchema.safeParse({ theme }).success).toBe(true)
      }
    })

    it("rejects unknown theme values", () => {
      expect(updateSettingsSchema.safeParse({ theme: "neon" }).success).toBe(
        false
      )
    })

    it("accepts boolean notification preferences", () => {
      const result = updateSettingsSchema.safeParse({
        emailNotifications: true,
        pushNotifications: false,
        allowMessages: true,
      })
      expect(result.success).toBe(true)
    })
  })

  describe("updateGitHubProfileSchema", () => {
    it("accepts a fully populated profile", () => {
      const result = updateGitHubProfileSchema.safeParse({
        displayName: "Bob",
        bio: "Software engineer",
        website: "https://bob.dev",
        timezone: "UTC",
        statusEmoji: ":wave:",
        statusMessage: "Coding",
        pronouns: "he/him",
        socialLinks: {
          github: "https://github.com/bob",
          twitter: "https://twitter.com/bob",
          linkedin: "https://linkedin.com/in/bob",
        },
      })
      expect(result.success).toBe(true)
    })

    it("rejects display names over 100 characters", () => {
      const result = updateGitHubProfileSchema.safeParse({
        displayName: "a".repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it("rejects status messages over 100 characters", () => {
      const result = updateGitHubProfileSchema.safeParse({
        statusMessage: "a".repeat(101),
      })
      expect(result.success).toBe(false)
    })

    it("accepts empty social link strings (clear-link)", () => {
      const result = updateGitHubProfileSchema.safeParse({
        socialLinks: { github: "", twitter: "", linkedin: "" },
      })
      expect(result.success).toBe(true)
    })

    it("rejects malformed social link URLs", () => {
      const result = updateGitHubProfileSchema.safeParse({
        socialLinks: { github: "not-a-url" },
      })
      expect(result.success).toBe(false)
    })
  })

  describe("pinnedItemSchema", () => {
    it("accepts every supported item type", () => {
      const types = [
        "COURSE",
        "SUBJECT",
        "PROJECT",
        "ACHIEVEMENT",
        "CERTIFICATE",
        "CLASS",
        "CHILD",
        "DEPARTMENT",
        "PUBLICATION",
        "TASK",
      ] as const
      for (const itemType of types) {
        const result = pinnedItemSchema.safeParse({
          itemType,
          itemId: "id",
          title: "title",
        })
        expect(result.success).toBe(true)
      }
    })

    it("rejects unsupported item types", () => {
      const result = pinnedItemSchema.safeParse({
        itemType: "RECIPE",
        itemId: "id",
        title: "title",
      })
      expect(result.success).toBe(false)
    })

    it("defaults isPublic to true when omitted", () => {
      const result = pinnedItemSchema.safeParse({
        itemType: "PROJECT",
        itemId: "id",
        title: "title",
      })
      if (!result.success) throw new Error("Schema should accept this input")
      expect(result.data.isPublic).toBe(true)
    })

    it("requires itemId and title", () => {
      const noId = pinnedItemSchema.safeParse({
        itemType: "PROJECT",
        title: "title",
      })
      const noTitle = pinnedItemSchema.safeParse({
        itemType: "PROJECT",
        itemId: "id",
      })
      expect(noId.success).toBe(false)
      expect(noTitle.success).toBe(false)
    })
  })
})
