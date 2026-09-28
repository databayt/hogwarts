import { describe, expect, it } from "vitest"

import {
  bucket,
  chooseVariant,
  incumbentOf,
  langFor,
  MIN_SAMPLE,
  renderVariant,
  replyRate,
  variantStats,
  type LedgerRow,
  type Variant,
  type WaveLedger,
} from "@/lib/funnel/waves"

const v = (id: string, over: Partial<Variant> = {}): Variant => ({
  id,
  lane: "whatsapp",
  lang: "ar",
  active: true,
  parent: null,
  createdAt: "2026-08-22",
  body: ["مرحبا {school}", "{deck}"],
  ...over,
})

const row = (variant: string, events: LedgerRow["events"] = [], status: LedgerRow["status"] = "sent"): LedgerRow => ({
  companyId: Math.random().toString(36),
  name: "s",
  lane: "whatsapp",
  seg: "sd-A",
  to: "+249900000000",
  variant,
  at: "2026-09-28T00:00:00Z",
  status,
  events,
})

describe("renderVariant", () => {
  it("fills {school} and {deck} in subject and body", () => {
    const r = renderVariant(v("a", { subject: "عن {school}" }), { school: "مدرسة النيل", deck: "https://d" })
    expect(r.subject).toBe("عن مدرسة النيل")
    expect(r.text).toBe("مرحبا مدرسة النيل\nhttps://d")
  })
})

describe("variantStats + replyRate", () => {
  it("counts sends, ignores failed, excludes bounces from the denominator", () => {
    const l: WaveLedger = {
      wave: "w1",
      createdAt: "",
      rows: [
        row("a", [{ at: "", kind: "replied" }]),
        row("a", [{ at: "", kind: "bounced" }]),
        row("a"),
        row("a", [], "failed"),
      ],
    }
    const s = variantStats([l]).get("a")!
    expect(s.sent).toBe(3)
    expect(s.bounced).toBe(1)
    expect(s.replied).toBe(1)
    expect(replyRate(s)).toBeCloseTo(0.5)
  })
})

describe("chooseVariant", () => {
  it("one active variant → always it", () => {
    const vs = [v("wa-ar@1"), v("wa-ar@0", { active: false })]
    for (const id of ["x", "y", "z"]) expect(chooseVariant(id, "whatsapp", vs, new Map()).id).toBe("wa-ar@1")
  })

  it("is deterministic per company", () => {
    const vs = [v("a"), v("b", { createdAt: "2026-09-30" })]
    expect(chooseVariant("school-1", "whatsapp", vs, new Map()).id).toBe(
      chooseVariant("school-1", "whatsapp", vs, new Map()).id
    )
  })

  it("splits roughly 80/20 incumbent/challenger", () => {
    const vs = [v("old"), v("new", { createdAt: "2026-09-30" })]
    let challenger = 0
    for (let i = 0; i < 2000; i++) if (chooseVariant(`c${i}`, "whatsapp", vs, new Map()).id === "new") challenger++
    expect(challenger / 2000).toBeGreaterThan(0.15)
    expect(challenger / 2000).toBeLessThan(0.25)
  })

  it("the incumbent is the better proven variant, not merely the older", () => {
    const vs = [v("old"), v("new", { createdAt: "2026-09-30" })]
    const stats = new Map([
      ["old", { sent: MIN_SAMPLE, delivered: 0, bounced: 0, replied: 1, optedOut: 0 }],
      ["new", { sent: MIN_SAMPLE, delivered: 0, bounced: 0, replied: 4, optedOut: 0 }],
    ])
    expect(incumbentOf(vs, stats).id).toBe("new")
  })

  it("an unproven challenger does not displace the incumbent", () => {
    const vs = [v("old"), v("new", { createdAt: "2026-09-30" })]
    const stats = new Map([["new", { sent: 3, delivered: 0, bounced: 0, replied: 3, optedOut: 0 }]])
    expect(incumbentOf(vs, stats).id).toBe("old")
  })

  it("prefers the requested language, falls back to any active one in the lane", () => {
    const vs = [v("ar", { lane: "email" }), v("en", { lane: "email", lang: "en" })]
    expect(chooseVariant("x", "email", vs, new Map(), "en").id).toBe("en")
    expect(chooseVariant("x", "email", [vs[0]], new Map(), "en").id).toBe("ar")
  })

  it("throws when a lane has nothing active", () => {
    expect(() => chooseVariant("x", "email", [v("a")], new Map())).toThrow(/no active variant/)
  })
})

describe("bucket", () => {
  it("is stable and in 0–99", () => {
    expect(bucket("abc")).toBe(bucket("abc"))
    for (let i = 0; i < 100; i++) {
      const b = bucket(`k${i}`)
      expect(b).toBeGreaterThanOrEqual(0)
      expect(b).toBeLessThan(100)
    }
  })
})

describe("langFor", () => {
  it.each([
    ["American School of Doha", "gulf", "en"],
    ["Dubai College", "gulf", "en"],
    ["Khartoum International Community School (KICS)", "sd", "en"],
    ["Dhahran Ahsliyya Schools", "gulf", "ar"],
    ["St. Christopher's School Bahrain", "gulf", "en"],
    ["Cedar School", "gulf", "en"],
    ["Al Rawda Private School", "gulf", "ar"],
    ["Unity High School", "sd", "ar"],
    ["مدارس الخرطوم شرق الخاصة", "sd", "ar"],
    ["Khartoum international high schools مدارس الخرطو", "sd", "ar"],
    ["Anything", "other", "en"],
  ])("%s (%s) → %s", (name, rail, lang) => {
    expect(langFor(name, rail)).toBe(lang)
  })
})
