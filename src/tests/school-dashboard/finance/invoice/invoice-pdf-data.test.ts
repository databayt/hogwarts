// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  mapInvoiceToInvoiceData,
  type InvoiceForPdf,
} from "@/components/school-dashboard/finance/invoice/invoice-pdf-data"

const baseInvoice: InvoiceForPdf = {
  invoice_no: "ENR-2026-ABC123",
  invoice_date: "2026-09-01",
  due_date: "2026-10-01",
  status: "UNPAID",
  currency: "AED",
  sub_total: "5000",
  discount: null,
  tax_percentage: null,
  total: "5000",
  notes: "Auto-generated from enrollment",
  from: { name: "Al Dar School", email: "billing@aldar.ae" },
  to: { name: "Ahmed Ali", email: "ahmed@example.com" },
  items: [{ item_name: "Q1 Tuition", quantity: 1, price: "5000" }],
}

describe("mapInvoiceToInvoiceData", () => {
  it("maps core fields, items, school + client identity, and currency", () => {
    const d = mapInvoiceToInvoiceData(baseInvoice, "en")

    expect(d.invoiceNumber).toBe("ENR-2026-ABC123")
    expect(d.currency).toBe("AED")
    expect(d.schoolName).toBe("Al Dar School")
    expect(d.clientName).toBe("Ahmed Ali")
    expect(d.clientEmail).toBe("ahmed@example.com")
    expect(d.items).toEqual([
      { description: "Q1 Tuition", quantity: 1, unitPrice: 5000, total: 5000 },
    ])
    expect(d.subtotal).toBe(5000)
    expect(d.total).toBe(5000)
    expect(d.status).toBe("pending") // UNPAID → pending
  })

  it("maps status enum values to the template's display status", () => {
    expect(
      mapInvoiceToInvoiceData({ ...baseInvoice, status: "PAID" }, "en").status
    ).toBe("paid")
    expect(
      mapInvoiceToInvoiceData({ ...baseInvoice, status: "OVERDUE" }, "en")
        .status
    ).toBe("overdue")
    expect(
      mapInvoiceToInvoiceData({ ...baseInvoice, status: "CANCELLED" }, "en")
        .status
    ).toBe("cancelled")
    expect(
      mapInvoiceToInvoiceData({ ...baseInvoice, status: "PARTIAL" }, "en")
        .status
    ).toBe("pending")
    // Unknown status degrades gracefully.
    expect(
      mapInvoiceToInvoiceData({ ...baseInvoice, status: "WEIRD" }, "en").status
    ).toBe("pending")
  })

  it("computes tax from percentage and includes discount only when > 0", () => {
    const d = mapInvoiceToInvoiceData(
      { ...baseInvoice, tax_percentage: "5", discount: "200" },
      "en"
    )
    // tax = 5000 * 5% = 250
    expect(d.taxAmount).toBe(250)
    expect(d.discount).toBe(200)
  })

  it("omits tax/discount when zero/absent and defaults currency to USD", () => {
    const d = mapInvoiceToInvoiceData(
      { ...baseInvoice, currency: null, tax_percentage: "0", discount: "0" },
      "en"
    )
    expect(d.taxAmount).toBeUndefined()
    expect(d.discount).toBeUndefined()
    expect(d.currency).toBe("USD")
  })

  it("multiplies quantity by unit price for the line total", () => {
    const d = mapInvoiceToInvoiceData(
      {
        ...baseInvoice,
        items: [{ item_name: "Bus", quantity: 3, price: "200" }],
      },
      "en"
    )
    expect(d.items[0]).toEqual({
      description: "Bus",
      quantity: 3,
      unitPrice: 200,
      total: 600,
    })
  })
})
