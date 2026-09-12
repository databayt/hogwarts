// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { buildPushPayload } from "@/lib/notifications/push-web"

// The bytes the service worker's `push` handler reads. The sender itself
// talks to a push service and the database; this covers the pure half.

describe("buildPushPayload", () => {
  it("carries title, body, deep link, and a tag that collapses duplicates", () => {
    const p = buildPushPayload({
      notificationId: "n1",
      title: "غياب",
      body: "أحمد غائب اليوم",
      lang: "ar",
      url: "https://demo.balqalam.com/ar/parent/attendance",
    })
    expect(p).toEqual({
      title: "غياب",
      body: "أحمد غائب اليوم",
      url: "https://demo.balqalam.com/ar/parent/attendance",
      tag: "n-n1",
      lang: "ar",
      dir: "rtl",
    })
  })

  it("defaults to Arabic RTL and switches to LTR for English rows", () => {
    expect(buildPushPayload({ notificationId: "a", title: "t", body: "b", url: "/" }).dir).toBe("rtl")
    expect(
      buildPushPayload({ notificationId: "a", title: "t", body: "b", lang: "en", url: "/" })
    ).toMatchObject({ lang: "en", dir: "ltr" })
  })

  it("truncates a long body so the notification stays readable", () => {
    const p = buildPushPayload({
      notificationId: "a",
      title: "t",
      body: "x".repeat(400),
      url: "/",
    })
    expect(p.body.length).toBe(240)
    expect(p.body.endsWith("…")).toBe(true)
  })
})
