// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Every payment rail. Single source of truth — derive both the type and any
 * Zod enum from this array rather than re-listing the members, which is how
 * `mobile_money` survived in a validator after the provider was long dead.
 */
export const PAYMENT_GATEWAYS = [
  "stripe",
  "tap",
  "bankak",
  "cashi",
  "cash",
  "bank_transfer",
] as const

export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number]

/**
 * Rails that settle outside the app: the school publishes account details, the
 * payer transfers, then submits a reference + proof for a human to verify.
 * There is no redirect and no webhook for these — see `providers/bankak.ts`.
 */
export const MANUAL_GATEWAYS = [
  "bankak",
  "cashi",
  "cash",
  "bank_transfer",
] as const satisfies readonly PaymentGateway[]

export type ManualGateway = (typeof MANUAL_GATEWAYS)[number]

export function isManualGateway(
  gateway: PaymentGateway
): gateway is ManualGateway {
  return (MANUAL_GATEWAYS as readonly PaymentGateway[]).includes(gateway)
}

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

/**
 * Mobile-wallet account the payer sends to on a manual rail (Bankak, Cashi).
 * Distinct from `BankDetails`: a wallet has no IBAN/SWIFT, but may carry a QR
 * the payer scans in their app instead of typing an account number.
 */
export interface WalletDetails {
  provider: Extract<PaymentGateway, "bankak" | "cashi">
  accountName: string
  /** Bankak account number, or Cashi merchant code. */
  accountNumber: string
  qrUrl?: string
  instructions?: string
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
  /** Set by the wallet rails (bankak/cashi) — what the payer sends to. */
  wallet?: WalletDetails
  referenceNumber: string
  error?: string
}

export interface PaymentProvider {
  id: PaymentGateway
  supportsCurrency(currency: string): boolean
  isConfigured(): boolean
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>
}
