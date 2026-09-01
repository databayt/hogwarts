// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// What each role is offered on the landing page. The old page gated only two
// buttons, so a student read admin setup instructions on every visit and an
// ACCOUNTANT was shown a "Join now" the permission layer would have refused.

import { describe, expect, it } from "vitest"

import { cardsFor } from "@/components/school-dashboard/live/landing/role-guide"
import {
  canOpenLanding,
  resolveLandingViewer,
} from "@/components/school-dashboard/live/landing/viewer"

const keys = (role: string) =>
  cardsFor(resolveLandingViewer(role), "en").map((c) => c.key)

describe("canOpenLanding", () => {
  it("admits every school role", () => {
    for (const role of [
      "DEVELOPER",
      "ADMIN",
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "STAFF",
      "ACCOUNTANT",
    ]) {
      expect(canOpenLanding(role)).toBe(true)
    }
  })

  it("turns away a role with no school", () => {
    // USER has no schoolId — it belongs in onboarding, not a school's block.
    expect(canOpenLanding("USER")).toBe(false)
    expect(canOpenLanding("")).toBe(false)
  })
})

describe("resolveLandingViewer", () => {
  it("gives configure rights to ADMIN and DEVELOPER only", () => {
    expect(resolveLandingViewer("ADMIN").canConfigure).toBe(true)
    expect(resolveLandingViewer("DEVELOPER").canConfigure).toBe(true)
    for (const role of ["TEACHER", "STUDENT", "GUARDIAN", "STAFF", "ACCOUNTANT"]) {
      expect(resolveLandingViewer(role).canConfigure).toBe(false)
    }
  })

  it("lets a teacher schedule and host, but not configure the school", () => {
    const t = resolveLandingViewer("TEACHER")
    expect(t.canSchedule).toBe(true)
    expect(t.isHost).toBe(true)
    expect(t.canConfigure).toBe(false)
  })

  it("never offers ACCOUNTANT a join or a recording", () => {
    // It passes read_school_dashboard and sees every session, but
    // authorization.ts grants it neither join_as_* nor view_recordings.
    const a = resolveLandingViewer("ACCOUNTANT")
    expect(a.canJoin).toBe(false)
    expect(a.canViewRecordings).toBe(false)
  })

  it("lets a student and a guardian join, but not schedule", () => {
    for (const role of ["STUDENT", "GUARDIAN"]) {
      const v = resolveLandingViewer(role)
      expect(v.canJoin).toBe(true)
      expect(v.canSchedule).toBe(false)
      expect(v.isHost).toBe(false)
    }
  })
})

describe("cardsFor", () => {
  it("gives an admin the two surfaces only it can reach", () => {
    expect(keys("ADMIN")).toContain("settings")
    expect(keys("ADMIN")).toContain("schedule")
  })

  it("never offers settings or the network test to anyone else", () => {
    for (const role of ["TEACHER", "STUDENT", "GUARDIAN", "STAFF", "ACCOUNTANT"]) {
      expect(keys(role)).not.toContain("settings")
      expect(keys(role)).not.toContain("network")
    }
  })

  it("points a student at their own timetable, not the schedule form", () => {
    const cards = cardsFor(resolveLandingViewer("STUDENT"), "en")
    expect(cards.map((c) => c.key)).toContain("timetable")
    expect(cards.map((c) => c.key)).not.toContain("schedule")
    expect(cards.find((c) => c.key === "timetable")?.href).toBe("/en/timetable")
  })

  it("points a guardian at the parent portal instead", () => {
    const cards = cardsFor(resolveLandingViewer("GUARDIAN"), "en")
    expect(cards.find((c) => c.key === "timetable")?.href).toBe("/en/parent")
  })

  it("offers ACCOUNTANT the session list and nothing it cannot use", () => {
    expect(keys("ACCOUNTANT")).toEqual(["sessions"])
  })

  it("never renders more than four cards", () => {
    for (const role of [
      "DEVELOPER",
      "ADMIN",
      "TEACHER",
      "STUDENT",
      "GUARDIAN",
      "STAFF",
      "ACCOUNTANT",
    ]) {
      expect(cardsFor(resolveLandingViewer(role), "en").length).toBeLessThanOrEqual(4)
    }
  })

  it("carries the locale into every href", () => {
    for (const card of cardsFor(resolveLandingViewer("ADMIN"), "ar")) {
      expect(card.href.startsWith("/ar/")).toBe(true)
      // Client-facing paths never carry the internal /s/{subdomain} segment.
      expect(card.href).not.toContain("/s/")
    }
  })
})
