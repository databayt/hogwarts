import { describe, expect, it } from "vitest"

import { buildQueue, isJunkName } from "../../../../scripts/funnel/queue"

const row = (id: string, name: string, phone: string, extra = {}) => ({
  id,
  name,
  stage: "COLD",
  tier: "B",
  country: "SA",
  schoolPhone: phone,
  principalContact: null,
  outreachStatus: null,
  ...extra,
})

describe("buildQueue", () => {
  it("sends one message per recipient, to the shortest name", () => {
    const q = buildQueue([
      row("1", "مجمع الأمير سلطان التعليمي - القسم المتوسط", "+966557411272"),
      row("2", "مجمع الأمير سلطان التعليمي", "+966557411272"),
    ])
    expect(q.map((r) => r.id)).toEqual(["2"])
  })

  it("skips a recipient already messaged under another row", () => {
    const q = buildQueue([
      row("1", "Branch A", "+966557411272", { stage: "CONTACTED" }),
      row("2", "Branch B", "+966557411272"),
    ])
    expect(q).toHaveLength(0)
  })
})

describe("isJunkName", () => {
  it.each([
    ["لماذا أكاديمية السنار الحديثة ‼ رسالتنا : العمل معاً ... Facebook · Al Sanar 07‏/07‏/2024", true],
    ["Doha College", false],
    ["British International School Of Al Khobar المدرسة البريطانية العالمية بالخبر", false],
  ])("%s → %s", (name, junk) => expect(isJunkName(name)).toBe(junk))
})
