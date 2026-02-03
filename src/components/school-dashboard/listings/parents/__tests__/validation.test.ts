import { describe, expect, it } from "vitest"
import { z } from "zod"

// Parent/Guardian validation schema tests
describe("Parent Validation Schemas", () => {
  const guardianTypeEnum = z.enum([
    "FATHER",
    "MOTHER",
    "GRANDFATHER",
    "GRANDMOTHER",
    "UNCLE",
    "AUNT",
    "SIBLING",
    "LEGAL_GUARDIAN",
    "OTHER",
  ])

  const parentBaseSchema = z.object({
    givenName: z.string().min(1, "Given name is required"),
    surname: z.string().min(1, "Surname is required"),
    email: z.string().email("Invalid email").optional(),
    phone: z.string().min(1, "Phone number is required"),
    occupation: z.string().optional(),
    address: z.string().optional(),
    relationship: guardianTypeEnum.optional(),
  })

  const parentCreateSchema = parentBaseSchema

  const parentUpdateSchema = parentBaseSchema.partial().extend({
    id: z.string().min(1, "ID is required"),
  })

  const linkGuardianSchema = z.object({
    studentId: z.string().min(1, "Student ID is required"),
    guardianId: z.string().min(1, "Guardian ID is required"),
    relationship: guardianTypeEnum,
    isPrimary: z.boolean().default(false),
    emergencyContact: z.boolean().default(false),
    canPickup: z.boolean().default(false),
  })

  describe("parentCreateSchema", () => {
    it("validates complete parent data", () => {
      const validData = {
        givenName: "John",
        surname: "Doe",
        email: "john.doe@email.com",
        phone: "+1234567890",
        occupation: "Engineer",
        address: "123 Main St",
        relationship: "FATHER",
      }

      const result = parentCreateSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it("requires mandatory fields", () => {
      const missingName = {
        surname: "Doe",
        phone: "+1234567890",
      }

      const missingPhone = {
        givenName: "John",
        surname: "Doe",
      }

      expect(parentCreateSchema.safeParse(missingName).success).toBe(false)
      expect(parentCreateSchema.safeParse(missingPhone).success).toBe(false)
    })

    it("validates email format when provided", () => {
      const invalidEmail = {
        givenName: "John",
        surname: "Doe",
        phone: "+1234567890",
        email: "not-an-email",
      }

      const validEmail = {
        givenName: "John",
        surname: "Doe",
        phone: "+1234567890",
        email: "valid@email.com",
      }

      expect(parentCreateSchema.safeParse(invalidEmail).success).toBe(false)
      expect(parentCreateSchema.safeParse(validEmail).success).toBe(true)
    })

    it("validates relationship enum", () => {
      const validRelationships = [
        "FATHER",
        "MOTHER",
        "GRANDFATHER",
        "GRANDMOTHER",
        "UNCLE",
        "AUNT",
        "SIBLING",
        "LEGAL_GUARDIAN",
        "OTHER",
      ]

      validRelationships.forEach((rel) => {
        const data = {
          givenName: "Test",
          surname: "User",
          phone: "+123",
          relationship: rel,
        }
        expect(parentCreateSchema.safeParse(data).success).toBe(true)
      })

      const invalidRelationship = {
        givenName: "Test",
        surname: "User",
        phone: "+123",
        relationship: "INVALID",
      }
      expect(parentCreateSchema.safeParse(invalidRelationship).success).toBe(
        false
      )
    })
  })

  describe("parentUpdateSchema", () => {
    it("requires id for updates", () => {
      const withoutId = {
        givenName: "Updated Name",
      }

      const result = parentUpdateSchema.safeParse(withoutId)
      expect(result.success).toBe(false)
    })

    it("allows partial updates with id", () => {
      const partialUpdate = {
        id: "parent-123",
        occupation: "Doctor",
      }

      const result = parentUpdateSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)
    })
  })

  describe("linkGuardianSchema", () => {
    it("validates guardian link data", () => {
      const validLink = {
        studentId: "student-123",
        guardianId: "guardian-123",
        relationship: "FATHER",
        isPrimary: true,
        emergencyContact: true,
        canPickup: true,
      }

      const result = linkGuardianSchema.safeParse(validLink)
      expect(result.success).toBe(true)
    })

    it("requires studentId and guardianId", () => {
      const missingStudent = {
        guardianId: "guardian-123",
        relationship: "FATHER",
      }

      const missingGuardian = {
        studentId: "student-123",
        relationship: "FATHER",
      }

      expect(linkGuardianSchema.safeParse(missingStudent).success).toBe(false)
      expect(linkGuardianSchema.safeParse(missingGuardian).success).toBe(false)
    })

    it("requires relationship type", () => {
      const missingRelationship = {
        studentId: "student-123",
        guardianId: "guardian-123",
      }

      const result = linkGuardianSchema.safeParse(missingRelationship)
      expect(result.success).toBe(false)
    })

    it("applies defaults for boolean fields", () => {
      const minimalLink = {
        studentId: "student-123",
        guardianId: "guardian-123",
        relationship: "MOTHER",
      }

      const result = linkGuardianSchema.parse(minimalLink)
      expect(result.isPrimary).toBe(false)
      expect(result.emergencyContact).toBe(false)
      expect(result.canPickup).toBe(false)
    })
  })
})
