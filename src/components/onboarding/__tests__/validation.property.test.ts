import fc from "fast-check"
import { describe, expect, it } from "vitest"

import {
  domainSchema,
  emailSchema,
  onboardingValidation,
  phoneSchema,
} from "../validation"

describe("Onboarding Validation - Property-Based Tests", () => {
  describe("domainSchema", () => {
    it("accepts any valid subdomain (3-63 chars, lowercase alphanum + hyphens)", () => {
      fc.assert(
        fc.property(
          fc
            .stringMatching(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/)
            .filter((s) => !s.includes("--")),
          (domain) => {
            const result = domainSchema.safeParse(domain)
            expect(result.success).toBe(true)
          }
        ),
        { numRuns: 200 }
      )
    })

    it("rejects domains shorter than 3 characters", () => {
      fc.assert(
        fc.property(fc.stringMatching(/^[a-z0-9]{1,2}$/), (domain) => {
          const result = domainSchema.safeParse(domain)
          expect(result.success).toBe(false)
        }),
        { numRuns: 50 }
      )
    })

    it("rejects domains with uppercase letters", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 3, maxLength: 63 })
            .filter((s) => /[A-Z]/.test(s) && /^[a-zA-Z0-9-]+$/.test(s)),
          (domain) => {
            const result = domainSchema.safeParse(domain)
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 50 }
      )
    })

    it("rejects domains with consecutive hyphens", () => {
      fc.assert(
        fc.property(
          fc.stringMatching(/^[a-z0-9][a-z0-9-]*--[a-z0-9-]*[a-z0-9]$/),
          (domain) => {
            if (domain.length >= 3 && domain.length <= 63) {
              const result = domainSchema.safeParse(domain)
              expect(result.success).toBe(false)
            }
          }
        ),
        { numRuns: 50 }
      )
    })

    it("never throws an unhandled exception for random UTF-8 strings", () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 100, unit: "grapheme" }),
          (input) => {
            const result = domainSchema.safeParse(input)
            // Should always return a result object, never throw
            expect(result).toHaveProperty("success")
          }
        ),
        { numRuns: 500 }
      )
    })
  })

  describe("emailSchema", () => {
    it("accepts well-formed email addresses", () => {
      // Use a custom arbitrary that generates simple valid emails
      // (fast-check's emailAddress() can generate edge-case emails that Zod rejects)
      const simpleEmail = fc
        .tuple(
          fc.stringMatching(/^[a-z][a-z0-9]{1,10}$/),
          fc.stringMatching(/^[a-z]{2,8}$/),
          fc.constantFrom("com", "org", "net", "io", "edu")
        )
        .map(([user, domain, tld]) => `${user}@${domain}.${tld}`)

      fc.assert(
        fc.property(simpleEmail, (email) => {
          const result = emailSchema.safeParse(email)
          expect(result.success).toBe(true)
        }),
        { numRuns: 200 }
      )
    })

    it("rejects random strings that aren't emails", () => {
      fc.assert(
        fc.property(
          fc
            .string({ minLength: 1, maxLength: 50 })
            .filter((s) => !s.includes("@")),
          (notEmail) => {
            const result = emailSchema.safeParse(notEmail)
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("never throws for arbitrary input", () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 200, unit: "grapheme" }),
          (input) => {
            const result = emailSchema.safeParse(input)
            expect(result).toHaveProperty("success")
          }
        ),
        { numRuns: 500 }
      )
    })
  })

  describe("phoneSchema", () => {
    it("accepts phone numbers with digits and formatting chars", () => {
      fc.assert(
        fc.property(fc.stringMatching(/^\+?[\d\s\-\(\)]{3,20}$/), (phone) => {
          const result = phoneSchema.safeParse(phone)
          expect(result.success).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("accepts empty strings (optional field)", () => {
      const result = phoneSchema.safeParse("")
      expect(result.success).toBe(true)
    })
  })

  describe("onboardingValidation (price fields)", () => {
    it("accepts any non-negative tuition fee up to 100K", () => {
      fc.assert(
        fc.property(fc.double({ min: 0, max: 100000, noNaN: true }), (fee) => {
          const result = onboardingValidation
            .pick({ tuitionFee: true })
            .safeParse({ tuitionFee: fee })
          expect(result.success).toBe(true)
        }),
        { numRuns: 200 }
      )
    })

    it("rejects negative tuition fees", () => {
      fc.assert(
        fc.property(
          fc.double({ min: -100000, max: -0.01, noNaN: true }),
          (fee) => {
            const result = onboardingValidation
              .pick({ tuitionFee: true })
              .safeParse({ tuitionFee: fee })
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("rejects tuition fees exceeding 100K", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 100000.01, max: 1000000, noNaN: true }),
          (fee) => {
            const result = onboardingValidation
              .pick({ tuitionFee: true })
              .safeParse({ tuitionFee: fee })
            expect(result.success).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("accepts any valid capacity within bounds", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 1000 }),
          fc.integer({ min: 1, max: 500 }),
          (students, teachers, classes) => {
            const result = onboardingValidation
              .pick({
                maxStudents: true,
                maxTeachers: true,
                maxClasses: true,
              })
              .safeParse({
                maxStudents: students,
                maxTeachers: teachers,
                maxClasses: classes,
              })
            expect(result.success).toBe(true)
          }
        ),
        { numRuns: 200 }
      )
    })
  })

  describe("hex color validation", () => {
    it("accepts valid 6-digit hex colors", () => {
      fc.assert(
        fc.property(fc.stringMatching(/^#[0-9A-Fa-f]{6}$/), (color) => {
          const result = onboardingValidation
            .pick({ primaryColor: true })
            .safeParse({ primaryColor: color })
          expect(result.success).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("rejects 3-digit shorthand hex colors", () => {
      fc.assert(
        fc.property(fc.stringMatching(/^#[0-9A-Fa-f]{3}$/), (color) => {
          const result = onboardingValidation
            .pick({ primaryColor: true })
            .safeParse({ primaryColor: color })
          expect(result.success).toBe(false)
        }),
        { numRuns: 50 }
      )
    })
  })
})
