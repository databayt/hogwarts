// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { InvoiceStatus } from "@prisma/client"
import { describe, expect, it } from "vitest"

import {
  calculateDiscount,
  calculatePaymentSchedule,
  calculateSubtotal,
  calculateTax,
  calculateTotal,
  exportInvoiceToCSV,
  formatCurrency,
  formatDueStatus,
  formatInvoiceNumber,
  generateInvoiceNumber,
  getDaysOverdue,
  getDaysUntilDue,
  getInvoiceStatusColor,
  isInvoiceOverdue,
  validateInvoiceData,
} from "@/components/school-dashboard/finance/invoice/util"

// ============================================================================
// Tests
// ============================================================================

describe("calculateSubtotal", () => {
  it("returns 0 for empty array", () => {
    expect(calculateSubtotal([])).toBe(0)
  })

  it("calculates single item", () => {
    const items = [{ id: "1", item_name: "Fee", quantity: 2, price: 100 }]
    expect(calculateSubtotal(items)).toBe(200)
  })

  it("calculates multiple items", () => {
    const items = [
      { id: "1", item_name: "Tuition", quantity: 1, price: 5000 },
      { id: "2", item_name: "Library", quantity: 2, price: 50 },
      { id: "3", item_name: "Lab", quantity: 1, price: 300 },
    ]
    expect(calculateSubtotal(items)).toBe(5400)
  })
})

describe("calculateDiscount", () => {
  it("returns 0 for 0% discount", () => {
    expect(calculateDiscount(1000, 0)).toBe(0)
  })

  it("calculates 10% discount", () => {
    expect(calculateDiscount(1000, 10)).toBe(100)
  })

  it("calculates 100% discount", () => {
    expect(calculateDiscount(1000, 100)).toBe(1000)
  })
})

describe("calculateTax", () => {
  it("returns 0 for 0% tax", () => {
    expect(calculateTax(1000, 0)).toBe(0)
  })

  it("calculates 15% tax", () => {
    expect(calculateTax(1000, 15)).toBe(150)
  })
})

describe("calculateTotal", () => {
  const items = [{ id: "1", item_name: "Tuition", quantity: 1, price: 1000 }]

  it("calculates total without discount or tax", () => {
    const result = calculateTotal(items)
    expect(result.subtotal).toBe(1000)
    expect(result.discount).toBe(0)
    expect(result.tax).toBe(0)
    expect(result.total).toBe(1000)
  })

  it("calculates total with discount", () => {
    const result = calculateTotal(items, 0, 10)
    expect(result.discount).toBe(100)
    expect(result.total).toBe(900)
  })

  it("calculates total with tax", () => {
    const result = calculateTotal(items, 10, 0)
    expect(result.tax).toBe(100)
    expect(result.total).toBe(1100)
  })

  it("applies discount before tax", () => {
    const result = calculateTotal(items, 10, 10)
    expect(result.subtotal).toBe(1000)
    expect(result.discount).toBe(100)
    expect(result.taxableAmount).toBe(900)
    expect(result.tax).toBe(90)
    expect(result.total).toBe(990)
  })
})

describe("formatCurrency", () => {
  it("formats USD", () => {
    const result = formatCurrency(1000, "USD", "en-US")
    expect(result).toContain("1,000")
  })

  it("formats with default locale", () => {
    const result = formatCurrency(500)
    expect(result).toBeTruthy()
  })
})

describe("formatInvoiceNumber", () => {
  it("pads with zeros", () => {
    expect(formatInvoiceNumber("INV", 1)).toBe("INV-000001")
  })

  it("respects custom length", () => {
    expect(formatInvoiceNumber("INV", 42, 4)).toBe("INV-0042")
  })
})

describe("generateInvoiceNumber", () => {
  it("increments from last number", () => {
    expect(generateInvoiceNumber(5)).toBe("INV-000006")
  })

  it("uses custom prefix", () => {
    expect(generateInvoiceNumber(0, "BILL")).toBe("BILL-000001")
  })
})

describe("isInvoiceOverdue", () => {
  it("returns false for PAID invoices", () => {
    const pastDate = new Date("2020-01-01")
    expect(isInvoiceOverdue(pastDate, InvoiceStatus.PAID)).toBe(false)
  })

  it("returns false for CANCELLED invoices", () => {
    const pastDate = new Date("2020-01-01")
    expect(isInvoiceOverdue(pastDate, InvoiceStatus.CANCELLED)).toBe(false)
  })

  it("returns true for UNPAID with past due date", () => {
    const pastDate = new Date("2020-01-01")
    expect(isInvoiceOverdue(pastDate, InvoiceStatus.UNPAID)).toBe(true)
  })

  it("returns false for UNPAID with future due date", () => {
    const futureDate = new Date("2099-01-01")
    expect(isInvoiceOverdue(futureDate, InvoiceStatus.UNPAID)).toBe(false)
  })

  it("handles string dates", () => {
    expect(isInvoiceOverdue("2020-01-01", InvoiceStatus.UNPAID)).toBe(true)
  })
})

describe("getDaysOverdue", () => {
  it("returns 0 for future dates", () => {
    expect(getDaysOverdue(new Date("2099-01-01"))).toBe(0)
  })

  it("returns positive number for past dates", () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)
    expect(getDaysOverdue(pastDate)).toBeGreaterThanOrEqual(5)
  })
})

describe("getDaysUntilDue", () => {
  it("returns positive for future dates", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    expect(getDaysUntilDue(futureDate)).toBeGreaterThanOrEqual(9)
  })

  it("returns negative for past dates", () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 5)
    expect(getDaysUntilDue(pastDate)).toBeLessThan(0)
  })
})

describe("formatDueStatus", () => {
  it("returns 'Paid' for PAID status", () => {
    expect(formatDueStatus(new Date(), InvoiceStatus.PAID)).toBe("Paid")
  })

  it("returns 'Cancelled' for CANCELLED status", () => {
    expect(formatDueStatus(new Date(), InvoiceStatus.CANCELLED)).toBe(
      "Cancelled"
    )
  })

  it("returns 'Due today' for today", () => {
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    const result = formatDueStatus(today, InvoiceStatus.UNPAID)
    expect(result).toMatch(/Due today|Due tomorrow/)
  })

  it("returns overdue message for past dates", () => {
    const pastDate = new Date()
    pastDate.setDate(pastDate.getDate() - 3)
    const result = formatDueStatus(pastDate, InvoiceStatus.UNPAID)
    expect(result).toContain("Overdue")
  })

  it("returns 'Due in X days' for future dates", () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)
    const result = formatDueStatus(futureDate, InvoiceStatus.UNPAID)
    expect(result).toContain("Due in")
  })
})

describe("getInvoiceStatusColor", () => {
  it("returns green for PAID", () => {
    expect(getInvoiceStatusColor(InvoiceStatus.PAID)).toBe("green")
  })

  it("returns blue for UNPAID", () => {
    expect(getInvoiceStatusColor(InvoiceStatus.UNPAID)).toBe("blue")
  })

  it("returns red for OVERDUE", () => {
    expect(getInvoiceStatusColor(InvoiceStatus.OVERDUE)).toBe("red")
  })

  it("returns gray for CANCELLED", () => {
    expect(getInvoiceStatusColor(InvoiceStatus.CANCELLED)).toBe("gray")
  })
})

describe("validateInvoiceData", () => {
  const validData = {
    from: { name: "School" },
    to: { name: "Parent", email: "parent@test.com" },
    items: [{ id: "1", item_name: "Fee", quantity: 1, price: 100 }],
    status: InvoiceStatus.UNPAID,
  }

  it("returns no errors for valid data", () => {
    expect(validateInvoiceData(validData)).toHaveLength(0)
  })

  it("returns error for missing client name", () => {
    const errors = validateInvoiceData({
      ...validData,
      to: { name: "", email: "test@test.com" },
    } as any)
    expect(errors).toContain("Client name is required")
  })

  it("returns error for invalid email", () => {
    const errors = validateInvoiceData({
      ...validData,
      to: { name: "Test", email: "bad" },
    } as any)
    expect(errors).toContain("Valid client email is required")
  })

  it("returns error for empty items", () => {
    const errors = validateInvoiceData({ ...validData, items: [] })
    expect(errors).toContain("At least one item is required")
  })

  it("returns error for item with empty name", () => {
    const errors = validateInvoiceData({
      ...validData,
      items: [{ id: "1", item_name: "", quantity: 1, price: 100 }],
    })
    expect(errors.some((e) => e.includes("Name is required"))).toBe(true)
  })

  it("returns error for item with zero quantity", () => {
    const errors = validateInvoiceData({
      ...validData,
      items: [{ id: "1", item_name: "Fee", quantity: 0, price: 100 }],
    })
    expect(errors.some((e) => e.includes("Quantity"))).toBe(true)
  })
})

describe("exportInvoiceToCSV", () => {
  it("generates CSV with headers and items", () => {
    const csv = exportInvoiceToCSV({
      from: { name: "School" },
      to: { name: "Student", email: "s@t.com" },
      items: [{ id: "1", item_name: "Tuition", quantity: 2, price: 500 }],
      sub_total: 1000,
      total: 1000,
      status: InvoiceStatus.UNPAID,
    })

    expect(csv).toContain("Item,Quantity,Price,Amount")
    expect(csv).toContain("Tuition")
    expect(csv).toContain("Subtotal")
    expect(csv).toContain("Total")
  })
})

describe("calculatePaymentSchedule", () => {
  const startDate = new Date("2026-01-01")

  it("generates weekly schedule", () => {
    const dates = calculatePaymentSchedule(startDate, "weekly", 4)
    expect(dates).toHaveLength(4)
    expect(dates[1].getDate()).toBe(8)
  })

  it("generates monthly schedule", () => {
    const dates = calculatePaymentSchedule(startDate, "monthly", 3)
    expect(dates).toHaveLength(3)
    expect(dates[1].getMonth()).toBe(1) // February
    expect(dates[2].getMonth()).toBe(2) // March
  })

  it("generates quarterly schedule", () => {
    const dates = calculatePaymentSchedule(startDate, "quarterly", 2)
    expect(dates).toHaveLength(2)
    expect(dates[1].getMonth()).toBe(3) // April
  })

  it("generates yearly schedule", () => {
    const dates = calculatePaymentSchedule(startDate, "yearly", 2)
    expect(dates).toHaveLength(2)
    expect(dates[1].getFullYear()).toBe(2027)
  })

  it("returns empty array for 0 occurrences", () => {
    expect(calculatePaymentSchedule(startDate, "monthly", 0)).toHaveLength(0)
  })
})
