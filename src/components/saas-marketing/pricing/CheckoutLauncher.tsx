"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect } from "react"

import { generateUserStripe } from "./actions/generate-user-stripe"

export function CheckoutLauncher({ price }: { price: string }) {
  useEffect(() => {
    const submit = async () => {
      try {
        await generateUserStripe(price)
      } catch {
        // no-op; generateUserStripe will redirect on success
      }
    }
    void submit()
  }, [price])

  return null
}
