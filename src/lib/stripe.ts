import Stripe from "stripe"

import { env } from "@/env.mjs"

// Create Stripe instance only if API key is available
export const stripe = env.STRIPE_API_KEY ? new Stripe(env.STRIPE_API_KEY) : null

/**
 * Check if Stripe is configured and available
 * Use this before calling any Stripe methods
 */
export const isStripeConfigured = (): boolean => stripe !== null

/**
 * Get Stripe instance with type guard
 * Throws if Stripe is not configured
 */
export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Set STRIPE_API_KEY environment variable."
    )
  }
  return stripe
}

// Log configuration status at module load (only in development)
if (process.env.NODE_ENV === "development") {
  if (!stripe) {
    console.warn(
      "[Stripe] Payment features disabled - STRIPE_API_KEY not configured"
    )
  }
}
