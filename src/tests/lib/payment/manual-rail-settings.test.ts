// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { SchoolPaymentSettings } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"

import {
  filterConfiguredManualRails,
  isManualRailConfigured,
  resolveWalletDetails,
  walletCheckoutMetadata,
} from "@/lib/payment/manual-rail-settings"
import { resolveAvailableMethods } from "@/lib/payment/provider"

// The module imports `db` only for getSchoolPaymentSettings, which these tests
// don't exercise — stub it so importing the module doesn't reach for a DB.
vi.mock("@/lib/db", () => ({
  db: { schoolPaymentSettings: { findUnique: vi.fn() } },
}))

function settings(
  overrides: Partial<SchoolPaymentSettings> = {}
): SchoolPaymentSettings {
  return {
    id: "sps-1",
    schoolId: "school-1",
    bankakEnabled: false,
    bankakAccountName: null,
    bankakAccountNumber: null,
    bankakQrUrl: null,
    bankakInstructions: null,
    cashiEnabled: false,
    cashiAccountName: null,
    cashiMerchantCode: null,
    cashiQrUrl: null,
    cashiInstructions: null,
    reminderLadderDays: [7, 3, 1],
    overdueLadderDays: [1, 7, 14, 30],
    bursarEscalationDays: 14,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as SchoolPaymentSettings
}

const BANKAK_ON = settings({
  bankakEnabled: true,
  bankakAccountName: "مدرسة الملك فهد",
  bankakAccountNumber: "1234567890",
  bankakQrUrl: "https://cdn.example/bankak-qr.png",
})

const CASHI_ON = settings({
  cashiEnabled: true,
  cashiAccountName: "King Fahad Schools",
  cashiMerchantCode: "CASHI-99887",
})

describe("isManualRailConfigured", () => {
  it("requires BOTH the enable flag and an account number for bankak", () => {
    expect(isManualRailConfigured("bankak", BANKAK_ON)).toBe(true)
    // Enabled but no account = a "pay here" card with nothing to pay to.
    expect(
      isManualRailConfigured(
        "bankak",
        settings({ bankakEnabled: true, bankakAccountNumber: null })
      )
    ).toBe(false)
    // Account present but switched off.
    expect(
      isManualRailConfigured(
        "bankak",
        settings({ bankakEnabled: false, bankakAccountNumber: "123" })
      )
    ).toBe(false)
  })

  it("requires BOTH the enable flag and a merchant code for cashi", () => {
    expect(isManualRailConfigured("cashi", CASHI_ON)).toBe(true)
    expect(
      isManualRailConfigured(
        "cashi",
        settings({ cashiEnabled: true, cashiMerchantCode: null })
      )
    ).toBe(false)
  })

  it("never gates cash / bank_transfer (they source details elsewhere)", () => {
    expect(isManualRailConfigured("cash", null)).toBe(true)
    expect(isManualRailConfigured("bank_transfer", null)).toBe(true)
  })

  it("leaves online rails untouched", () => {
    expect(isManualRailConfigured("stripe", null)).toBe(true)
    expect(isManualRailConfigured("tap", null)).toBe(true)
  })
})

describe("filterConfiguredManualRails", () => {
  it("drops unconfigured wallet rails but keeps everything else", () => {
    const resolved = ["bankak", "cashi", "cash", "bank_transfer"] as const
    expect(filterConfiguredManualRails([...resolved], BANKAK_ON)).toEqual([
      "bankak",
      "cash",
      "bank_transfer",
    ])
  })

  it("drops both wallets when the school has no settings row at all", () => {
    expect(
      filterConfiguredManualRails(["bankak", "cashi", "cash"], null)
    ).toEqual(["cash"])
  })
})

// The bug this whole change exists to fix.
describe("Sudan (SD/SDG) end-to-end gateway resolution", () => {
  it("REGRESSION: a configured Sudan school is offered bankak + cashi", () => {
    // Before the bankak rewrite this resolved to [] for the wallet rails:
    // bankak.isConfigured() required BANKAK_MERCHANT_ID, which was never
    // issued, so resolveAvailableMethods dropped it and SD schools had no
    // payment path (Stripe rejects SDG; Tap does not cover SD).
    const resolved = resolveAvailableMethods("SD", "Africa/Khartoum", "SDG")

    expect(resolved).toContain("bankak")
    expect(resolved).toContain("cashi")
    expect(resolved).not.toContain("stripe")
    expect(resolved).not.toContain("tap")

    const both = settings({
      bankakEnabled: true,
      bankakAccountNumber: "1234567890",
      cashiEnabled: true,
      cashiMerchantCode: "CASHI-99887",
    })
    const offered = filterConfiguredManualRails(resolved, both)
    expect(offered.length).toBeGreaterThan(0)
    expect(offered).toContain("bankak")
    expect(offered).toContain("cashi")
  })

  it("offers only what the school actually configured", () => {
    const resolved = resolveAvailableMethods("SD", "Africa/Khartoum", "SDG")
    const offered = filterConfiguredManualRails(resolved, CASHI_ON)

    expect(offered).toContain("cashi")
    expect(offered).not.toContain("bankak")
  })
})

describe("walletCheckoutMetadata", () => {
  it("emits only configured rails, omitting blank optionals", () => {
    const meta = walletCheckoutMetadata(BANKAK_ON)

    expect(meta.bankakAccountNumber).toBe("1234567890")
    expect(meta.bankakQrUrl).toBe("https://cdn.example/bankak-qr.png")
    expect(meta.bankakInstructions).toBeUndefined()
    expect(meta.cashiMerchantCode).toBeUndefined()
  })

  it("returns an empty bag when the school has no settings", () => {
    expect(walletCheckoutMetadata(null)).toEqual({})
  })

  it("never leaks an account for a rail that is switched off", () => {
    const meta = walletCheckoutMetadata(
      settings({ bankakEnabled: false, bankakAccountNumber: "1234567890" })
    )
    expect(meta.bankakAccountNumber).toBeUndefined()
  })
})

describe("resolveWalletDetails", () => {
  it("maps bankak settings onto WalletDetails with the reference", () => {
    const wallet = resolveWalletDetails("bankak", BANKAK_ON, "BNKK-ABC123")

    expect(wallet).toEqual({
      provider: "bankak",
      accountName: "مدرسة الملك فهد",
      accountNumber: "1234567890",
      qrUrl: "https://cdn.example/bankak-qr.png",
      instructions: undefined,
      reference: "BNKK-ABC123",
    })
  })

  it("maps cashi's merchant code into accountNumber", () => {
    const wallet = resolveWalletDetails("cashi", CASHI_ON, "CASH-XYZ789")

    expect(wallet?.provider).toBe("cashi")
    expect(wallet?.accountNumber).toBe("CASHI-99887")
    expect(wallet?.reference).toBe("CASH-XYZ789")
  })

  it("returns undefined for an unconfigured rail rather than a blank card", () => {
    expect(resolveWalletDetails("bankak", CASHI_ON, "REF")).toBeUndefined()
    expect(resolveWalletDetails("cashi", null, "REF")).toBeUndefined()
  })
})
