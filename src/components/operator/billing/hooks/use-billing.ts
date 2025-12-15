"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

import { InvoiceRow } from "../columns"
import { billingSearchParams } from "../validation"

interface BillingData {
  rows: InvoiceRow[]
  pageCount: number
}

export function useBillingData() {
  const [data, setData] = useState<BillingData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const searchParams = useSearchParams()

  useEffect(() => {
    async function fetchBillingData() {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams(searchParams)
        const response = await fetch(`/api/billing?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch billing data")
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchBillingData()
  }, [searchParams])

  return { data, isLoading, error }
}
