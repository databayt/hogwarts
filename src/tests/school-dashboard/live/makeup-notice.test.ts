// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  makeupAudience,
  makeupNotice,
  MAKEUP_NOTICE_TYPE,
} from "@/components/school-dashboard/live/makeup-notice"

describe("makeupAudience", () => {
  it("is the teacher, the students and the guardians — each once", () => {
    expect(
      makeupAudience({
        teacherUserId: "t",
        studentUserIds: ["s1", "s2", null],
        guardianUserIds: ["g1", "s1", undefined],
      }).sort()
    ).toEqual(["g1", "s1", "s2", "t"])
  })
  it("leaves out whoever just did it", () => {
    expect(
      makeupAudience({
        teacherUserId: "t",
        studentUserIds: ["s1"],
        guardianUserIds: [],
        actorUserId: "t",
      })
    ).toEqual(["s1"])
  })
  it("is empty when nobody is on the roster", () => {
    expect(makeupAudience({ studentUserIds: [], guardianUserIds: [] })).toEqual([])
  })
})

describe("makeupNotice", () => {
  const vars = { what: "الرياضيات", day: "الأحد ٢٩ نوفمبر", time: "١٠:٠٠" }
  it("says the missed class has a new time", () => {
    expect(makeupNotice("booked", "ar", vars).body).toBe(
      "حصة الرياضيات الفائتة صار لها موعد تعويضي: الأحد ٢٩ نوفمبر الساعة ١٠:٠٠"
    )
  })
  it("has a moved and a cancelled wording, in both languages", () => {
    for (const lang of ["ar", "en"] as const) {
      for (const kind of ["booked", "moved", "cancelled"] as const) {
        const n = makeupNotice(kind, lang, vars)
        expect(n.title.length).toBeGreaterThan(0)
        expect(n.body).toContain("١٠:٠٠")
        expect(n.body + n.title).not.toMatch(/\{(what|day|time)\}/)
      }
    }
  })
  it("maps each kind to its own notification type", () => {
    expect(MAKEUP_NOTICE_TYPE).toEqual({
      booked: "live_class_makeup_booked",
      moved: "live_class_makeup_moved",
      cancelled: "live_class_makeup_cancelled",
    })
  })
})
