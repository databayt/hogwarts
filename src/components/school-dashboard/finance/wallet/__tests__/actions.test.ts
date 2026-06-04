// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/lib/db", () => ({
  db: {
    wallet: { update: vi.fn() },
    walletTransaction: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// Hoist a mutable holder so each test can swap the postWalletTopup behavior
// without re-importing the action under test.
const ledgerMock = vi.hoisted(() => ({
  postWalletTopup: vi.fn(),
}))

vi.mock("../../lib/accounting/actions", () => ledgerMock)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SCHOOL_ID = "test-school-id" // matches global auth mock in src/test/setup.ts
const WALLET_ID = "wal-1"
const TRANSACTION_ID = "txn-1"
const TOPUP_DATE = new Date("2026-05-25T10:00:00Z")

function buildFormData(
  overrides: Partial<Record<string, string>> = {}
): FormData {
  const fd = new FormData()
  fd.set("walletId", overrides.walletId ?? WALLET_ID)
  fd.set("amount", overrides.amount ?? "150")
  fd.set("paymentMethod", overrides.paymentMethod ?? "CASH")
  if (overrides.description !== undefined)
    fd.set("description", overrides.description)
  return fd
}

function stubSuccessfulTransaction() {
  const wallet = { id: WALLET_ID, balance: 250, schoolId: SCHOOL_ID }
  const transaction = {
    id: TRANSACTION_ID,
    walletId: WALLET_ID,
    amount: 150,
    createdAt: TOPUP_DATE,
  }
  vi.mocked(db.$transaction).mockImplementation(async (cb: any) => {
    // Invoke the callback with a stub `tx` so any nested side effects are reachable
    // if the action evolves. The mock returns whatever the callback returns.
    return cb({
      wallet: { update: vi.fn().mockResolvedValue(wallet) },
      walletTransaction: { create: vi.fn().mockResolvedValue(transaction) },
    })
  })
  return { wallet, transaction }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("wallet/actions — topupWallet ledger wiring (issue #330)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ledgerMock.postWalletTopup.mockReset()
    ledgerMock.postWalletTopup.mockResolvedValue({ success: true })
  })

  it("posts to the ledger after a successful top-up with the schoolId, transactionId, amount, and topupDate", async () => {
    const { transaction } = stubSuccessfulTransaction()

    const { topupWallet } = await import("../actions")
    const result = await topupWallet(buildFormData())

    expect(result.success).toBe(true)
    expect(ledgerMock.postWalletTopup).toHaveBeenCalledTimes(1)
    expect(ledgerMock.postWalletTopup).toHaveBeenCalledWith(SCHOOL_ID, {
      transactionId: transaction.id,
      amount: 150,
      topupDate: transaction.createdAt,
    })
  })

  it("returns success even when the ledger post resolves with success=false (fire-and-forget by design)", async () => {
    stubSuccessfulTransaction()
    ledgerMock.postWalletTopup.mockResolvedValue({
      success: false,
      errors: ["accounts not initialized"],
    })
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {})

    const { topupWallet } = await import("../actions")
    const result = await topupWallet(buildFormData())

    expect(result.success).toBe(true)
    expect(consoleErr).toHaveBeenCalledWith(
      "[topupWallet] postWalletTopup failed:",
      ["accounts not initialized"]
    )
    consoleErr.mockRestore()
  })

  it("returns success even when the ledger post throws (e.g., import failure)", async () => {
    stubSuccessfulTransaction()
    ledgerMock.postWalletTopup.mockRejectedValue(new Error("boom"))
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {})

    const { topupWallet } = await import("../actions")
    const result = await topupWallet(buildFormData())

    expect(result.success).toBe(true)
    expect(consoleErr).toHaveBeenCalledWith(
      "[topupWallet] Ledger posting threw (continuing):",
      expect.any(Error)
    )
    consoleErr.mockRestore()
  })

  it("does not call the ledger when the wallet $transaction throws", async () => {
    vi.mocked(db.$transaction).mockRejectedValue(new Error("db unavailable"))
    const consoleErr = vi.spyOn(console, "error").mockImplementation(() => {})

    const { topupWallet } = await import("../actions")
    const result = await topupWallet(buildFormData())

    expect(result.success).toBe(false)
    expect(ledgerMock.postWalletTopup).not.toHaveBeenCalled()
    consoleErr.mockRestore()
  })
})
