// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Bank Receipt Extraction Schema
 * Zod schema for validating AI-extracted data from bank transfer receipts
 */

import { z } from "zod"

// ============================================
// PAYMENT METHOD ENUM
// ============================================

export const bankReceiptPaymentMethodSchema = z.enum([
  "bank_transfer",
  "check",
  "cash_deposit",
  "online",
])

export type BankReceiptPaymentMethod = z.infer<
  typeof bankReceiptPaymentMethodSchema
>

// ============================================
// BANK RECEIPT EXTRACTION SCHEMA
// ============================================

export const bankReceiptExtractionSchema = z.object({
  bankName: z
    .string()
    .optional()
    .describe(
      "Name of the bank (e.g., Al Rajhi Bank, Saudi National Bank). If in Arabic, provide the Arabic name"
    ),
  accountNumber: z
    .string()
    .optional()
    .describe(
      "Account number, masked to show only last 4 digits (e.g., ****1234). If IBAN, extract last 4 digits"
    ),
  transferDate: z
    .string()
    .optional()
    .describe(
      "Date of the transfer in ISO 8601 format (YYYY-MM-DD). Convert Hijri dates to Gregorian if possible. Omit if not clearly visible on the document"
    ),
  amount: z
    .number()
    .optional()
    .describe(
      "Transfer amount as a decimal number (e.g., 1500.00). Extract the numeric value only. Omit if not clearly visible on the document"
    ),
  currency: z
    .string()
    .default("SAR")
    .describe(
      "Currency code (e.g., SAR, USD, AED). Default to SAR if not explicitly stated"
    ),
  referenceNumber: z
    .string()
    .optional()
    .describe(
      "Transaction reference number, confirmation number, or receipt number from the bank"
    ),
  senderName: z
    .string()
    .optional()
    .describe(
      "Name of the person or entity who sent the transfer (payer/sender)"
    ),
  receiverName: z
    .string()
    .optional()
    .describe(
      "Name of the person or entity who received the transfer (beneficiary/receiver)"
    ),
  paymentMethod: bankReceiptPaymentMethodSchema
    .default("bank_transfer")
    .describe(
      "Payment method: bank_transfer (wire/SWIFT), check, cash_deposit (ATM/branch deposit), online (app/web transfer)"
    ),
  notes: z
    .string()
    .optional()
    .describe(
      "Any additional notes, memo, or purpose of payment mentioned on the receipt"
    ),
})

export type BankReceiptExtractedData = z.infer<
  typeof bankReceiptExtractionSchema
>

// ============================================
// EXTRACTION PROMPT
// ============================================

export const bankReceiptSystemMessage = `You are a financial document extraction specialist. You extract structured data from bank transfer receipts, deposit slips, and payment confirmations. You handle documents in both Arabic and English, including Saudi Arabian bank receipts with Hijri dates.`

export const bankReceiptExtractionPrompt = `Extract all information from this bank transfer receipt or payment confirmation.

Instructions:
1. Extract the bank name exactly as shown (keep Arabic if the document is in Arabic)
2. Extract the account number but mask it to show only the last 4 digits (e.g., ****1234)
3. Extract the transfer date in ISO 8601 format (YYYY-MM-DD). If the date is in Hijri calendar, convert it to Gregorian
4. Extract the exact transfer amount as a decimal number
5. Identify the currency (default to SAR if not explicitly stated on a Saudi bank receipt)
6. Extract any reference number, confirmation number, or transaction ID
7. Extract sender (payer) and receiver (beneficiary) names
8. Determine the payment method based on the document type:
   - "bank_transfer" for wire transfers, SWIFT, or inter-bank transfers
   - "check" for check deposits or check images
   - "cash_deposit" for ATM deposits or branch cash deposits
   - "online" for mobile banking or web banking transfer confirmations
9. Extract any notes, memo, or purpose of payment

Common Saudi bank receipt formats:
- Al Rajhi Bank (مصرف الراجحي): Look for "رقم العملية" (transaction number), "المبلغ" (amount)
- Saudi National Bank (البنك الأهلي): Look for "رقم المرجع" (reference number)
- Riyad Bank (بنك الرياض): Look for "رقم الحوالة" (transfer number)
- Online banking screenshots often show amount, date, and reference in a summary card

If any information is not clearly visible, omit it rather than guessing.
Ensure amounts are extracted as exact decimal numbers (e.g., 1500.00, not "1,500 SAR").`
