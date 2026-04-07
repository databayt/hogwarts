// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

const createAddressSchema = (v: ValidationHelper) =>
  z.object({
    name: z.string().min(1, v.required()),
    email: z.string().email(v.email()).optional().or(z.literal("")),
    address1: z.string().min(1, v.required()),
    address2: z.string().optional(),
    address3: z.string().optional(),
  })

export const createDetailsSchema = (v: ValidationHelper) =>
  z.object({
    invoice_no: z.string().min(1, v.required()),
    invoice_date: z.coerce.date({ message: v.required() }),
    due_date: z.coerce.date({ message: v.required() }),
    currency: z.string().min(1, v.required()),
    from: createAddressSchema(v),
    to: createAddressSchema(v),
    notes: z.string().optional(),
    status: z
      .enum(["UNPAID", "PAID", "OVERDUE", "CANCELLED"])
      .default("UNPAID"),
  })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

const addressSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  address1: z.string().min(1, "Address line 1 is required"),
  address2: z.string().optional(),
  address3: z.string().optional(),
})

export const detailsSchema = z.object({
  invoice_no: z.string().min(1, "Invoice number is required"),
  invoice_date: z.coerce.date({ message: "Invoice date is required" }),
  due_date: z.coerce.date({ message: "Due date is required" }),
  currency: z.string().min(1, "Currency is required"),
  from: addressSchema,
  to: addressSchema,
  notes: z.string().optional(),
  status: z.enum(["UNPAID", "PAID", "OVERDUE", "CANCELLED"]).default("UNPAID"),
})

export type DetailsFormData = z.infer<typeof detailsSchema>
