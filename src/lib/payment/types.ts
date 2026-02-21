export type PaymentGateway = "stripe" | "cash" | "bank_transfer" | "tap"

export type PaymentMethodType =
  | "CARD"
  | "CASH"
  | "BANK_TRANSFER"
  | "APPLE_PAY"
  | "MADA"
  | "STCPAY"
  | "KNET"
  | "BENEFIT"
  | "FAWRY"

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
