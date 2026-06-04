// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { buildOfferEmail } from "../admission"

const baseArgs = {
  parentName: "Ahmed Ali",
  studentName: "Sara Ali",
  applicationNumber: "APP-2026-0001",
  offerUrl: "https://demo.databayt.org/en/application/a-1/offer?token=tok",
  expiryDate: "2026-06-15",
}

describe("buildOfferEmail", () => {
  it("renders an English offer email with the registration link + expiry", () => {
    const { subject, html } = buildOfferEmail({
      school: { name: "Demo School", preferredLanguage: "en" },
      ...baseArgs,
    })

    expect(subject).toContain("APP-2026-0001")
    expect(html).toContain('dir="ltr"')
    expect(html).toContain("Ahmed Ali")
    expect(html).toContain("Sara Ali")
    // The offer link is present and clickable.
    expect(html).toContain(`href="${baseArgs.offerUrl}"`)
    expect(html).toContain("2026-06-15")
    expect(html).toContain("Demo School")
  })

  it("renders RTL Arabic when the school prefers Arabic", () => {
    const { html } = buildOfferEmail({
      school: { name: "مدرسة", preferredLanguage: "ar" },
      ...baseArgs,
    })
    expect(html).toContain('dir="rtl"')
    expect(html).toContain(`href="${baseArgs.offerUrl}"`)
  })

  it("omits the expiry line when no expiry date is supplied", () => {
    const { html } = buildOfferEmail({
      school: { name: "Demo School", preferredLanguage: "en" },
      ...baseArgs,
      expiryDate: undefined,
    })
    expect(html).not.toContain("valid until")
    // Link still present.
    expect(html).toContain(`href="${baseArgs.offerUrl}"`)
  })
})
