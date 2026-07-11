// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import type {
  AcademicStepData,
  GuardianStepData,
  LocationStepData,
  PersonalStepData,
} from "@/components/school-marketing/application/types"
import {
  getAge,
  getStepValidationStatus,
  isValidDate,
  isValidEmail,
  isValidPhone,
  validateAcademicStep,
  validateAllSteps,
  validateGuardianStep,
  validatePersonalStep,
} from "@/components/school-marketing/application/validation-helpers"

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const validPersonal: PersonalStepData = {
  firstName: "Ahmed",
  lastName: "Mohamed",
  dateOfBirth: "2010-03-15",
  gender: "MALE",
  nationality: "Sudanese",
  phone: "+249123456789",
}

const validGuardian: GuardianStepData = {
  fatherName: "Mohamed Ahmed",
  motherName: "Fatima Ali",
}

const validLocation: LocationStepData = {
  address: "123 Main Street",
  city: "Khartoum",
  state: "Khartoum",
  country: "Sudan",
}

const validAcademic: AcademicStepData = {
  applyingForClass: "Grade 10",
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("validatePersonalStep", () => {
  it("returns true for complete personal data", () => {
    expect(validatePersonalStep(validPersonal)).toBe(true)
  })

  it("returns false for undefined", () => {
    expect(validatePersonalStep(undefined)).toBe(false)
  })

  it("returns false when firstName is missing", () => {
    expect(validatePersonalStep({ ...validPersonal, firstName: "" })).toBe(
      false
    )
  })

  it("returns true when gender is missing (gender is optional)", () => {
    expect(validatePersonalStep({ ...validPersonal, gender: "" as any })).toBe(
      true
    )
  })

  it("returns true when nationality is missing (nationality is optional)", () => {
    expect(validatePersonalStep({ ...validPersonal, nationality: "" })).toBe(
      true
    )
  })
})

describe("validateGuardianStep", () => {
  it("returns true when father and mother names present", () => {
    expect(validateGuardianStep(validGuardian)).toBe(true)
  })

  it("returns false for undefined", () => {
    expect(validateGuardianStep(undefined)).toBe(false)
  })

  it("returns true when motherName is missing but fatherName present", () => {
    expect(validateGuardianStep({ ...validGuardian, motherName: "" })).toBe(
      true
    )
  })
})

describe("validateAcademicStep", () => {
  it("returns true when applyingForClass is present", () => {
    expect(validateAcademicStep(validAcademic)).toBe(true)
  })

  it("returns false for undefined", () => {
    expect(validateAcademicStep(undefined)).toBe(false)
  })

  it("returns false when applyingForClass is missing", () => {
    expect(
      validateAcademicStep({ ...validAcademic, applyingForClass: "" })
    ).toBe(false)
  })
})

describe("validateAllSteps", () => {
  it("returns true when all steps are valid", () => {
    expect(
      validateAllSteps({
        personal: validPersonal,
        location: validLocation,
        guardian: validGuardian,
        academic: validAcademic,
      })
    ).toBe(true)
  })

  it("returns false when personal step is invalid (firstName missing)", () => {
    expect(
      validateAllSteps({
        personal: { ...validPersonal, firstName: "" },
        location: validLocation,
        guardian: validGuardian,
        academic: validAcademic,
      })
    ).toBe(false)
  })

  it("returns false when all steps are undefined", () => {
    expect(validateAllSteps({})).toBe(false)
  })
})

describe("getStepValidationStatus", () => {
  it("returns correct status for each step", () => {
    const status = getStepValidationStatus({
      personal: validPersonal,
      guardian: validGuardian,
      academic: validAcademic,
    })

    // location is undefined so validateLocationStep returns false
    expect(status).toEqual({
      personal: true,
      location: false,
      guardian: true,
      academic: true,
    })
  })
})

describe("isValidEmail", () => {
  it("returns true for valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true)
  })

  it("returns false for email without @", () => {
    expect(isValidEmail("userexample.com")).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isValidEmail("")).toBe(false)
  })
})

describe("isValidPhone", () => {
  it("returns true for phone with 8+ digits", () => {
    expect(isValidPhone("+249-123-456-789")).toBe(true)
  })

  it("returns false for phone with fewer than 8 digits", () => {
    expect(isValidPhone("123")).toBe(false)
  })
})

describe("isValidDate", () => {
  it("returns true for valid date string", () => {
    expect(isValidDate("2010-03-15")).toBe(true)
  })

  it("returns false for invalid date string", () => {
    expect(isValidDate("not-a-date")).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isValidDate("")).toBe(false)
  })
})

describe("getAge", () => {
  it("calculates correct age", () => {
    const tenYearsAgo = new Date()
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10)
    tenYearsAgo.setMonth(0, 1) // January 1st to ensure birthday has passed
    const age = getAge(tenYearsAgo.toISOString().split("T")[0])
    expect(age).toBe(10)
  })

  it("subtracts one year when birthday has not yet occurred", () => {
    const futureThisYear = new Date()
    futureThisYear.setFullYear(futureThisYear.getFullYear() - 10)
    futureThisYear.setMonth(11, 31) // December 31st, birthday hasn't happened
    const age = getAge(futureThisYear.toISOString().split("T")[0])
    // If today is before Dec 31, age should be 9
    const today = new Date()
    if (
      today.getMonth() < 11 ||
      (today.getMonth() === 11 && today.getDate() < 31)
    ) {
      expect(age).toBe(9)
    } else {
      expect(age).toBe(10)
    }
  })
})
