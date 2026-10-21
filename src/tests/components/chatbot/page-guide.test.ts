// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { appPath, pageGuide } from "@/components/chatbot/page-guide"
import routes from "@/components/chatbot/support-routes.json"

describe("pageGuide", () => {
  it("finds the guide for a page and the pages under it", () => {
    expect(pageGuide(routes, "/ar/attendance")?.slug).toBe("attendance")
    expect(pageGuide(routes, "/en/attendance/take")?.slug).toBe("attendance")
    expect(pageGuide(routes, "/en/finance/fees/structures")?.slug).toBe("fees")
  })

  it("gives a teacher the teaching guide and a student the joining one", () => {
    expect(pageGuide(routes, "/en/live", "teacher")?.slug).toBe("teach-live")
    expect(pageGuide(routes, "/en/live", "student")?.slug).toBe("live-classes")
  })

  it("has none for a page no guide is about", () => {
    expect(pageGuide(routes, "/en/dashboard")).toBeUndefined()
    expect(pageGuide(routes, "/en/attendancex")).toBeUndefined()
    expect(pageGuide(routes, undefined)).toBeUndefined()
  })

  it("strips only the locale", () => {
    expect(appPath("/ar")).toBe("/")
    expect(appPath("/arabic/x")).toBe("/arabic/x")
  })
})
