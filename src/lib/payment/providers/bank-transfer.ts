// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type {
  BankDetails,
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
} from "../types"

/**
 * Bank transfer payment provider.
 * Records intent to pay via bank transfer and returns bank details.
 * Always configured, supports all currencies.
 */
export const bankTransferProvider: PaymentProvider = {
  id: "bank_transfer",

  supportsCurrency(): boolean {
    return true
  },

  isConfigured(): boolean {
    return true
  },

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    // Bank details are passed through metadata from the caller
    // (resolved from school settings at the action layer)
    const bankDetails: BankDetails | undefined = params.metadata?.bankName
      ? {
          bankName: params.metadata.bankName,
          accountName: params.metadata.accountName ?? "",
          accountNumber: params.metadata.accountNumber ?? "",
          iban: params.metadata.iban,
          swiftCode: params.metadata.swiftCode,
          reference: params.referenceNumber,
        }
      : undefined

    return {
      success: true,
      gateway: "bank_transfer",
      referenceNumber: params.referenceNumber,
      bankDetails,
    }
  },
}
