import { z } from "zod"

// Bank Account Schemas
export const BankAccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  bankId: z.string(),
  accountId: z.string(),
  accessToken: z.string(),
  fundingSourceUrl: z.string().url().optional(),
  shareableId: z.string().optional(),
  institutionId: z.string(),
  name: z.string(),
  currentBalance: z.number().min(0),
  availableBalance: z.number().min(0),
  officialName: z.string().optional(),
  mask: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  type: z.enum(["depository", "credit", "loan", "investment"]),
  subtype: z.string(),
})

export const ConnectBankSchema = z.object({
  publicToken: z.string().min(1, "Public token is required"),
  institutionId: z.string().min(1, "Institution ID is required"),
  accountId: z.string().min(1, "Account ID is required"),
  userId: z.string().min(1, "User ID is required"),
})

// Transaction Schemas
export const TransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.number(),
  date: z.string().or(z.date()),
  name: z.string(),
  paymentChannel: z.enum(["online", "in_store", "other"]).optional(),
  type: z.enum(["debit", "credit"]),
  pending: z.boolean(),
  category: z.string(),
  subcategory: z.string().optional(),
  merchantName: z.string().optional(),
})

// Transfer Schemas
export const TransferSchema = z.object({
  senderBankId: z.string().min(1, "Please select a source bank account"),
  recipientEmail: z.string().email("Invalid recipient email"),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format")
    .refine((val) => parseFloat(val) > 0, "Amount must be greater than 0")
    .refine(
      (val) => parseFloat(val) <= 10000,
      "Maximum transfer amount is $10,000"
    ),
  note: z.string().max(200, "Note must be less than 200 characters").optional(),
})

// Payment Method Schemas
export const PaymentMethodSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["bank_account", "debit_card", "credit_card"]),
  last4: z.string().regex(/^\d{4}$/),
  bankName: z.string().optional(),
  isDefault: z.boolean().default(false),
})

// Type Exports
export type BankAccount = z.infer<typeof BankAccountSchema>
export type ConnectBankInput = z.infer<typeof ConnectBankSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type TransferInput = z.infer<typeof TransferSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
