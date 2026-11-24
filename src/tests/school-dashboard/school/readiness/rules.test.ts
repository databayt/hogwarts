// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  memberReadiness,
  supervisorCanCover,
  worstLevel,
  type MemberReadinessInput,
} from "@/components/school-dashboard/school/readiness/rules"

const base = (over: Partial<MemberReadinessInput> = {}): MemberReadinessInput => ({
  role: "STUDENT",
  lastSeenAt: new Date("2026-11-23T10:00:00Z"),
  device: { client: "app", platform: "android", appVersion: 16 },
  attendance: { expected: 5, joined: 4 },
  failedSignIns3d: 0,
  pushOn: true,
  schoolHasOwnApp: true,
  minAppVersion: 15,
  ...over,
})

describe("memberReadiness", () => {
  it("a student on a current app who joins classes is ok (info only)", () => {
    const r = memberReadiness(base())
    expect(r.level).toBe("ok")
    expect(r.reasons).toEqual(["on_app"])
  })

  it("never signed in is bad", () => {
    const r = memberReadiness(
      base({
        lastSeenAt: null,
        device: { client: null, platform: null, appVersion: null },
        attendance: { expected: 0, joined: 0 },
      })
    )
    expect(r).toEqual({ level: "bad", reasons: ["never_signed_in"] })
  })

  it("joined 0 of >=1 expected classes is no_class_recent (bad)", () => {
    const r = memberReadiness(base({ attendance: { expected: 3, joined: 0 } }))
    expect(r.level).toBe("bad")
    expect(r.reasons).toContain("no_class_recent")
  })

  it("no classes expected is not no_class_recent", () => {
    const r = memberReadiness(base({ attendance: { expected: 0, joined: 0 } }))
    expect(r.reasons).not.toContain("no_class_recent")
  })

  it("android on the web when the school has its own app is android_web (warn)", () => {
    const r = memberReadiness(
      base({ device: { client: "web", platform: "android", appVersion: null } })
    )
    expect(r.level).toBe("warn")
    expect(r.reasons).toEqual(["android_web"])
  })

  it("android_web reads the last class join over the last-seen device", () => {
    const r = memberReadiness(
      base({ lastClassJoin: { client: "web", platform: "android" } })
    )
    expect(r.reasons).toContain("android_web")
  })

  it("android on the web is not flagged when the school has no app of its own", () => {
    const r = memberReadiness(
      base({
        schoolHasOwnApp: false,
        device: { client: "web", platform: "android", appVersion: null },
      })
    )
    expect(r.reasons).not.toContain("android_web")
    expect(r.level).toBe("ok")
  })

  it("web on ios/windows/mac/chromeos is allowed_web and stays ok", () => {
    for (const platform of ["ios", "windows", "mac", "chromeos"]) {
      const r = memberReadiness(
        base({ device: { client: "web", platform, appVersion: null } })
      )
      expect(r).toEqual({ level: "ok", reasons: ["allowed_web"] })
    }
    const linux = memberReadiness(
      base({ device: { client: "web", platform: "linux", appVersion: null } })
    )
    expect(linux.reasons).toEqual([])
  })

  it("an app build below the minimum is old_app (warn); null version is not", () => {
    const old = memberReadiness(
      base({ device: { client: "app", platform: "android", appVersion: 14 } })
    )
    expect(old.level).toBe("warn")
    expect(old.reasons).toEqual(["old_app", "on_app"])
    const unknown = memberReadiness(
      base({ device: { client: "app", platform: "android", appVersion: null } })
    )
    expect(unknown.reasons).toEqual(["on_app"])
  })

  it("minAppVersion defaults to 15", () => {
    const r = memberReadiness(
      base({
        minAppVersion: undefined,
        device: { client: "app", platform: "android", appVersion: 14 },
      })
    )
    expect(r.reasons).toContain("old_app")
  })

  it("3 failed sign-ins in 3 days is password_trouble (bad); 2 is not", () => {
    expect(memberReadiness(base({ failedSignIns3d: 3 })).level).toBe("bad")
    expect(memberReadiness(base({ failedSignIns3d: 3 })).reasons).toContain(
      "password_trouble"
    )
    expect(memberReadiness(base({ failedSignIns3d: 2 })).reasons).not.toContain(
      "password_trouble"
    )
  })

  it("push_off applies to teachers only", () => {
    const teacher = memberReadiness(base({ role: "TEACHER", pushOn: false }))
    expect(teacher.level).toBe("warn")
    expect(teacher.reasons).toContain("push_off")
    const student = memberReadiness(base({ role: "STUDENT", pushOn: false }))
    expect(student.reasons).not.toContain("push_off")
  })

  it("the level is the worst non-info reason; reasons come worst-first", () => {
    const r = memberReadiness(
      base({
        role: "TEACHER",
        pushOn: false,
        failedSignIns3d: 4,
        device: { client: "app", platform: "android", appVersion: 10 },
      })
    )
    expect(r.level).toBe("bad")
    expect(r.reasons).toEqual(["password_trouble", "old_app", "push_off", "on_app"])
  })
})

describe("supervisorCanCover", () => {
  const member = (over: Partial<MemberReadinessInput> = {}) => {
    const input = base({ role: "TEACHER", ...over })
    return { readiness: memberReadiness(input), pushOn: input.pushOn }
  }

  it("on the app with push on and a clean password can cover", () => {
    expect(supervisorCanCover(member())).toBe(true)
  })
  it("allowed web counts", () => {
    expect(
      supervisorCanCover(
        member({ device: { client: "web", platform: "windows", appVersion: null } })
      )
    ).toBe(true)
  })
  it("android on the web cannot", () => {
    expect(
      supervisorCanCover(
        member({ device: { client: "web", platform: "android", appVersion: null } })
      )
    ).toBe(false)
  })
  it("push off cannot", () => {
    expect(supervisorCanCover(member({ pushOn: false }))).toBe(false)
  })
  it("password trouble cannot", () => {
    expect(supervisorCanCover(member({ failedSignIns3d: 3 }))).toBe(false)
  })
})

describe("worstLevel", () => {
  it("picks the worst", () => {
    expect(worstLevel([])).toBe("ok")
    expect(worstLevel(["ok", "warn"])).toBe("warn")
    expect(worstLevel(["warn", "bad", "ok"])).toBe("bad")
  })
})
