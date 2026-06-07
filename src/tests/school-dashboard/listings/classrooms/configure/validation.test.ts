// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  bulkEnrollStudentsSchema,
  generateClassesSchema,
  generateSectionsSchema,
  gradeConfigSchema,
} from "@/components/school-dashboard/listings/classrooms/configure/validation"

describe("gradeConfigSchema", () => {
  const valid = {
    gradeId: "g1",
    sections: 3,
    capacityPerSection: 30,
    roomType: "rt1",
  }

  it("accepts a fully populated grade config", () => {
    expect(gradeConfigSchema.safeParse(valid).success).toBe(true)
  })

  it("coerces stringified numbers (form input edge)", () => {
    const result = gradeConfigSchema.safeParse({
      ...valid,
      sections: "5",
      capacityPerSection: "40",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sections).toBe(5)
      expect(result.data.capacityPerSection).toBe(40)
    }
  })

  it("rejects more than 10 sections per grade", () => {
    expect(
      gradeConfigSchema.safeParse({ ...valid, sections: 11 }).success
    ).toBe(false)
  })

  it("rejects capacity above 500", () => {
    expect(
      gradeConfigSchema.safeParse({ ...valid, capacityPerSection: 501 }).success
    ).toBe(false)
  })

  it("rejects empty gradeId", () => {
    expect(gradeConfigSchema.safeParse({ ...valid, gradeId: "" }).success).toBe(
      false
    )
  })

  it("rejects empty roomType", () => {
    expect(
      gradeConfigSchema.safeParse({ ...valid, roomType: "" }).success
    ).toBe(false)
  })
})

describe("generateSectionsSchema", () => {
  it("requires at least one grade", () => {
    expect(generateSectionsSchema.safeParse({ grades: [] }).success).toBe(false)
  })

  it("validates each grade with gradeConfigSchema", () => {
    const result = generateSectionsSchema.safeParse({
      grades: [
        { gradeId: "g1", sections: 0, capacityPerSection: 10, roomType: "rt" },
      ],
    })
    expect(result.success).toBe(false)
  })
})

describe("generateClassesSchema", () => {
  it("requires gradeIds and termId", () => {
    expect(
      generateClassesSchema.safeParse({ gradeIds: [], termId: "t1" }).success
    ).toBe(false)
    expect(
      generateClassesSchema.safeParse({ gradeIds: ["g1"], termId: "" }).success
    ).toBe(false)
  })

  it("accepts the happy path", () => {
    expect(
      generateClassesSchema.safeParse({ gradeIds: ["g1", "g2"], termId: "t1" })
        .success
    ).toBe(true)
  })
})

describe("bulkEnrollStudentsSchema", () => {
  it("requires gradeIds", () => {
    expect(bulkEnrollStudentsSchema.safeParse({ gradeIds: [] }).success).toBe(
      false
    )
  })

  it("rejects empty grade ids", () => {
    expect(
      bulkEnrollStudentsSchema.safeParse({ gradeIds: ["g1", ""] }).success
    ).toBe(false)
  })

  it("accepts a populated array", () => {
    expect(
      bulkEnrollStudentsSchema.safeParse({ gradeIds: ["g1"] }).success
    ).toBe(true)
  })
})
