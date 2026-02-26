// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Stripe from "stripe"

import { env } from "@/env.mjs"

// Create Stripe instance only if API key is available
// This prevents crashes when STRIPE_API_KEY is not configured
export const stripe = env.STRIPE_API_KEY ? new Stripe(env.STRIPE_API_KEY) : null
