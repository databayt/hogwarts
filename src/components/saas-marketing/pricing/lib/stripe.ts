// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Stripe from "stripe"

import { env } from "@/env.mjs"

// Pin the Stripe API version explicitly so the response shape is deterministic
// across SDK bumps. Under this version (clover, 2025-03+) `current_period_end`
// lives on the subscription ITEM, not the subscription object — webhook code
// must read it from `subscription.items.data[0].current_period_end`.
const STRIPE_API_VERSION = "2025-11-17.clover" as const

// Create Stripe instance only if API key is available
// This prevents crashes when STRIPE_API_KEY is not configured
export const stripe = env.STRIPE_API_KEY
  ? new Stripe(env.STRIPE_API_KEY, { apiVersion: STRIPE_API_VERSION })
  : null
