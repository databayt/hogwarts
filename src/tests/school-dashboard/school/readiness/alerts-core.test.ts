// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  alertKey,
  alertRecipients,
  androidWebPersonNotice,
  androidWebStaffNotice,
  digestCounts,
  digestDue,
  digestKey,
  isAndroidWebJoin,
  isDemoSchool,
  likelyAbsentTeachers,
  passwordTroubleNotice,
  planDigest,
  shouldAlertPasswordTrouble,
  type DigestMember,
} from "@/components/school-dashboard/school/readiness/alerts-core"

const m = (
  userId: string,
  role: string,
  reasons: DigestMember["reasons"],
  name = userId
): DigestMember => ({ userId, role, reasons, name })

describe("guard keys", () => {
  it("is one key per rule, person and school day", () => {
    expect(alertKey("android_web_join", "u1", "2026-11-24")).toBe(
      "android_web_join:u1:2026-11-24"
    )
    expect(alertKey("password_trouble", "u1", "2026-11-24")).not.toBe(
      alertKey("android_web_join", "u1", "2026-11-24")
    )
    expect(digestKey("s1", "2026-11-24")).toBe("digest:s1:2026-11-24")
  })
  it("skips the demo school", () => {
    expect(isDemoSchool("demo")).toBe(true)
    expect(isDemoSchool("alabidae")).toBe(false)
    expect(isDemoSchool(null)).toBe(false)
  })
})

describe("alertRecipients", () => {
  it("tells the person, then supervisor and admins, each once", () => {
    const r = alertRecipients({
      personUserId: "p",
      notifyPerson: true,
      supervisorUserIds: ["sup", null],
      adminUserIds: ["a1", "sup", "a2"],
    })
    expect(r.person).toBe("p")
    expect(r.staff).toEqual(["sup", "a1", "a2"])
  })
  it("never lists the person among the staff", () => {
    const r = alertRecipients({
      personUserId: "p",
      notifyPerson: true,
      supervisorUserIds: ["p"],
      adminUserIds: ["p", "a"],
    })
    expect(r.staff).toEqual(["a"])
  })
  it("leaves the person out when they cannot read it", () => {
    const r = alertRecipients({
      personUserId: "p",
      notifyPerson: false,
      supervisorUserIds: [],
      adminUserIds: ["a"],
    })
    expect(r.person).toBeNull()
    expect(r.staff).toEqual(["a"])
  })
})

describe("triggers", () => {
  it("fires password trouble at three failures", () => {
    expect(shouldAlertPasswordTrouble(2)).toBe(false)
    expect(shouldAlertPasswordTrouble(3)).toBe(true)
  })
  it("fires a join alert only for web on android", () => {
    expect(isAndroidWebJoin({ client: "web", platform: "android" })).toBe(true)
    expect(isAndroidWebJoin({ client: "app", platform: "android" })).toBe(false)
    expect(isAndroidWebJoin({ client: "web", platform: "ios" })).toBe(false)
    expect(isAndroidWebJoin(null)).toBe(false)
  })
})

describe("words", () => {
  it("speaks Arabic and English", () => {
    expect(androidWebPersonNotice("ar", { appName: "الإبداع" }).title).toBe(
      "افتح الحصة من تطبيق الإبداع"
    )
    expect(
      androidWebStaffNotice("ar", { name: "أحمد", className: "٣أ" }).body
    ).toBe("أحمد (٣أ) دخل الحصة من متصفح الأندرويد بدل التطبيق")
    expect(
      passwordTroubleNotice("ar", { name: "أحمد", className: "٣أ", count: 4 })
        .body
    ).toBe("أحمد (٣أ) ما قادر يسجّل دخول. جرّب 4 مرات")
    expect(
      passwordTroubleNotice("en", { name: "Sam", className: null, count: 3 })
        .body
    ).toBe("Sam cannot sign in. Tried 3 times")
  })
})

describe("digestDue", () => {
  const now = new Date("2026-11-24T05:05:00Z")
  const at = (min: number) => new Date(now.getTime() + min * 60_000)
  it("is due 60 to 120 minutes ahead", () => {
    for (const min of [60, 90, 120]) {
      expect(digestDue({ firstStart: at(min), now, alreadySent: false })).toBe(true)
    }
  })
  it("is not due outside the window, or when sent, or with no class", () => {
    expect(digestDue({ firstStart: at(59), now, alreadySent: false })).toBe(false)
    expect(digestDue({ firstStart: at(121), now, alreadySent: false })).toBe(false)
    expect(digestDue({ firstStart: at(-10), now, alreadySent: false })).toBe(false)
    expect(digestDue({ firstStart: at(90), now, alreadySent: true })).toBe(false)
    expect(digestDue({ firstStart: null, now, alreadySent: false })).toBe(false)
  })
  it("an hourly run at :05 hits every start time exactly once", () => {
    // a 07:30 first class: runs at 05:05 (145), 06:05 (85), 07:05 (25)
    const start = new Date("2026-11-24T07:30:00Z")
    const hits = [5, 6, 7].filter((h) =>
      digestDue({
        firstStart: start,
        now: new Date(`2026-11-24T0${h}:05:00Z`),
        alreadySent: false,
      })
    )
    expect(hits).toEqual([6])
  })
})

describe("digest counts and plan", () => {
  const s1 = m("s1", "STUDENT", ["on_app"])
  const s2 = m("s2", "STUDENT", ["android_web", "no_class_recent"])
  const s3 = m("s3", "STUDENT", ["never_signed_in", "password_trouble"])
  const t1 = m("t1", "TEACHER", ["on_app", "no_class_recent"], "Mr T")

  it("counts each person once", () => {
    expect(digestCounts([s1, s2, s3, t1, s1])).toEqual({
      onApp: 2,
      androidWeb: 1,
      notJoining: 3,
      passwordIssues: 1,
    })
  })
  it("names teachers likely absent", () => {
    expect(likelyAbsentTeachers([t1, m("t2", "TEACHER", ["on_app"])])).toEqual([
      "Mr T",
    ])
  })
  it("plans one notice per class supervisor and one per admin", () => {
    const plan = planDigest({
      lang: "ar",
      adminUserIds: ["admin"],
      classes: [
        { sectionName: "٣أ", supervisorUserId: "sup1", members: [s1, s2, t1] },
        { sectionName: "٣ب", supervisorUserId: "sup1", members: [s3] },
        { sectionName: "٤أ", supervisorUserId: null, members: [s1] },
        { sectionName: "٥أ", supervisorUserId: "admin", members: [s1] },
      ],
    })
    expect(plan.filter((p) => p.kind === "class_digest")).toHaveLength(2)
    expect(plan.filter((p) => p.userId === "admin")).toHaveLength(1)
    const first = plan[0]
    expect(first.title).toBe("جاهزية ٣أ اليوم")
    expect(first.body).toBe(
      "جاهزية ٣أ اليوم: 2 على التطبيق، 1 متصفح أندرويد، 2 ما بيدخلوا، 0 مشاكل دخول"
    )
    const school = plan.find((p) => p.kind === "school_digest")
    expect(school?.body).toContain("معلمون قد يغيبون: Mr T")
  })
  it("sends no admin summary when the school has no admins", () => {
    const plan = planDigest({
      lang: "en",
      adminUserIds: [],
      classes: [{ sectionName: "3A", supervisorUserId: "sup", members: [s1] }],
    })
    expect(plan.map((p) => p.kind)).toEqual(["class_digest"])
    expect(plan[0].body).toContain("1 on the app")
  })
})
