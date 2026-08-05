// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Finance decks. The British-MIS lesson from competitors.mdx: fee billing is
// the entry requirement for fee-paying schools, so this copy leads with
// collection, reconciliation and the regional payment rails.

import type { ShowcaseData } from "../../types"

const SHOT = "/features/shots"
const W = 1280
const H = 1000

export const financeShowcase: Record<string, ShowcaseData> = {
  payment: {
    eyebrow: "Payments",
    heading: "Every rail your parents use,\none reconciled ledger",
    cards: [
      {
        tag: "FEES",
        icon: "Wallet",
        title: "Fee structures that run themselves",
        description:
          "Structures, scholarships and fines assigned per grade — collection status visible the moment a payment lands.",
        image: `${SHOT}/fees.png`,
        width: W,
        height: H,
      },
      {
        tag: "INVOICES",
        icon: "Receipt",
        title: "Invoices that chase themselves",
        description:
          "Auto-generated per enrollment with due dates and status — reminders go out without anyone drafting emails.",
        image: `${SHOT}/invoice.png`,
        width: W,
        height: H,
      },
      {
        tag: "WALLETS",
        icon: "CreditCard",
        title: "School and family wallets",
        description:
          "Balances, top-ups and history per family — cash, bank transfer, Stripe, bankak or tap, all in the same ledger.",
        image: `${SHOT}/wallet.png`,
        width: W,
        height: H,
      },
    ],
  },

  accounting: {
    eyebrow: "Accounting",
    heading: "The whole school's money\non one screen",
    cards: [
      {
        tag: "OVERVIEW",
        icon: "BarChart3",
        title: "Revenue and expenses, live",
        description:
          "Income, spend and outstanding invoices charted monthly — the picture your board asks for, without the week of Excel.",
        image: `${SHOT}/finance.png`,
        width: W,
        height: H,
      },
      {
        tag: "EXPENSES",
        icon: "Banknote",
        title: "Every expense approved and filed",
        description:
          "Requests, approvals and receipts in one flow — spending stays inside the budget lines you set.",
        image: `${SHOT}/expenses.png`,
        width: W,
        height: H,
      },
      {
        tag: "FEES",
        icon: "Wallet",
        title: "Collection without the chase",
        description:
          "Fees, scholarships and fines reconcile into the same books as everything else — no side ledgers.",
        image: `${SHOT}/fees.png`,
        width: W,
        height: H,
      },
    ],
  },

  invoice: {
    eyebrow: "Invoicing",
    heading: "Billed, sent, paid, reconciled —\nwithout retyping a number",
    cards: [
      {
        tag: "AUTO-ISSUE",
        icon: "Receipt",
        title: "Invoices raise themselves",
        description:
          "Every enrollment provisions its invoices — numbered, dated and tracked from unpaid to settled.",
        image: `${SHOT}/invoice.png`,
        width: W,
        height: H,
      },
      {
        tag: "COLLECT",
        icon: "Wallet",
        title: "Every payment lands in the ledger",
        description:
          "Whatever the rail — cash, transfer, card, bankak, tap — the receipt reconciles automatically.",
        image: `${SHOT}/fees.png`,
        width: W,
        height: H,
      },
      {
        tag: "OVERSIGHT",
        icon: "LineChart",
        title: "Outstanding balances at a glance",
        description:
          "Unpaid, overdue and settled totals summarized live — follow up from the list, not from memory.",
        image: `${SHOT}/finance.png`,
        width: W,
        height: H,
      },
    ],
  },

  payroll: {
    eyebrow: "Payroll",
    heading: "Salaries out on time,\nevery month, no drama",
    cards: [
      {
        tag: "RUNS",
        icon: "Briefcase",
        title: "A payroll run in clicks",
        description:
          "Salary structures per role, allowances and deductions applied, slips generated — a run, not a late night.",
        image: `${SHOT}/payroll.png`,
        width: W,
        height: H,
      },
      {
        tag: "IN THE BOOKS",
        icon: "Banknote",
        title: "Payroll meets the ledger",
        description:
          "Runs post into the same books as fees and expenses, so the monthly picture is whole without re-entry.",
        image: `${SHOT}/expenses.png`,
        width: W,
        height: H,
      },
      {
        tag: "OVERVIEW",
        icon: "BarChart3",
        title: "Costs visible before they're spent",
        description:
          "Net salaries, pending approvals and paid-out totals in one view — finance and HR reading the same numbers.",
        image: `${SHOT}/finance.png`,
        width: W,
        height: H,
      },
    ],
  },

  expense: {
    eyebrow: "Expenses",
    heading: "Spending with receipts,\napprovals and a paper trail",
    cards: [
      {
        tag: "TRACK",
        icon: "Banknote",
        title: "Every expense in its category",
        description:
          "Log spend against budget lines with receipts attached — approved, pending and rejected all visible.",
        image: `${SHOT}/expenses.png`,
        width: W,
        height: H,
      },
      {
        tag: "THE PICTURE",
        icon: "BarChart3",
        title: "Straight into the monthly books",
        description:
          "Expenses chart against revenue automatically — the burn is never a surprise at term end.",
        image: `${SHOT}/finance.png`,
        width: W,
        height: H,
      },
    ],
  },
}
