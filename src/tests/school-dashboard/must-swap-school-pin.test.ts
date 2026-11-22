import { describe, expect, it, vi } from "vitest"

vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn(),
}))

import { mustSwapSchoolPin } from "@/components/school-dashboard/must-change-password-gate"

describe("mustSwapSchoolPin", () => {
  it("lets students and parents keep the school's PIN", () => {
    expect(mustSwapSchoolPin("STUDENT")).toBe(false)
    expect(mustSwapSchoolPin("GUARDIAN")).toBe(false)
  })

  it("still makes staff choose their own", () => {
    for (const role of ["TEACHER", "ADMIN", "STAFF", "ACCOUNTANT", null])
      expect(mustSwapSchoolPin(role)).toBe(true)
  })
})
