import z from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createOnboardingSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    firstName: z
      .string()
      .min(3, { message: v.get("firstNameRequired") })
      .max(50, { message: v.maxLength(50) }),
    lastName: z
      .string()
      .min(3, { message: v.get("lastNameRequired") })
      .max(50, { message: v.maxLength(50) }),
    currency: z.string({ message: v.get("currencyRequired") }).optional(),
  })
}

export function createInvoiceSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    invoice_no: z.string().min(1, { message: v.get("invoiceNumberRequired") }),
    invoice_date: z.date({ message: v.get("dateRequired") }),
    due_date: z.date({ message: v.get("dueDateRequired") }),
    currency: z.string().min(1, { message: v.get("currencyRequired") }),
    from: z.object({
      name: z
        .string()
        .min(3, { message: v.get("nameRequired") })
        .max(100, { message: v.maxLength(100) }),
      email: z.string().email({ message: v.email() }),
      address1: z.string().min(5, { message: v.get("addressRequired") }),
      address2: z.string().optional(),
      address3: z.string().optional(),
    }),
    to: z.object({
      name: z
        .string()
        .min(3, { message: v.get("nameRequired") })
        .max(100, { message: v.maxLength(100) }),
      email: z.string().email({ message: v.email() }),
      address1: z.string().min(5, { message: v.get("addressRequired") }),
      address2: z.string().optional(),
      address3: z.string().optional(),
    }),
    items: z
      .array(
        z.object({
          item_name: z
            .string()
            .min(3, { message: v.get("nameRequired") })
            .max(100, { message: v.maxLength(100) }),
          quantity: z
            .number()
            .min(0, { message: v.get("quantityCantBeNegative") }),
          price: z.number().min(0, { message: v.get("pricePositive") }),
          total: z.number().min(0, { message: v.get("totalRequired") }),
        })
      )
      .min(1, { message: v.get("atLeastOne") }),
    sub_total: z.number().min(0, { message: v.get("nonNegative") }),
    discount: z
      .number()
      .min(0, { message: v.get("nonNegative") })
      .optional(),
    tax_percentage: z
      .number()
      .min(0, { message: v.get("nonNegative") })
      .optional(),
    total: z.number().min(0, { message: v.get("totalRequired") }),
    notes: z.string().optional(),
    status: z.enum(["UNPAID", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  })
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const onboardingSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "First name is required" })
    .max(50, { message: "First Name max 50 character" }),
  lastName: z
    .string()
    .min(3, { message: "Last name is required" })
    .max(50, { message: "Last Name max 50 character" }),
  currency: z.string({ message: "Select currency" }).optional(),
})

export const InvoiceSchemaZod = z.object({
  invoice_no: z.string().min(1, { message: "Invoice number is required" }),
  invoice_date: z.date({ message: "Invoice date is required" }),
  due_date: z.date({ message: "Due date is required" }),
  currency: z.string().min(1, { message: "Currency is required" }),
  from: z.object({
    name: z
      .string()
      .min(3, { message: "Name is required" })
      .max(100, { message: "Name max 100 character" }),
    email: z.string().email({ message: "Valid email is required" }),
    address1: z.string().min(5, { message: "Address is required" }),
    address2: z.string().optional(),
    address3: z.string().optional(),
  }),
  to: z.object({
    name: z
      .string()
      .min(3, { message: "Name is required" })
      .max(100, { message: "Name max 100 character" }),
    email: z.string().email({ message: "Valid email is required" }),
    address1: z.string().min(5, { message: "Address is required" }),
    address2: z.string().optional(),
    address3: z.string().optional(),
  }),
  items: z
    .array(
      z.object({
        item_name: z
          .string()
          .min(3, { message: "Item name is required" })
          .max(100, { message: "Max character will be 100" }),
        quantity: z.number().min(0, { message: "Quantity can't be negative" }),
        price: z.number().min(0, { message: "Price can't be negative" }),
        total: z.number().min(0, { message: "Total is required" }),
      })
    )
    .min(1, { message: "At least one item is required" }),
  sub_total: z.number().min(0, { message: "Sub total can't be negative" }),
  discount: z
    .number()
    .min(0, { message: "Discount can't be negative" })
    .optional(),
  tax_percentage: z
    .number()
    .min(0, { message: "Tax percentage can't be negative" })
    .optional(),
  total: z.number().min(0, { message: "Total is required" }),
  notes: z.string().optional(),
  status: z.enum(["UNPAID", "PAID", "OVERDUE", "CANCELLED"]).optional(),
})
