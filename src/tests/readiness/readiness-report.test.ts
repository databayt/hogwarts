import { describe, expect, it } from "vitest"

import { reasonChip, reasonChips } from "@/components/school-dashboard/school/readiness/labels"
import {
  attendanceRatePercent,
  attentionList,
  joinChannel,
  lastDaysISO,
  membershipLink,
  okPercent,
} from "@/components/school-dashboard/school/readiness/overview"
import { allClassesReportText, classReportText } from "@/components/school-dashboard/school/readiness/whatsapp-text"

const card = {
  className: "الصف الثالث أ",
  supervisor: { name: "هدى", reasons: ["on_app" as const], canCover: true },
  classes: [
    {
      start: "08:30",
      subject: "الرياضيات",
      teacherName: "سمر",
      reasons: ["on_app" as const, "push_off" as const],
    },
  ],
  students: [
    { name: "أحمد", reasons: ["never_signed_in" as const] },
    { name: "علي", reasons: [] },
  ],
}

describe("labels", () => {
  it("builds chips in both languages", () => {
    expect(reasonChip("on_app", "ar")).toBe("✅ التطبيق")
    expect(reasonChip("push_off", "ar")).toBe("🔕 الإشعارات مقفولة")
    expect(reasonChip("android_web", "en")).toBe("⚠️ Android browser")
    expect(reasonChips([], "ar")).toBe("—")
  })
})

describe("classReportText", () => {
  it("renders the Arabic WhatsApp format", () => {
    expect(classReportText(card, "ar")).toBe(
      [
        "📋 الصف الثالث أ — حصص اليوم",
        "👩‍🏫 مشرفة الصف: أ. هدى — ✅ التطبيق",
        "تقدر تغطي أي حصة يغيب معلمها ✅",
        "",
        "المعلمين:",
        "• 08:30 الرياضيات — أ. سمر: ✅ التطبيق · 🔕 الإشعارات مقفولة",
        "",
        "الطلاب:",
        "• أحمد: ❌ ما سجّل دخول",
        "• علي: —",
      ].join("\n")
    )
  })

  it("warns when the supervisor cannot cover", () => {
    const text = classReportText(
      { ...card, supervisor: { ...card.supervisor!, canCover: false } },
      "ar"
    )
    expect(text).toContain("⚠️ عشان يوصلها تنبيه غياب المعلم")
    expect(text).not.toContain("تقدر تغطي")
  })

  it("handles no supervisor and empty sections", () => {
    const text = classReportText(
      { className: "X", supervisor: null, classes: [], students: [] },
      "en"
    )
    expect(text).toBe("📋 X — today's classes\n👩‍🏫 No supervisor assigned")
  })

  it("joins several cards", () => {
    const all = allClassesReportText([card, card], "ar")
    expect(all.split("📋").length).toBe(3)
  })
})

describe("overview helpers", () => {
  it("classifies join channels", () => {
    expect(joinChannel("app", "android")).toBe("app")
    expect(joinChannel("web", "android")).toBe("androidWeb")
    expect(joinChannel("web", "ios")).toBe("desktop")
    expect(joinChannel(null, null)).toBeNull()
  })

  it("computes ok percent", () => {
    expect(okPercent([])).toBeNull()
    expect(okPercent(["ok", "ok", "bad", "warn"])).toBe(50)
  })

  it("orders the attention list bad-first and drops ok", () => {
    const row = (
      id: string,
      level: "ok" | "warn" | "bad",
      reasons: any[]
    ) => ({
      userId: id,
      name: id,
      username: id,
      role: "STUDENT",
      sectionName: null,
      readiness: { level, reasons },
    })
    const list = attentionList(
      [
        row("a", "warn", ["push_off"]),
        row("b", "ok", ["on_app"]),
        row("c", "bad", ["never_signed_in"]),
      ],
      8
    )
    expect(list.map((m) => m.userId)).toEqual(["c", "a"])
    expect(attentionList([row("c", "bad", ["on_app", "never_signed_in"])])[0].reasons).toEqual(["never_signed_in"])
  })

  it("links to the membership lane", () => {
    expect(
      membershipLink("ar", { level: "bad", username: "a b", name: "n" })
    ).toBe("/ar/school/membership?status=bad&q=a%20b")
  })

  it("lists days and rates", () => {
    expect(lastDaysISO("2026-03-02", 3)).toEqual([
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ])
    expect(attendanceRatePercent(0, 0)).toBeNull()
    expect(attendanceRatePercent(8, 6)).toBe(75)
  })
})
