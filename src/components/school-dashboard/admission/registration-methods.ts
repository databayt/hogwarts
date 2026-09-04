// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Registration-fee rails a person settles, as opposed to a payment gateway.
 *
 * "stripe" / "tap" (card / online) are confirmed automatically by their
 * webhook — never by hand, since only the webhook has proof the charge
 * settled. Everything here is confirmed by an admin or accountant who saw
 * the money arrive: cash at the office, a bank transfer, and Sudan's
 * Bankak / Cashi wallets (neither publishes a merchant API).
 *
 * Shared by the server action (`confirmRegistrationPayment`) and the
 * enrollment row menu so the two can never disagree — the row used to carry
 * its own copy without the wallets, so a Bankak or Cashi intent had no
 * confirm action at all while the server would happily have taken it.
 */
export const MANUALLY_CONFIRMABLE_REGISTRATION_METHODS: ReadonlySet<string> =
  new Set(["cash", "bank_transfer", "bankak", "cashi"])

export function isManuallyConfirmableRegistrationMethod(
  method: string | null | undefined
): boolean {
  return !!method && MANUALLY_CONFIRMABLE_REGISTRATION_METHODS.has(method)
}
