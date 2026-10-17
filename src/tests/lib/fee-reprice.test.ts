// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it, vi } from "vitest"

import { splitByWeights } from "@/lib/fee-invoice-sync"
import {
  recomputeAssignment,
  releaseGradeFees,
  repriceStructureAssignments,
} from "@/lib/fee-reprice"

vi.mock("@/lib/db", () => ({ db: {} }))
vi.mock("@/components/internationalization/dictionaries", () => ({
  getDictionary: vi.fn(),
}))

// ---------------------------------------------------------------------------
// A tiny in-memory client — just the reads/writes the cascade makes.
// ---------------------------------------------------------------------------

type Row = Record<string, any>

function fakeClient(seed: {
  structures: Row[]
  assignments: Row[]
  invoices?: Row[]
}) {
  const structures = seed.structures
  const assignments = seed.assignments
  const invoices = seed.invoices ?? []
  const withStructure = (a: Row) => ({
    ...a,
    feeStructure: structures.find((s) => s.id === a.feeStructureId),
    payments: (a.payments ?? []).filter((p: Row) => p.status === "SUCCESS"),
  })
  const statusIn = (status: unknown, value: string) => {
    if (status == null) return true
    if (typeof status === "string") return status === value
    const s = status as { in?: string[]; not?: string }
    if (s.in) return s.in.includes(value)
    if (s.not) return s.not !== value
    return true
  }

  return {
    feeStructure: {
      findFirst: async ({ where }: { where: Row }) =>
        structures.find((s) => s.id === where.id) ?? null,
    },
    feeAssignment: {
      findMany: async ({ where }: { where: Row }) =>
        assignments
          .filter(
            (a) =>
              (!where.feeStructureId ||
                a.feeStructureId === where.feeStructureId) &&
              (!where.studentId || a.studentId === where.studentId) &&
              (!where.academicYear || a.academicYear === where.academicYear) &&
              statusIn(where.status, a.status) &&
              (!where.payments?.none ||
                !(a.payments ?? []).some((p: Row) => p.status === "SUCCESS"))
          )
          .map(withStructure),
      findFirst: async ({ where }: { where: Row }) => {
        const a = assignments.find((x) => x.id === where.id)
        return a ? withStructure(a) : null
      },
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const a = assignments.find((x) => x.id === where.id)!
        Object.assign(a, data)
        return a
      },
    },
    userInvoice: {
      findMany: async ({ where }: { where: Row }) =>
        invoices
          .filter(
            (i) =>
              i.feeAssignmentId === where.feeAssignmentId &&
              statusIn(where.status, i.status)
          )
          .map((i) => ({ ...i, items: i.items ?? [] })),
      findFirst: async ({ where }: { where: Row }) =>
        invoices.find(
          (i) =>
            i.feeAssignmentId === where.feeAssignmentId &&
            (i.status === "PAID" || Number(i.amountPaid) > 0)
        ) ?? null,
      update: async ({ where, data }: { where: Row; data: Row }) => {
        const i = invoices.find((x) => x.id === where.id)!
        Object.assign(i, data)
        return i
      },
      updateMany: async ({ where, data }: { where: Row; data: Row }) => {
        for (const i of invoices) {
          if (
            i.feeAssignmentId === where.feeAssignmentId &&
            statusIn(where.status, i.status)
          )
            Object.assign(i, data)
        }
        return { count: 0 }
      },
    },
    userInvoiceItem: {
      update: async ({ where, data }: { where: Row; data: Row }) => {
        for (const inv of invoices)
          for (const it of inv.items ?? [])
            if (it.id === where.id) Object.assign(it, data)
        return {}
      },
      create: async ({ data }: { data: Row }) => {
        invoices.find((i) => i.id === data.invoiceId)!.items.push(data)
        return data
      },
    },
    _state: { assignments, invoices },
  }
}

function quarterly(assignmentId: string, total: number, prefix = "inv") {
  return [0, 1, 2, 3].map((i) => ({
    id: `${prefix}-${i}`,
    feeAssignmentId: assignmentId,
    status: "UNPAID",
    total: total / 4,
    amountPaid: 0,
    due_date: new Date(2026, i * 3, 1),
    items: [{ id: `${prefix}-${i}-item`, price: total / 4 }],
  }))
}

const SCHOOL = "school-1"

describe("splitByWeights", () => {
  it("always sums to the total, last share absorbs rounding", () => {
    const parts = splitByWeights(1000, [1, 1, 1])
    expect(parts).toEqual([333.33, 333.33, 333.34])
    expect(parts.reduce((s, p) => s + p, 0)).toBeCloseTo(1000, 2)
  })

  it("splits equally when every weight is zero", () => {
    expect(splitByWeights(100, [0, 0])).toEqual([50, 50])
  })
})

describe("repriceStructureAssignments — grade fee → students", () => {
  it("moves inheriting students, keeps own prices and paid fees", async () => {
    const client = fakeClient({
      structures: [{ id: "fs-g5", totalAmount: 1200 }],
      assignments: [
        // inherits, with a 100 discount
        {
          id: "a-inherit",
          feeStructureId: "fs-g5",
          status: "PENDING",
          customAmount: null,
          totalDiscount: 100,
          finalAmount: 900,
        },
        // fine-tuned student — keeps 900
        {
          id: "a-own",
          feeStructureId: "fs-g5",
          status: "PENDING",
          customAmount: 900,
          totalDiscount: 0,
          finalAmount: 900,
        },
        // paid something — untouched
        {
          id: "a-paid",
          feeStructureId: "fs-g5",
          status: "PARTIAL",
          customAmount: null,
          totalDiscount: 0,
          finalAmount: 1000,
          payments: [{ status: "SUCCESS" }],
        },
      ],
      invoices: quarterly("a-inherit", 900),
    })

    const r = await repriceStructureAssignments(
      SCHOOL,
      "fs-g5",
      client as never
    )

    expect(r).toEqual({ updated: 1, skippedPaid: 1, skippedOverridden: 1 })
    const byId = Object.fromEntries(
      client._state.assignments.map((a) => [a.id, a.finalAmount])
    )
    expect(byId).toEqual({ "a-inherit": 1100, "a-own": 900, "a-paid": 1000 })
    // 4 instalments now sum to the new amount — not 4 × the full amount.
    const totals = client._state.invoices.map((i) => i.total)
    expect(totals).toEqual([275, 275, 275, 275])
  })

  it("keeps settled instalments and spreads the rest over the open ones", async () => {
    const invoices = quarterly("a1", 1000)
    invoices[0].status = "PAID"
    const client = fakeClient({
      structures: [{ id: "fs", totalAmount: 1300 }],
      assignments: [
        {
          id: "a1",
          feeStructureId: "fs",
          status: "PENDING",
          customAmount: null,
          totalDiscount: 0,
          finalAmount: 1000,
        },
      ],
      invoices,
    })

    await repriceStructureAssignments(SCHOOL, "fs", client as never)

    expect(client._state.invoices.map((i) => i.total)).toEqual([
      250, 350, 350, 350,
    ])
  })
})

describe("recomputeAssignment — student own price", () => {
  it("own price wins over the grade fee, discount applies on top", async () => {
    const client = fakeClient({
      structures: [{ id: "fs", totalAmount: 1200 }],
      assignments: [
        {
          id: "a1",
          feeStructureId: "fs",
          status: "PENDING",
          customAmount: 900,
          totalDiscount: 50,
          finalAmount: 1200,
        },
      ],
      invoices: [
        {
          id: "i1",
          feeAssignmentId: "a1",
          status: "UNPAID",
          total: 1200,
          amountPaid: 0,
          items: [
            { id: "t", price: 1000 },
            { id: "e", price: 200 },
          ],
        },
      ],
    })

    const next = await recomputeAssignment(client as never, SCHOOL, "a1")

    expect(next).toBe(850)
    // Itemized invoice: lines keep their prices, the discount reconciles.
    expect(client._state.invoices[0]).toMatchObject({
      sub_total: 1200,
      discount: 350,
      total: 850,
    })
  })

  it("no own price → back on the grade fee", async () => {
    const client = fakeClient({
      structures: [{ id: "fs", totalAmount: 1200 }],
      assignments: [
        {
          id: "a1",
          feeStructureId: "fs",
          status: "PENDING",
          customAmount: null,
          totalDiscount: 0,
          finalAmount: 900,
        },
      ],
    })
    expect(await recomputeAssignment(client as never, SCHOOL, "a1")).toBe(1200)
  })
})

describe("releaseGradeFees — grade change / promotion", () => {
  const seed = () =>
    fakeClient({
      structures: [
        { id: "fs-g5", gradeId: "g5", isAutoGenerated: true },
        { id: "fs-g6", gradeId: "g6", isAutoGenerated: true },
        { id: "fs-bus", gradeId: null, isAutoGenerated: false },
        { id: "fs-g5-old", gradeId: "g5", isAutoGenerated: true },
      ],
      assignments: [
        {
          id: "old-grade",
          studentId: "s1",
          academicYear: "2026-2027",
          feeStructureId: "fs-g5",
          status: "PENDING",
        },
        {
          id: "new-grade",
          studentId: "s1",
          academicYear: "2026-2027",
          feeStructureId: "fs-g6",
          status: "PENDING",
        },
        {
          id: "school-wide",
          studentId: "s1",
          academicYear: "2026-2027",
          feeStructureId: "fs-bus",
          status: "PENDING",
        },
        {
          id: "last-year-arrears",
          studentId: "s1",
          academicYear: "2025-2026",
          feeStructureId: "fs-g5-old",
          status: "OVERDUE",
        },
      ],
      invoices: quarterly("old-grade", 1000),
    })

  it("cancels only this year's unpaid fee of the grade the student left", async () => {
    const client = seed()
    const released = await releaseGradeFees(client as never, {
      schoolId: SCHOOL,
      studentId: "s1",
      academicYear: "2026-2027",
      keepGradeId: "g6",
    })

    expect(released).toBe(1)
    const status = Object.fromEntries(
      client._state.assignments.map((a) => [a.id, a.status])
    )
    expect(status).toEqual({
      "old-grade": "CANCELLED",
      "new-grade": "PENDING",
      "school-wide": "PENDING",
      "last-year-arrears": "OVERDUE",
    })
    expect(client._state.invoices.every((i) => i.status === "CANCELLED")).toBe(
      true
    )
  })

  it("keeps a fee that has money against it", async () => {
    const client = seed()
    client._state.invoices[0].amountPaid = 100
    const released = await releaseGradeFees(client as never, {
      schoolId: SCHOOL,
      studentId: "s1",
      academicYear: "2026-2027",
      keepGradeId: "g6",
    })
    expect(released).toBe(0)
  })
})
