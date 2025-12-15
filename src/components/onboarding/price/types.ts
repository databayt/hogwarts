export type BillingCycle = "monthly" | "quarterly" | "semester" | "annual"
export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD"
export type FeeType =
  | "tuition"
  | "registration"
  | "application"
  | "materials"
  | "activities"

export interface PriceData {
  tuitionFee: number
  registrationFee?: number
  applicationFee?: number
  materialsFee?: number
  activityFee?: number
  billingCycle: BillingCycle
  currency: Currency
  hasEarlyBirdDiscount: boolean
  hasSiblingDiscount: boolean
  hasScholarship: boolean
}

export interface PriceFormData {
  tuitionFee: number
  registrationFee?: number
  applicationFee?: number
  materialsFee?: number
  activityFee?: number
  billingCycle: BillingCycle
  currency: Currency
  hasEarlyBirdDiscount: boolean
  hasSiblingDiscount: boolean
  hasScholarship: boolean
}

export interface FeeConfig {
  id: FeeType
  label: string
  description: string
  required: boolean
  min: number
  max: number
  defaultValue?: number
}

export interface BillingOption {
  id: BillingCycle
  label: string
  description: string
  discountPercentage?: number
}

export interface CurrencyOption {
  code: Currency
  symbol: string
  name: string
  exchangeRate: number
}
