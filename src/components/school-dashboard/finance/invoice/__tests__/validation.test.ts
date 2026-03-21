// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { InvoiceSchemaZod } from "../validation"

// ============================================================================
// Tests
// ============================================================================

describe("InvoiceSchemaZod", () => {
  const validData = {
    invoice_no: "I26001",
    invoice_date: new Date("2026-03-01"),
    due_date: new Date("2026-04-01"),
    currency: "USD",
    from: {
      name: "Test School",
      email: "school@test.com",
      address1: "123 School Street",
    },
    to: {
      name: "Student Parent",
      email: "parent@test.com",
      address1: "456 Home Avenue",
    },
    items: [
      { item_name: "Tuition Fee", quantity: 1, price: 5000, total: 5000 },
    ],
    sub_total: 5000,
    total: 5000,
  }

  // ==========================================================================
  // Valid data
  // ==========================================================================

  it("accepts valid complete invoice data", () => {
    const result = InvoiceSchemaZod.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it("accepts valid data with all optional fields", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      discount: 10,
      tax_percentage: 5,
      notes: "Payment terms: Net 30",
      status: "UNPAID",
      from: { ...validData.from, address2: "Suite 100", address3: "Floor 2" },
      to: { ...validData.to, address2: "Apt 5B" },
    })
    expect(result.success).toBe(true)
  })

  it("accepts all valid status values", () => {
    const statuses = ["UNPAID", "PAID", "OVERDUE", "CANCELLED"]
    for (const status of statuses) {
      const result = InvoiceSchemaZod.safeParse({ ...validData, status })
      expect(result.success).toBe(true)
    }
  })

  it("accepts data without optional status", () => {
    const result = InvoiceSchemaZod.safeParse(validData)
    expect(result.success).toBe(true)
  })

  // ==========================================================================
  // Required field validation
  // ==========================================================================

  it("rejects missing invoice_no", () => {
    const { invoice_no, ...data } = validData
    const result = InvoiceSchemaZod.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects empty invoice_no", () => {
    const result = InvoiceSchemaZod.safeParse({ ...validData, invoice_no: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing invoice_date", () => {
    const { invoice_date, ...data } = validData
    const result = InvoiceSchemaZod.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing due_date", () => {
    const { due_date, ...data } = validData
    const result = InvoiceSchemaZod.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects missing currency", () => {
    const { currency, ...data } = validData
    const result = InvoiceSchemaZod.safeParse(data)
    expect(result.success).toBe(false)
  })

  it("rejects empty currency", () => {
    const result = InvoiceSchemaZod.safeParse({ ...validData, currency: "" })
    expect(result.success).toBe(false)
  })

  // ==========================================================================
  // Address validation
  // ==========================================================================

  it("rejects from name shorter than 3 characters", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      from: { ...validData.from, name: "AB" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects from name longer than 100 characters", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      from: { ...validData.from, name: "A".repeat(101) },
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid from email", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      from: { ...validData.from, email: "not-an-email" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects from address1 shorter than 5 characters", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      from: { ...validData.from, address1: "ABC" },
    })
    expect(result.success).toBe(false)
  })

  it("rejects invalid to email", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      to: { ...validData.to, email: "bad" },
    })
    expect(result.success).toBe(false)
  })

  // ==========================================================================
  // Items validation
  // ==========================================================================

  it("rejects empty items array", () => {
    const result = InvoiceSchemaZod.safeParse({ ...validData, items: [] })
    expect(result.success).toBe(false)
  })

  it("rejects item with quantity 0", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      items: [{ item_name: "Tuition", quantity: 0, price: 5000, total: 0 }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects item with negative price", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      items: [{ item_name: "Tuition", quantity: 1, price: -100, total: -100 }],
    })
    expect(result.success).toBe(false)
  })

  it("rejects item with name shorter than 3 characters", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      items: [{ item_name: "AB", quantity: 1, price: 100, total: 100 }],
    })
    expect(result.success).toBe(false)
  })

  it("accepts multiple items", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      items: [
        { item_name: "Tuition Fee", quantity: 1, price: 3000, total: 3000 },
        { item_name: "Library Fee", quantity: 2, price: 500, total: 1000 },
        { item_name: "Lab Materials", quantity: 1, price: 1000, total: 1000 },
      ],
      sub_total: 5000,
      total: 5000,
    })
    expect(result.success).toBe(true)
  })

  // ==========================================================================
  // Amount validation
  // ==========================================================================

  it("rejects negative sub_total", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      sub_total: -100,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative discount", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      discount: -5,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative tax_percentage", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      tax_percentage: -10,
    })
    expect(result.success).toBe(false)
  })

  it("rejects negative total", () => {
    const result = InvoiceSchemaZod.safeParse({ ...validData, total: -1 })
    expect(result.success).toBe(false)
  })

  it("accepts zero amounts", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      sub_total: 0,
      total: 0,
      discount: 0,
      tax_percentage: 0,
    })
    expect(result.success).toBe(true)
  })

  // ==========================================================================
  // Invalid status
  // ==========================================================================

  it("rejects invalid status value", () => {
    const result = InvoiceSchemaZod.safeParse({
      ...validData,
      status: "INVALID",
    })
    expect(result.success).toBe(false)
  })
})
