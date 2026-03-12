// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

const invoiceItemSchema = z.object({
  item_name: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  total: z.coerce.number().min(0, "Total must be 0 or greater"),
})

export const itemsSchema = z.object({
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  sub_total: z.coerce.number().min(0),
  discount: z.coerce.number().min(0).optional(),
  tax_percentage: z.coerce.number().min(0).max(100).optional(),
  total: z.coerce.number().min(0),
})

export type InvoiceItemFormData = z.infer<typeof invoiceItemSchema>
export type ItemsFormData = z.infer<typeof itemsSchema>
