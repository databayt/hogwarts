import { describe, expect, it } from "vitest"

import { normalizePhone } from "../../../scripts/crm/normalize-contacts"

const n = (raw: string, c: string) => normalizePhone(raw, c)

describe("normalizePhone", () => {
  it("keeps E.164 as-is and calls it mobile where it is", () => {
    expect(n("+966127329494", "SA")).toMatchObject({
      e164: "+966127329494",
      reach: "LANDLINE",
    })
    expect(n("+971 50 894 5678", "AE")).toMatchObject({
      e164: "+971508945678",
      reach: "MOBILE",
    })
  })
  it("expands a national number using the country column", () => {
    expect(n("0912303865", "SD")).toMatchObject({
      e164: "+249912303865",
      reach: "MOBILE",
    })
    expect(n("0505094962", "AE")).toMatchObject({
      e164: "+971505094962",
      reach: "MOBILE",
    })
    expect(n("053 354 8222", "SA")).toMatchObject({
      e164: "+966533548222",
      reach: "MOBILE",
    })
    expect(n("01257527679", "EG")).toMatchObject({
      e164: "+201257527679",
      reach: "MOBILE",
    })
  })
  it("strips separators and the 00 international prefix", () => {
    expect(n("04-3400888", "AE").e164).toBe("+97143400888")
    expect(n("444-78-333", "QA").e164).toBe("+97444478333")
  })
  it("trusts a country code in the number over a wrong country column", () => {
    // stored under OTHER / EG, but the number itself says Bahrain / Kuwait
    expect(n("0097317605000", "OTHER")).toMatchObject({ e164: "+97317605000" })
    expect(n("0096551606062", "EG")).toMatchObject({
      e164: "+96551606062",
      reach: "MOBILE",
    })
  })
  it("recognises an international number that lost its plus", () => {
    expect(n("97143073000", "AE").e164).toBe("+97143073000")
  })
  it("refuses toll-free and service lines rather than pretending they are leads", () => {
    expect(n("8002326", "AE")).toMatchObject({
      e164: null,
      reach: "NOT_DIALABLE",
    })
    expect(n("800 394448", "AE").e164).toBeNull()
    expect(n("0920020282", "SA").e164).toBeNull()
  })
  it("refuses wrong-length and empty input instead of emitting a bad number", () => {
    expect(n("5744274", "SA").e164).toBeNull()
    expect(n("", "SA")).toMatchObject({ e164: null, why: "empty" })
    expect(n("0163643621", "XX").e164).toBeNull() // unknown market
  })
  it("separates landlines, which can be called but never WhatsApped", () => {
    expect(n("0126611004", "SA").reach).toBe("LANDLINE")
    expect(n("0567199058", "SA").reach).toBe("MOBILE")
  })
})

describe("normalizePhone — dirty imports", () => {
  it("decodes URL-encoded numbers left by an earlier import", () => {
    expect(normalizePhone("+971%202%20501%204777", "AE").e164).toBe(
      "+97125014777"
    )
    expect(normalizePhone("+971%204%20515%209000", "AE").e164).toBe(
      "+97145159000"
    )
  })
  it("handles a UK head-office number on a Gulf school", () => {
    expect(normalizePhone("(+44) 020 7131 0000", "AE")).toMatchObject({
      e164: "+442071310000",
      reach: "LANDLINE",
    })
  })
})
