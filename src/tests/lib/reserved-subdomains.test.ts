import { describe, expect, it } from "vitest"
import { isReservedSubdomain, RESERVED_SUBDOMAINS } from "@/lib/reserved-subdomains"
import { trialSignupSchema } from "@/components/saas-marketing/validation"

const trial = (subdomain: string) => trialSignupSchema.safeParse({
  schoolName: "Test School", subdomain, adminEmail: "a@b.com",
  adminName: "Admin", password: "Passw0rd", termsAccepted: true,
})

describe("reserved subdomains", () => {
  it("reserves every live host on the *.databayt.org wildcard", () => {
    for (const s of ["hogwarts", "mkan", "sijillee", "moallimee", "app", "crm", "ed", "kun", "cdn", "www"])
      expect(isReservedSubdomain(s), s).toBe(true)
  })
  it("is case- and whitespace-insensitive", () => {
    expect(isReservedSubdomain("  HogWarts ")).toBe(true)
  })
  it("still allows an ordinary school name", () => {
    for (const s of ["king-fahad", "alqabs", "albayan"]) expect(isReservedSubdomain(s), s).toBe(false)
  })
  it("has no duplicates", () => {
    expect(new Set(RESERVED_SUBDOMAINS).size).toBe(RESERVED_SUBDOMAINS.length)
  })
  it("blocks a reserved name on the PUBLIC trial signup path", () => {
    expect(trial("hogwarts").success).toBe(false)
    expect(trial("cdn").success).toBe(false)
  })
  it("still accepts a real school on the trial path", () => {
    expect(trial("king-fahad").success).toBe(true)
  })
})
