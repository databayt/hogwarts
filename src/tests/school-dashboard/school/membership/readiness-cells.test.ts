// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node

import { describe, expect, it } from "vitest"

import {
  attendancePct,
  buildReminderMessage,
  csvCell,
  deviceKind,
  deviceText,
  hasClasses,
  reasonHintKey,
  reasonLabel,
  reasonLabelKey,
  relativeLastSeen,
  visibleReasons,
} from "@/components/school-dashboard/school/membership/readiness-cells"

const NOW = new Date("2026-11-24T12:00:00Z")
const ago = (ms: number) => new Date(NOW.getTime() - ms)
const DAY = 86_400_000

describe("reason keys", () => {
  it("maps a code to flat dictionary keys", () => {
    expect(reasonLabelKey("android_web")).toBe("readiness_reason_android_web")
    expect(reasonHintKey("push_off")).toBe("readiness_hint_push_off")
  })
  it("falls back to a humanised code when the key is missing", () => {
    expect(reasonLabel({}, "old_app")).toBe("old app")
    expect(reasonLabel({ readiness_reason_old_app: "قديم" }, "old_app")).toBe(
      "قديم"
    )
  })
  it("hides info-only reasons from chips", () => {
    expect(
      visibleReasons(["android_web", "allowed_web", "on_app", "push_off"])
    ).toEqual(["android_web", "push_off"])
  })
})

describe("attendancePct", () => {
  it("is null when nothing was expected", () => {
    expect(attendancePct({ expected: 0, joined: 0 })).toBeNull()
  })
  it("rounds and clamps", () => {
    expect(attendancePct({ expected: 3, joined: 2 })).toBe(67)
    expect(attendancePct({ expected: 4, joined: 0 })).toBe(0)
    expect(attendancePct({ expected: 2, joined: 5 })).toBe(100)
  })
})

describe("relativeLastSeen", () => {
  it("is null when never seen", () => {
    expect(relativeLastSeen(null, NOW, "ar")).toBeNull()
  })
  it("reads relative in English", () => {
    expect(relativeLastSeen(ago(3 * DAY), NOW, "en")).toBe("3 days ago")
    expect(relativeLastSeen(ago(2 * 3_600_000), NOW, "en")).toBe("2 hours ago")
    expect(relativeLastSeen(ago(5 * 60_000), NOW, "en")).toBe("5 minutes ago")
  })
  it("reads relative in Arabic", () => {
    const out = relativeLastSeen(ago(3 * DAY), NOW, "ar")
    expect(out).toBeTruthy()
    expect(out).not.toMatch(/ago/)
  })
  it("switches to a date after two weeks", () => {
    const out = relativeLastSeen(ago(30 * DAY), NOW, "en")
    expect(out).toMatch(/Oct/)
    expect(out).not.toMatch(/ago/)
  })
})

describe("device helpers", () => {
  it("classifies the client", () => {
    expect(deviceKind("app")).toBe("app")
    expect(deviceKind("web")).toBe("web")
    expect(deviceKind(null)).toBe("unknown")
  })
  it("renders export text", () => {
    expect(
      deviceText({ deviceClient: "app", devicePlatform: "android", appVersion: 16 })
    ).toBe("App v16")
    expect(
      deviceText({ deviceClient: "web", devicePlatform: "android", appVersion: null })
    ).toBe("Web (Android)")
    expect(
      deviceText({ deviceClient: null, devicePlatform: null, appVersion: null })
    ).toBe("")
  })
  it("knows which roles attend classes", () => {
    expect(hasClasses("STUDENT")).toBe(true)
    expect(hasClasses("TEACHER")).toBe(true)
    expect(hasClasses("ADMIN")).toBe(false)
    expect(hasClasses("GUARDIAN")).toBe(false)
    expect(hasClasses("ACCOUNTANT")).toBe(false)
  })
  it("escapes csv cells", () => {
    expect(csvCell('a"b')).toBe('"a""b"')
    expect(csvCell(null)).toBe('""')
    expect(csvCell(0)).toBe('"0"')
  })
})

describe("buildReminderMessage", () => {
  const apk = "https://x/app.apk"
  it("sends the APK for android_web", () => {
    const m = buildReminderMessage(["android_web"], "ar", apk)
    expect(m.body).toContain("افتح الحصص من تطبيق المدرسة")
    expect(m.body).toContain(apk)
  })
  it("combines reasons", () => {
    const m = buildReminderMessage(
      ["password_trouble", "push_off", "never_signed_in"],
      "ar",
      apk
    )
    expect(m.body).toContain("فعّل الإشعارات")
    expect(m.body).toContain("كلّم مشرفة الصف")
    expect(m.body).toContain("ادخل من التطبيق")
  })
  it("is empty when only info reasons exist", () => {
    expect(buildReminderMessage(["on_app"], "en", apk).body).toBe("")
  })
  it("speaks English for English schools", () => {
    expect(buildReminderMessage(["push_off"], "en", apk).body).toBe(
      "Turn on notifications"
    )
  })
})
