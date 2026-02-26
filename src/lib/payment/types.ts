// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

export type PaymentGateway =
  | "stripe"
  | "tap"
  | "cash"
  | "bank_transfer"
  | "mobile_money"

export type PaymentContext =
  | "admission_fee"
  | "saas_subscription"
  | "tuition_fee"
  | "school_fee"
  | "salary_payout"
  | "course_enrollment"

export type PaymentDirection = "inbound" | "outbound"

export interface BankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  iban?: string
  swiftCode?: string
  reference: string
}

export interface PaymentCheckoutResult {
  method: PaymentGateway
  checkoutUrl?: string
  bankDetails?: BankDetails
  cashInstructions?: string
  referenceNumber: string
}

// --- Provider Adapter Pattern types ---

export interface CreateCheckoutParams {
  amount: number
  currency: string
  context: PaymentContext
  schoolId: string
  referenceId: string
  referenceNumber: string
  successUrl: string
  cancelUrl: string
  lineItems?: {
    name: string
    description?: string
    quantity: number
    unitAmount: number
  }[]
  metadata?: Record<string, string>
  customerEmail?: string
}

export interface CheckoutResult {
  success: boolean
  gateway: PaymentGateway
  checkoutUrl?: string
  sessionId?: string
  bankDetails?: BankDetails
  cashInstructions?: string
  mobileMoneyInstructions?: string
  referenceNumber: string
  error?: string
}

export interface PaymentProvider {
  id: PaymentGateway
  supportsCurrency(currency: string): boolean
  isConfigured(): boolean
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>
}
