// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { isOldAppCopy } from "@/components/school-dashboard/live/android-app"

const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/130"
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)"

describe("isOldAppCopy", () => {
  it("flags a standalone Android window of a school with its own app", () => {
    expect(
      isOldAppCopy({ standalone: true, ua: ANDROID, hasOwnApp: true })
    ).toBe(true)
  })
  it("leaves other schools, browsers and iOS alone", () => {
    expect(
      isOldAppCopy({ standalone: true, ua: ANDROID, hasOwnApp: false })
    ).toBe(false)
    expect(
      isOldAppCopy({ standalone: false, ua: ANDROID, hasOwnApp: true })
    ).toBe(false)
    expect(
      isOldAppCopy({ standalone: true, ua: IPHONE, hasOwnApp: true })
    ).toBe(false)
    expect(isOldAppCopy({ standalone: true, ua: null, hasOwnApp: true })).toBe(
      false
    )
  })
})
